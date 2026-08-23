import { describe, expect, it } from "vitest";

import { enforceEvidenceProvenance } from "@/lib/agents/provenance";

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

  it("replaces an interpretive top-level observation with grounded fallback text", () => {
    const result = enforceEvidenceProvenance(
      { ...draft, observation: "The composition likely creates anticipation." },
      new Set([1, 2, 3]),
      "Three ordered moments were captured.",
    );

    expect(result.observation).toBe("Three ordered moments were captured.");
  });
});
