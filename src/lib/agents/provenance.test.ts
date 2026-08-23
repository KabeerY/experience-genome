import { describe, expect, it } from "vitest";

import { conciseEvidenceSummary, enforceEvidenceProvenance } from "@/lib/agents/provenance";

const draft = {
  observation: "Three rendered moments show a fixed canvas.",
  inference: "The fixed canvas likely supports a continuous world.",
  candidateRule: "Keep one visual world pinned while its composition changes.",
  caveat: "Exact timing remains unresolved.",
  unresolved: ["Exact easing remains unknown."],
  claims: [
    {
      title: "Stable canvas",
      dimension: "layout" as const,
      epistemicBasis: "observed" as const,
      statement: "A fixed canvas appears to create continuity.",
      evidenceMoments: [1, 2, 99],
      confidence: "high" as const,
    },
    {
      title: "Missing citation",
      dimension: "motion" as const,
      epistemicBasis: "observed" as const,
      statement: "Motion is present.",
      evidenceMoments: [99],
      confidence: "high" as const,
    },
  ],
};

describe("enforceEvidenceProvenance", () => {
  it("filters invalid citations and downgrades interpretive observations", () => {
    const result = enforceEvidenceProvenance(draft, new Set([1, 2, 3]), "Three ordered moments were captured.");

    expect(result.claims[0]).toMatchObject({
      epistemicBasis: "inferred",
      confidence: "medium",
      evidenceMoments: [1, 2],
    });
    expect(result.claims[1]).toMatchObject({
      epistemicBasis: "unresolved",
      confidence: "low",
      evidenceMoments: [],
    });
  });

  it.each(["suggesting", "indicating", "implying", "creating"])(
    "downgrades observed claims containing the interpretive word %s",
    (word) => {
      const result = enforceEvidenceProvenance(
        {
          ...draft,
          claims: [{ ...draft.claims[0], statement: `The fixed layer persists, ${word} narrative continuity.` }],
        },
        new Set([1, 2, 3]),
        "Three ordered moments were captured.",
      );

      expect(result.claims[0]).toMatchObject({ epistemicBasis: "inferred", confidence: "medium" });
    },
  );

  it("replaces an interpretive top-level observation with grounded fallback text", () => {
    const result = enforceEvidenceProvenance(
      { ...draft, observation: "The composition likely creates anticipation." },
      new Set([1, 2, 3]),
      "Three ordered moments were captured.",
    );

    expect(result.observation).toBe("Three ordered moments were captured.");
  });

  it("keeps model summaries compact even when the model ignores the prompt limit", () => {
    const verbose = `${"A grounded detail repeats across the captured moments. ".repeat(8)}A final detail.`;
    const result = enforceEvidenceProvenance(
      {
        ...draft,
        observation: verbose,
        inference: verbose,
        candidateRule: verbose,
        caveat: verbose,
      },
      new Set([1, 2, 3]),
      "Three ordered moments were captured.",
    );

    expect(result.observation.length).toBeLessThanOrEqual(180);
    expect(result.inference.length).toBeLessThanOrEqual(180);
    expect(result.caveat.length).toBeLessThanOrEqual(180);
    expect(result.candidateRule.length).toBeLessThanOrEqual(220);
    expect(result.observation.endsWith(".")).toBe(true);
  });

  it("normalizes whitespace and truncates at a word boundary", () => {
    const result = conciseEvidenceSummary(`  ${"scroll linked reveal ".repeat(20)}  `, 80);

    expect(result.length).toBeLessThanOrEqual(80);
    expect(result).not.toContain("  ");
    expect(result.endsWith("…")).toBe(true);
  });

  it("does not leave a dangling numbered-list marker", () => {
    const verbose = "Direct evidence includes: 1. The opening is visible. 2. The heading changes after scrolling. 3. Another detail follows with enough words to exceed the compact summary limit.";
    const result = conciseEvidenceSummary(verbose, 120);

    expect(result).toBe("Direct evidence includes: 1. The opening is visible. 2. The heading changes after scrolling.");
    expect(result).not.toMatch(/\s\d+\.$/);
  });
});
