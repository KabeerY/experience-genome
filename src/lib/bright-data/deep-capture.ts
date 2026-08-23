import "server-only";

import { chromium, type Browser, type CDPSession, type Page } from "playwright-core";
import { z } from "zod";

const statusSchema = z.object({ customer: z.string().min(1) });
const passwordSchema = z.object({ passwords: z.array(z.string().min(1)).min(1) });
const screenshotSchema = z.object({ data: z.string().min(20) });

export type RenderedMoment = {
  order: number;
  imageDataUrl: string;
  scrollY: number;
  scrollProgress: number;
  viewport: { width: number; height: number };
  visibleHeadings: string[];
  runningAnimations: number;
  fixedElements: number;
  stickyElements: number;
  transformedElements: number;
};

export type RenderedJourney = {
  moments: RenderedMoment[];
};

type EndpointCache = { endpoint: string; expiresAt: number };
let endpointCache: EndpointCache | null = null;

const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function connectToRenderedBrowser(endpoint: string) {
  const retryDelays = [0, 1_500, 3_500];
  let lastError: unknown;

  for (const delay of retryDelays) {
    if (delay) await sleep(delay);
    try {
      return await chromium.connectOverCDP(endpoint, { timeout: 12_000 });
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("browser_in_use")) throw error;
    }
  }

  throw lastError;
}

async function brightDataJson(path: string, apiToken: string) {
  const response = await fetch(`https://api.brightdata.com${path}`, {
    headers: { Authorization: `Bearer ${apiToken}` },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Browser credential request returned ${response.status}.`);
  return response.json() as Promise<unknown>;
}

async function getBrowserEndpoint(apiToken: string, zone: string) {
  if (endpointCache && endpointCache.expiresAt > Date.now()) return endpointCache.endpoint;

  const [statusPayload, passwordPayload] = await Promise.all([
    brightDataJson("/status", apiToken),
    brightDataJson(`/zone/passwords?zone=${encodeURIComponent(zone)}`, apiToken),
  ]);
  const { customer } = statusSchema.parse(statusPayload);
  const { passwords } = passwordSchema.parse(passwordPayload);
  const username = `brd-customer-${customer}-zone-${zone}`;
  const endpoint = `wss://${encodeURIComponent(username)}:${encodeURIComponent(passwords[0])}@brd.superproxy.io:9222`;
  endpointCache = { endpoint, expiresAt: Date.now() + 10 * 60 * 1000 };
  return endpoint;
}

async function waitForLoadingScreen(page: Page) {
  await page
    .waitForFunction(
      () => {
        const exactLoaderText = /^(?:loading\s*\.{0,3}|\d{1,3}%)$/i;
        const visibleLoaders = [...document.querySelectorAll("body *")].filter((element) => {
          const text = element.textContent?.trim() ?? "";
          if (!exactLoaderText.test(text) || element.children.length > 0) return false;
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return (
            rect.width > 0 &&
            rect.height > 0 &&
            rect.bottom > 0 &&
            rect.top < innerHeight &&
            style.visibility !== "hidden" &&
            style.display !== "none" &&
            Number(style.opacity || 1) > 0.1
          );
        });
        return visibleLoaders.length === 0;
      },
      { timeout: 10_000 },
    )
    .catch(() => undefined);
}

async function enterInteractiveExperience(page: Page) {
  const gate = page
    .getByRole("button", {
      name: /(?:enter|begin|launch|explore|start).{0,48}(?:experience|journey|story|world)|click to enter/i,
    })
    .first();

  if ((await gate.count()) === 0 || !(await gate.isVisible())) return false;

  await gate.click({ timeout: 3_000 });
  await page.waitForTimeout(1_500);
  await waitForLoadingScreen(page);
  return true;
}

async function captureViewport(cdp: CDPSession) {
  const payload = await Promise.race([
    cdp.send("Page.captureScreenshot", {
      format: "jpeg",
      quality: 54,
      fromSurface: true,
      captureBeyondViewport: false,
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Direct viewport capture timed out.")), 10_000),
    ),
  ]);
  return screenshotSchema.parse(payload).data;
}

async function collectRenderedMoment(
  page: Page,
  cdp: CDPSession,
  order: number,
  scrollProgress: number,
): Promise<RenderedMoment> {
  const measured = await page.evaluate(() => {
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > 0 &&
        rect.top < innerHeight &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity || 1) > 0.1
      );
    };
    const meaningfulText = [...document.querySelectorAll("h1,h2,h3,[role='heading']")]
      .filter(visible)
      .map((element) => element.textContent?.replace(/\s+/g, " ").trim())
      .filter((text): text is string => Boolean(text && text.length > 1 && text.length < 180));
    const uniqueHeadings = [...new Set(meaningfulText)].slice(0, 8);
    const styledElements = [...document.querySelectorAll("body *")].filter(visible);
    const positions = styledElements.map((element) => getComputedStyle(element).position);
    const transformedElements = styledElements.filter((element) => getComputedStyle(element).transform !== "none").length;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight);

    return {
      scrollY: Math.round(window.scrollY),
      actualProgress: maxScroll ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0,
      viewport: { width: innerWidth, height: innerHeight },
      visibleHeadings: uniqueHeadings,
      runningAnimations: document.getAnimations().filter((animation) => animation.playState === "running").length,
      fixedElements: positions.filter((position) => position === "fixed").length,
      stickyElements: positions.filter((position) => position === "sticky").length,
      transformedElements,
    };
  });
  const screenshotBase64 = await captureViewport(cdp);

  return {
    order,
    imageDataUrl: `data:image/jpeg;base64,${screenshotBase64}`,
    scrollY: measured.scrollY,
    scrollProgress: Number.isFinite(measured.actualProgress) ? measured.actualProgress : scrollProgress,
    viewport: measured.viewport,
    visibleHeadings: measured.visibleHeadings,
    runningAnimations: measured.runningAnimations,
    fixedElements: measured.fixedElements,
    stickyElements: measured.stickyElements,
    transformedElements: measured.transformedElements,
  };
}

export async function captureRenderedJourney(url: URL): Promise<RenderedJourney> {
  const apiToken = process.env.BRIGHT_DATA_API_TOKEN;
  const zone = process.env.BRIGHT_DATA_BROWSER_ZONE ?? "cli_browser";
  if (!apiToken || zone === "disabled") throw new Error("Rendered capture is not configured.");

  const endpoint = await getBrowserEndpoint(apiToken, zone);
  let browser: Browser | null = null;
  let cdp: CDPSession | null = null;

  try {
    browser = await connectToRenderedBrowser(endpoint);
    const context = browser.contexts()[0];
    const page = context.pages()[0] ?? (await context.newPage());
    await page.setViewportSize({ width: 1280, height: 760 });

    try {
      await page.goto(url.toString(), { waitUntil: "domcontentloaded", timeout: 18_000 });
    } catch (error) {
      if (page.url() === "about:blank") throw error;
    }

    await Promise.race([
      page.evaluate(() => document.fonts.ready.then(() => true)),
      page.waitForTimeout(3_000),
    ]).catch(() => undefined);
    await waitForLoadingScreen(page);
    await page.waitForTimeout(750);
    await enterInteractiveExperience(page).catch(() => false);
    cdp = await context.newCDPSession(page);

    const positions = [0, 0.5, 0.92];
    const moments: RenderedMoment[] = [];
    for (const [index, position] of positions.entries()) {
      await page.evaluate((progress) => {
        const maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight);
        scrollTo({ top: maxScroll * progress, behavior: "instant" });
      }, position);
      await page.waitForTimeout(index === 0 ? 450 : 1_050);
      moments.push(await collectRenderedMoment(page, cdp, index + 1, position));
    }

    return { moments };
  } finally {
    await cdp?.detach().catch(() => undefined);
    await browser?.close().catch(() => undefined);
  }
}
