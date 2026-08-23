import { z } from "zod";

export const evidenceClaimSchema = z.object({
  title: z.string().trim().min(3).max(90),
  dimension: z.enum([
    "journey",
    "layout",
    "typography",
    "motion",
    "depth",
    "interaction",
    "semantics",
    "affect",
    "mechanism",
  ]),
  epistemicBasis: z.enum(["observed", "inferred", "unresolved"]),
  statement: z.string().trim().min(8).max(360),
  evidenceMoments: z.array(z.number().int().positive()).max(8),
  confidence: z.enum(["high", "medium", "low"]),
});

export const evidenceInterpretationDraftSchema = z.object({
  observation: z.string().trim().min(12).max(500),
  inference: z.string().trim().min(12).max(500),
  candidateRule: z.string().trim().min(12).max(500),
  caveat: z.string().trim().min(12).max(500),
  claims: z.array(evidenceClaimSchema).min(3).max(7),
  unresolved: z.array(z.string().trim().min(5).max(240)).min(1).max(6),
});

export const evidenceInterpretationSchema = evidenceInterpretationDraftSchema.extend({
  version: z.literal("evidence-interpretation@1"),
  agent: z.object({
    role: z.literal("Evidence Interpreter"),
    provider: z.string().min(1),
    model: z.string().min(1),
    promptVersion: z.literal("evidence-interpreter-v1"),
    inputMode: z.enum(["rendered-multimodal", "rendered-measurements"]),
  }),
  verification: z.object({
    status: z.literal("passed"),
    checks: z.array(z.string().min(1)).min(1),
  }),
});

export const interpretRequestSchema = z.object({
  capture: z.unknown(),
});

export type EvidenceInterpretation = z.infer<typeof evidenceInterpretationSchema>;

export const projectSynthesisDraftSchema = z.object({
  rules: z.array(
    z.object({
      title: z.string().trim().min(3).max(100),
      rule: z.string().trim().min(12).max(500),
      transformation: z.enum(["inherited", "mutated", "rejected", "invented"]),
      sourceReferences: z.array(z.string().trim().min(1)).max(8),
      rationale: z.string().trim().min(8).max(500),
      implementationDirective: z.string().trim().min(8).max(500),
      antiCopyConstraint: z.string().trim().min(8).max(500),
    }),
  ).min(1).max(12),
  unresolved: z.array(
    z.object({
      dimension: z.string().trim().min(2).max(100),
      reason: z.string().trim().min(8).max(400),
    }),
  ).max(12),
});
