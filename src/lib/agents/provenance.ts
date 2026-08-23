import type { z } from "zod";

import type { evidenceInterpretationDraftSchema } from "@/lib/agents/schema";

type InterpretationDraft = z.infer<typeof evidenceInterpretationDraftSchema>;

const inferenceLanguage = /\b(?:suggests?|indicates?|implies?|may|might|probably|likely|appears?|seems?|intended|purpose|creates?)\b/i;

export function enforceEvidenceProvenance(
  draft: InterpretationDraft,
  validMomentNumbers: Set<number>,
  fallbackObservation: string,
): InterpretationDraft {
  return {
    ...draft,
    observation: inferenceLanguage.test(draft.observation) ? fallbackObservation : draft.observation,
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
