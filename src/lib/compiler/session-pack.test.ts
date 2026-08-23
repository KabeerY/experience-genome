import { describe, expect, it } from "vitest";

import type { LiveCapture } from "@/lib/capture/public-contract";

import { buildSessionPackFiles, compileSessionGenome } from "./session-pack";

const capture: LiveCapture = {
  version: "live-capture@1",
  source: {
    name: "Living Reference",
    host: "example.com",
    url: "https://example.com/",
  },
  capturedAt: "2026-08-24T00:00:00.000Z",
  verification: {
    provider: "Bright Data",
    mode: "live",
    recordCount: 1,
    evidenceLayers: ["structured-journey", "rendered-browser"],
  },
  moments: [
    {
      order: 1,
      stage: "Arrival",
      actionBefore: "Opened the page",
      heading: "Arrival",
      url: "https://example.com/",
      visual: {
        imageDataUrl: "data:image/jpeg;base64,/9j/2Q==",
        scrollY: 0,
        scrollProgress: 0,
        viewport: { width: 1280, height: 760 },
        visibleHeadings: ["Arrival"],
        runningAnimations: 1,
        fixedElements: 1,
        stickyElements: 0,
        transformedElements: 2,
      },
    },
    {
      order: 2,
      stage: "Deep scroll",
      actionBefore: "Scrolled deeper",
      heading: "Reveal",
      url: "https://example.com/",
    },
  ],
  transitions: [
    {
      from: 1,
      to: 2,
      action: "Scrolled deeper",
      observedChange: "The visible region changed from arrival to reveal.",
    },
  ],
  finding: {
    observation: "Two ordered moments were captured.",
    inference: "The page may stage meaning through sequence.",
    candidateRule: "Let spatial change prepare a semantic reveal.",
    caveat: "Exact easing and authorial intent remain unresolved.",
  },
  coverage: [
    { dimension: "Journey order", status: "grounded", reason: "Two ordered moments exist." },
    { dimension: "Audio", status: "unresolved", reason: "No audio was captured." },
  ],
  durationMs: 12_000,
};

describe("session compiler", () => {
  it("keeps evidence, human judgment, invention, and unknowns distinct", () => {
    const project = compileSessionGenome({
      title: "New World",
      brief: "Build an original calm interactive story.",
      desiredAffect: ["wonder", "clarity"],
      references: [
        {
          capture,
          decision: {
            judgment: "preferred",
            rule: "Let spatial change prepare semantic meaning.",
            note: "I like the patient reveal.",
          },
        },
      ],
    });

    expect(project.compiler.mode).toBe("deterministic");
    expect(project.verification.status).toBe("passed");
    expect(project.rules[0].sourceReferences[0].sourceUrl).toBe("https://example.com/");
    expect(project.rules[0].humanJudgment).toBe("preferred");
    expect(project.rules.some((rule) => rule.transformation === "invented")).toBe(true);
    expect(project.unresolved).toContainEqual({ dimension: "Audio", reason: "No audio was captured." });
  });

  it("exports screenshots as files instead of embedding data URLs in evidence JSON", () => {
    const judgedReference = {
      capture,
      decision: { judgment: "preferred" as const, rule: "Preserve staged revelation." },
    };
    const project = compileSessionGenome({
      title: "New World",
      brief: "Build an original experience.",
      desiredAffect: ["wonder"],
      references: [judgedReference],
    });
    const files = buildSessionPackFiles(project, [judgedReference]);
    const evidence = files.find((file) => file.path === "genome/EVIDENCE.json");
    const screenshot = files.find((file) => file.path.endsWith("moment-1.jpg"));

    expect(evidence?.content).toContain("screenshotFile");
    expect(evidence?.content).not.toContain("data:image/jpeg");
    expect(screenshot).toMatchObject({ base64: true, content: "/9j/2Q==" });
  });
});
