import type {
  ExperienceGenome,
  ExperienceTrace,
  ProjectGenome,
} from "./schema";

export type VerificationIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
  subjectId: string;
};

export function verifyProvenance(
  traces: ExperienceTrace[],
  genomes: ExperienceGenome[],
  project: ProjectGenome,
): VerificationIssue[] {
  const issues: VerificationIssue[] = [];
  const evidenceIds = new Set(
    traces.flatMap((trace) => [
      ...trace.states.map((state) => state.id),
      ...trace.actions.map((action) => action.id),
      ...trace.deltas.map((delta) => delta.id),
    ]),
  );
  const claims = genomes.flatMap((genome) => genome.claims);
  const claimIds = new Set(claims.map((claim) => claim.id));

  for (const claim of claims) {
    if (claim.epistemicBasis === "observed" && claim.evidenceRefs.length === 0) {
      issues.push({
        severity: "error",
        code: "OBSERVATION_WITHOUT_EVIDENCE",
        message: "Observed claims must point to trace evidence.",
        subjectId: claim.id,
      });
    }

    for (const ref of claim.evidenceRefs) {
      if (!evidenceIds.has(ref)) {
        issues.push({
          severity: "error",
          code: "UNKNOWN_EVIDENCE_REF",
          message: `Evidence reference ${ref} does not exist.`,
          subjectId: claim.id,
        });
      }
    }

    if (
      claim.humanJudgment === "preferred" &&
      (!claim.humanNote || claim.humanNote.trim().length < 3)
    ) {
      issues.push({
        severity: "warning",
        code: "PREFERENCE_WITHOUT_NOTE",
        message: "Preferred claims should retain the human reason.",
        subjectId: claim.id,
      });
    }
  }

  for (const rule of project.rules) {
    if (rule.transformation !== "invented" && rule.sourceClaimRefs.length === 0) {
      issues.push({
        severity: "error",
        code: "RULE_WITHOUT_SOURCE",
        message: "Non-invented rules must point to at least one source claim.",
        subjectId: rule.id,
      });
    }

    for (const ref of rule.sourceClaimRefs) {
      if (!claimIds.has(ref)) {
        issues.push({
          severity: "error",
          code: "UNKNOWN_CLAIM_REF",
          message: `Source claim ${ref} does not exist.`,
          subjectId: rule.id,
        });
      }
    }
  }

  return issues;
}

