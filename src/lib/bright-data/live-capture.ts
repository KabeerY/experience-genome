import "server-only";

import { z } from "zod";

import { liveCaptureSchema, type LiveCapture } from "@/lib/capture/public-contract";
import { parsePublicReferenceUrl } from "@/lib/capture/public-url";

const brightDataMomentSchema = z.object({
  sequence: z.coerce.number().int().positive(),
  state: z.string().trim().min(1).optional(),
  prior_action: z.string().trim().min(1).optional(),
  heading: z.string().trim().min(1).nullish(),
  text_excerpt: z.string().trim().min(1).nullish(),
  section_id: z.string().trim().min(1).nullish(),
  url: z.string().url().optional(),
});

const brightDataRecordSchema = z.object({
  experience_states: z.array(brightDataMomentSchema).min(2),
  product_page_url: z.string().url().optional(),
  input: z.object({ url: z.string().url() }).optional(),
});

const brightDataResponseSchema = z.union([
  z.array(brightDataRecordSchema).min(1),
  z.object({ data: z.array(brightDataRecordSchema).min(1) }).transform((value) => value.data),
]);

type CaptureFailureCode =
  | "CAPTURE_NOT_CONFIGURED"
  | "CAPTURE_TIMED_OUT"
  | "CAPTURE_REJECTED"
  | "CAPTURE_FAILED";

export class LiveCaptureError extends Error {
  code: CaptureFailureCode;
  retryable: boolean;

  constructor(code: CaptureFailureCode, message: string, retryable: boolean) {
    super(message);
    this.name = "LiveCaptureError";
    this.code = code;
    this.retryable = retryable;
  }
}

function requireCaptureConfig() {
  const apiToken = process.env.BRIGHT_DATA_API_TOKEN;
  const collectorId = process.env.BRIGHT_DATA_COLLECTOR_ID;

  if (!apiToken || !collectorId) {
    throw new LiveCaptureError(
      "CAPTURE_NOT_CONFIGURED",
      "Live capture is temporarily unavailable because its server connection is not configured.",
      false,
    );
  }

  return { apiToken, collectorId };
}

function words(value: string) {
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sentenceCase(value: string) {
  const normalized = words(value);
  return normalized ? normalized[0].toUpperCase() + normalized.slice(1) : normalized;
}

function humanStage(state: string | undefined, index: number, total: number) {
  const normalized = state?.toLowerCase() ?? "";
  if (index === 0 || normalized.includes("initial") || normalized.includes("hero")) return "Arrival";
  if (index === total - 1 || normalized.includes("final")) return "Deep scroll";
  if (normalized.includes("middle") || normalized.includes("scroll")) return "First scroll";
  return state ? sentenceCase(state) : `Moment ${index + 1}`;
}

function humanAction(action: string | undefined, index: number) {
  const normalized = action?.toLowerCase() ?? "";
  if (index === 0 || normalized.includes("load")) return "Opened the page";
  if (normalized.includes("scroll")) return "Scrolled deeper";
  if (normalized.includes("hover")) return "Hovered an interactive element";
  if (normalized.includes("click")) return "Activated an interactive element";
  if (normalized.includes("wait")) return "Waited for the scene to settle";
  return action ? sentenceCase(action) : "Continued through the experience";
}

function sourceNameFromHost(host: string) {
  const meaningfulPart = host
    .replace(/^www\./, "")
    .split(".")
    .filter((part) => !["webflow", "vercel", "netlify", "github", "pages"].includes(part))[0];

  return sentenceCase(meaningfulPart || host).replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function cleanText(value: string | null | undefined) {
  const cleaned = value?.replace(/\s+/g, " ").replace(/\s+([.,!?])/g, "$1").trim();
  return cleaned || undefined;
}

function normalizeCapture(
  raw: unknown,
  requestedUrl: URL,
  intent: string | undefined,
  startedAt: number,
): LiveCapture {
  const records = brightDataResponseSchema.parse(raw);
  const record = records[0];
  const canonicalUrl = parsePublicReferenceUrl(
    record.product_page_url ?? record.input?.url ?? requestedUrl.toString(),
  );
  const orderedStates = [...record.experience_states]
    .sort((left, right) => left.sequence - right.sequence)
    .slice(0, 8);

  const moments = orderedStates.map((state, index) => ({
    order: index + 1,
    stage: humanStage(state.state, index, orderedStates.length),
    actionBefore: humanAction(state.prior_action, index),
    heading: cleanText(state.heading),
    excerpt: cleanText(state.text_excerpt),
    url: state.url ? parsePublicReferenceUrl(state.url).toString() : canonicalUrl.toString(),
  }));

  const transitions = moments.slice(1).map((moment, index) => {
    const previous = moments[index];
    const destination = moment.heading ?? moment.stage;
    const origin = previous.heading ?? previous.stage;
    return {
      from: previous.order,
      to: moment.order,
      action: moment.actionBefore,
      observedChange: `The visible semantic region changed from “${origin}” to “${destination}”.`,
    };
  });

  const namedMoments = moments.filter((moment) => moment.heading || moment.excerpt).length;
  const scrollTransitions = transitions.filter((transition) =>
    transition.action.toLowerCase().includes("scroll"),
  ).length;

  return liveCaptureSchema.parse({
    version: "live-capture@1",
    source: {
      name: sourceNameFromHost(canonicalUrl.hostname),
      host: canonicalUrl.hostname.replace(/^www\./, ""),
      url: canonicalUrl.toString(),
    },
    capturedAt: new Date().toISOString(),
    verification: {
      provider: "Bright Data",
      mode: "live",
      recordCount: records.length,
    },
    moments,
    transitions,
    finding: {
      observation: `${moments.length} ordered moments were recovered from one live browser journey${scrollTransitions ? `, including ${scrollTransitions} scroll transition${scrollTransitions === 1 ? "" : "s"}` : ""}.`,
      inference:
        namedMoments >= 2
          ? "The page appears to reveal distinct ideas as the visitor moves through the experience."
          : "The journey changes state over time, but the captured text is too sparse to assign a reliable narrative purpose.",
      caveat:
        "This run establishes order and readable content. It does not yet measure exact easing, frame timing, pointer physics, audio, or authorial intent.",
    },
    coverage: [
      {
        dimension: "Journey order",
        status: "grounded",
        reason: `${moments.length} moments retain their observed order and the action that preceded each one.`,
      },
      {
        dimension: "Semantic change",
        status: namedMoments >= 2 ? "grounded" : "partial",
        reason:
          namedMoments >= 2
            ? `${namedMoments} moments contain readable headings or excerpts.`
            : "The page changed state, but little readable copy was returned.",
      },
      {
        dimension: "Fine motion",
        status: "unresolved",
        reason: "The collector did not return frame-level timing, easing, or continuous visual deltas.",
      },
      {
        dimension: "Pointer and audio response",
        status: "unresolved",
        reason: "This bounded journey did not exercise hover physics or capture audio response.",
      },
    ],
    intent: cleanText(intent),
    durationMs: Math.max(0, Date.now() - startedAt),
  });
}

export async function capturePublicExperience(input: {
  url: string;
  intent?: string;
}): Promise<LiveCapture> {
  const startedAt = Date.now();
  const requestedUrl = parsePublicReferenceUrl(input.url);
  const { apiToken, collectorId } = requireCaptureConfig();
  const endpoint = new URL("https://api.brightdata.com/dca/crawl");
  endpoint.searchParams.set("collector", collectorId);
  endpoint.searchParams.set("timeout", "50s");

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: requestedUrl.toString() }),
      cache: "no-store",
      signal: AbortSignal.timeout(52_000),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new LiveCaptureError(
        "CAPTURE_TIMED_OUT",
        "The site did not finish its live journey in time. You can retry the same URL.",
        true,
      );
    }
    throw new LiveCaptureError(
      "CAPTURE_FAILED",
      "The live browser could not reach Bright Data. Please retry in a moment.",
      true,
    );
  }

  if (!response.ok) {
    if (response.status === 408 || response.status === 504) {
      throw new LiveCaptureError(
        "CAPTURE_TIMED_OUT",
        "The website did not finish its live journey in time. You can retry it.",
        true,
      );
    }
    throw new LiveCaptureError(
      "CAPTURE_REJECTED",
      response.status === 401 || response.status === 403
        ? "The live capture connection was rejected by its provider."
        : "Bright Data could not complete a usable journey for this website.",
      response.status >= 500 || response.status === 429,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
    return normalizeCapture(payload, requestedUrl, input.intent, startedAt);
  } catch (error) {
    if (error instanceof LiveCaptureError) throw error;
    throw new LiveCaptureError(
      "CAPTURE_FAILED",
      error instanceof z.ZodError
        ? "The live run completed, but it did not return enough ordered evidence to understand this page."
        : "The live run returned evidence in an unreadable format.",
      true,
    );
  }
}
