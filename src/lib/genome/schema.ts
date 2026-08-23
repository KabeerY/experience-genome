import { z } from "zod";

export const epistemicBasisSchema = z.enum([
  "observed",
  "inferred",
  "user-specified",
  "unresolved",
]);

export const humanJudgmentSchema = z.enum([
  "preferred",
  "rejected",
  "neutral",
  "unreviewed",
]);

export const coverageStatusSchema = z.enum([
  "grounded",
  "partial",
  "unresolved",
]);

export const sourceModeSchema = z.enum([
  "live",
  "verified-replay",
  "controlled-fixture",
  "curated-preview",
]);

export const signalSchema = z.object({
  key: z.string(),
  value: z.string(),
  provenance: z.enum(["dom", "visual", "network", "interaction", "human"]),
});

export const traceStateSchema = z.object({
  id: z.string(),
  sequence: z.number().int().nonnegative(),
  label: z.string(),
  elapsedMs: z.number().int().nonnegative(),
  url: z.string().url(),
  heading: z.string(),
  textExcerpt: z.string(),
  screenshot: z.string().optional(),
  signals: z.array(signalSchema),
});

export const traceActionSchema = z.object({
  id: z.string(),
  fromState: z.string(),
  toState: z.string(),
  type: z.enum(["load", "scroll", "hover", "click", "wait", "network"]),
  label: z.string(),
  durationMs: z.number().int().nonnegative(),
  actor: z.enum(["bright-data-browser-worker", "human", "fixture"]),
});

export const traceDeltaSchema = z.object({
  id: z.string(),
  fromState: z.string(),
  toState: z.string(),
  summary: z.string(),
  kind: z.enum(["observed-after-action", "mechanism-observed", "causal-hypothesis"]),
  changedSignals: z.array(z.string()),
});

export const experienceTraceSchema = z.object({
  id: z.string(),
  referenceId: z.string(),
  sourceName: z.string(),
  sourceUrl: z.string().url(),
  sourceMode: sourceModeSchema,
  collectorId: z.string(),
  snapshotId: z.string(),
  capturedAt: z.string(),
  states: z.array(traceStateSchema).min(2),
  actions: z.array(traceActionSchema),
  deltas: z.array(traceDeltaSchema),
});

export const genomeClaimSchema = z.object({
  id: z.string(),
  referenceId: z.string(),
  dimension: z.enum([
    "form",
    "typography",
    "layout",
    "depth",
    "light",
    "motion",
    "camera",
    "interaction",
    "semantics",
    "affect",
    "mechanism",
  ]),
  statement: z.string(),
  interpretation: z.string().optional(),
  epistemicBasis: epistemicBasisSchema,
  humanJudgment: humanJudgmentSchema,
  humanNote: z.string().optional(),
  evidenceRefs: z.array(z.string()),
});

export const coverageItemSchema = z.object({
  dimension: z.string(),
  status: coverageStatusSchema,
  reason: z.string(),
  claimRefs: z.array(z.string()),
});

export const experienceGenomeSchema = z.object({
  id: z.string(),
  referenceId: z.string(),
  name: z.string(),
  claims: z.array(genomeClaimSchema),
  coverage: z.array(coverageItemSchema),
});

export const projectRuleSchema = z.object({
  id: z.string(),
  title: z.string(),
  rule: z.string(),
  transformation: z.enum(["inherited", "mutated", "rejected", "invented"]),
  sourceClaimRefs: z.array(z.string()),
  rationale: z.string(),
  implementationDirective: z.string(),
  antiCopyConstraint: z.string(),
});

export const projectGenomeSchema = z.object({
  id: z.string(),
  title: z.string(),
  brief: z.string(),
  desiredAffect: z.array(z.string()),
  rules: z.array(projectRuleSchema),
  generatedAt: z.string(),
  model: z.object({
    provider: z.string(),
    id: z.string(),
    promptVersion: z.string(),
  }),
});

export type ExperienceTrace = z.infer<typeof experienceTraceSchema>;
export type GenomeClaim = z.infer<typeof genomeClaimSchema>;
export type ExperienceGenome = z.infer<typeof experienceGenomeSchema>;
export type ProjectRule = z.infer<typeof projectRuleSchema>;
export type ProjectGenome = z.infer<typeof projectGenomeSchema>;
