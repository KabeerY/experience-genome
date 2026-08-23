import type { z } from "zod";

import type { evidenceInterpretationDraftSchema } from "@/lib/agents/schema";

type InterpretationDraft = z.infer<typeof evidenceInterpretationDraftSchema>;

const inferenceLanguage = /\b(?:suggest(?:s|ed|ing)?|indicat(?:e|es|ed|ing)|impl(?:y|ies|ied|ying)|may|might|probably|likely|appear(?:s|ed|ing)?|seem(?:s|ed|ing)?|intend(?:s|ed|ing)?|purpose|creat(?:e|es|ed|ing))\b/i;
const SUMMARY_CHARACTER_LIMIT = 180;

export function conciseEvidenceSummary(value: string, limit = SUMMARY_CHARACTER_LIMIT) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) return normalized;

  const sentenceBoundary = [...normalized.slice(0, limit).matchAll(/[.!?](?=\s|$)/g)]
    .map((match) => match.index)
    .filter((index) => index !== undefined && !/\d/.test(normalized[index - 1] ?? ""))
    .at(-1) ?? -1;
  if (sentenceBoundary >= Math.floor(limit * 0.55)) {
    return normalized.slice(0, sentenceBoundary + 1);
  }

  const wordBoundary = normalized.lastIndexOf(" ", limit - 1);
  const end = wordBoundary >= Math.floor(limit * 0.55) ? wordBoundary : limit - 1;
  return `${normalized.slice(0, end).replace(/[,:;\-\s]+$/g, "")}…`;
}

export function enforceEvidenceProvenance(
  draft: InterpretationDraft,
  validMomentNumbers: Set<number>,
  fallbackObservation: string,
): InterpretationDraft {
  const groundedObservation = inferenceLanguage.test(draft.observation)
    ? fallbackObservation
    : draft.observation;

  return {
    ...draft,
    observation: conciseEvidenceSummary(groundedObservation),
    inference: conciseEvidenceSummary(draft.inference),
    candidateRule: conciseEvidenceSummary(draft.candidateRule, 220),
    caveat: conciseEvidenceSummary(draft.caveat),
    claims: draft.claims.map((claim) => {
      const evidenceMoments = claim.evidenceMoments.filter((moment) => validMomentNumbers.has(moment));
      if (claim.epistemicBasis !== "observed") return { ...claim, evidenceMoments };

      if (evidenceMoments.length === 0) {
        return { ...claim, epistemicBasis: "unresolved", confidence: "low", evidenceMoments };
      }
      if (inferenceLanguage.test(claim.statement)) {
        return {
          ...claim,
          epistemicBasis: "inferred",
          confidence: claim.confidence === "high" ? "medium" : claim.confidence,
          evidenceMoments,
        };
      }
      return { ...claim, evidenceMoments };
    }),
  };
}
