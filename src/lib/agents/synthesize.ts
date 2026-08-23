import "server-only";

import { z } from "zod";

import { evidenceInterpretationSchema, projectSynthesisDraftSchema } from "@/lib/agents/schema";
import { liveCaptureSchema } from "@/lib/capture/public-contract";
import {
  humanDecisionSchema,
  portableProjectGenomeSchema,
  type PortableProjectGenome,
} from "@/lib/compiler/session-pack";
import { generateStructured, getModelIdentity } from "@/lib/model/provider";

const synthesisInputSchema = z.object({
  title: z.string().trim().min(1).max(160),
  brief: z.string().trim().min(1).max(1_500),
  desiredAffect: z.array(z.string().trim().min(1).max(80)).max(12),
  references: z.array(
    z.object({
      capture: liveCaptureSchema,
      decision: humanDecisionSchema,
      interpretation: evidenceInterpretationSchema.optional(),
    }),
  ).min(1).max(8),
});

export async function synthesizeJudgedProject(rawInput: unknown): Promise<PortableProjectGenome> {
  const input = synthesisInputSchema.parse(rawInput);
  const synthesisModelId = process.env.SYNTHESIS_MODEL_ID;
  const identity = getModelIdentity(synthesisModelId);
  const references = input.references.map((reference, index) => ({
    key: `reference-${index + 1}`,
    source: reference.capture.source,
    observation: reference.interpretation?.observation ?? reference.capture.finding.observation,
    inference: reference.interpretation?.inference ?? reference.capture.finding.inference,
    candidateRule: reference.interpretation?.candidateRule ?? reference.capture.finding.candidateRule,
    claims: reference.interpretation?.claims ?? [],
    unknowns: reference.interpretation?.unresolved ?? reference.capture.coverage
      .filter((item) => item.status !== "grounded")
      .map((item) => `${item.dimension}: ${item.reason}`),
    humanJudgment: reference.decision,
  }));
  const referenceByKey = new Map(references.map((reference) => [reference.key, reference]));

  const draft = await generateStructured({
    schema: projectSynthesisDraftSchema,
    schemaName: "project_genome_synthesis",
    modelId: synthesisModelId,
    maxTokens: 3_400,
    reasoningEffort: "minimal",
    system: [
      "You are the Genome Synthesizer inside Experience Compiler.",
      "Transform evidence-backed experience principles plus explicit human judgment into an original Project Genome.",
      "Preferred references may support inherited or mutated rules. Every inherited or mutated rule MUST contain at least one exact preferred reference key in sourceReferences.",
      "Rejected references may support rejected rules only. Every rejected rule MUST contain at least one exact rejected reference key in sourceReferences.",
      "Invented rules must cite no source references and must be genuinely project-specific rather than an average of inputs.",
      "Every judged reference key must appear in at least one rule. Produce at least one invented rule whenever any preferred reference exists.",
      "Prefer 5 to 7 high-signal rules for a one-reference project. Merge overlapping ideas instead of flooding the user with near-duplicates.",
      "Never reproduce source copy, assets, layout, geometry, exact timing, camera paths, branded visual language, or interaction choreography.",
      "Preserve uncertainty. Do not solve unresolved evidence by pretending it was observed.",
      "Implementation directives should be concrete enough for a coding agent but must leave creative degrees of freedom.",
    ].join(" "),
    prompt: JSON.stringify({
      task: "Compile inherited, mutated, rejected, and invented rules for the destination project.",
      destination: {
        title: input.title,
        brief: input.brief,
        desiredAffect: input.desiredAffect,
      },
      references,
      ruleContract: {
        validReferenceKeys: references.map((reference) => reference.key),
        preferredReferenceKeys: references
          .filter((reference) => reference.humanJudgment.judgment === "preferred")
          .map((reference) => reference.key),
        rejectedReferenceKeys: references
          .filter((reference) => reference.humanJudgment.judgment === "rejected")
          .map((reference) => reference.key),
        transformations: {
          inherited: "sourceReferences must contain one or more preferredReferenceKeys",
          mutated: "sourceReferences must contain one or more preferredReferenceKeys",
          rejected: "sourceReferences must contain one or more rejectedReferenceKeys",
          invented: "sourceReferences must be an empty array",
        },
      },
    }),
    validate: (value) => {
      const issues: string[] = [];
      for (const rule of value.rules) {
        const sources = rule.sourceReferences.map((key) => referenceByKey.get(key));
        if (sources.some((source) => !source)) issues.push(`Rule “${rule.title}” cites an unknown reference.`);
        if (rule.transformation === "invented" && rule.sourceReferences.length) {
          issues.push(`Invented rule “${rule.title}” must not cite a source.`);
        }
        if (rule.transformation !== "invented" && !rule.sourceReferences.length) {
          issues.push(`Non-invented rule “${rule.title}” must cite a source.`);
        }
        const decisions = sources.flatMap((source) => source ? [source.humanJudgment.judgment] : []);
        if (rule.transformation === "rejected" && decisions.some((decision) => decision !== "rejected")) {
          issues.push(`Rejected rule “${rule.title}” cites a preferred source.`);
        }
        if (["inherited", "mutated"].includes(rule.transformation) && decisions.some((decision) => decision !== "preferred")) {
          issues.push(`Active rule “${rule.title}” cites a rejected source.`);
        }
      }
      for (const reference of references) {
        if (!value.rules.some((rule) => rule.sourceReferences.includes(reference.key))) {
          issues.push(`${reference.key} is judged but absent from every synthesized rule.`);
        }
      }
      if (
        references.some((reference) => reference.humanJudgment.judgment === "preferred") &&
        !value.rules.some((rule) => rule.transformation === "invented")
      ) {
        issues.push("At least one invented, project-specific rule is required when preferred sources exist.");
      }
      return issues;
    },
  });

  const rules = draft.rules.map((rule) => {
    const sourceReferences = rule.sourceReferences.flatMap((key) => {
      const source = referenceByKey.get(key);
      if (!source) return [];
      const referenceIndex = Number(key.replace("reference-", "")) - 1;
      const capture = input.references[referenceIndex].capture;
      return [{
        reference: key,
        sourceName: source.source.name,
        sourceUrl: source.source.url,
        evidenceMoments: capture.moments.map((moment) => moment.order),
      }];
    });
    const sourceDecisions = rule.sourceReferences.flatMap((key) => {
      const source = referenceByKey.get(key);
      return source ? [source.humanJudgment] : [];
    });

    return {
      title: rule.title,
      rule: rule.rule,
      transformation: rule.transformation,
      source: sourceReferences.length ? sourceReferences.map((source) => source.sourceName).join(" + ") : undefined,
      sourceReferences,
      evidenceMoments: [...new Set(sourceReferences.flatMap((source) => source.evidenceMoments))],
      epistemicBasis: "inferred" as const,
      humanJudgment:
        rule.transformation === "invented"
          ? ("unreviewed" as const)
          : rule.transformation === "rejected"
            ? ("rejected" as const)
            : ("preferred" as const),
      humanNote: sourceDecisions.map((decision) => decision.note).filter(Boolean).join(" · ") || undefined,
      rationale: rule.rationale,
      implementationDirective: rule.implementationDirective,
      antiCopyConstraint: rule.antiCopyConstraint,
    };
  });

  return portableProjectGenomeSchema.parse({
    version: "project-genome@1",
    title: input.title,
    brief: input.brief,
    desiredAffect: input.desiredAffect,
    compiledAt: new Date().toISOString(),
    thesis: "The machine records what happened. The human decides what mattered.",
    rules,
    unresolved: draft.unresolved,
    compiler: {
      mode: "agent",
      role: "Genome Synthesizer",
      provider: identity.provider,
      model: identity.id,
      promptVersion: "genome-synthesizer-v1",
    },
    verification: {
      status: "passed",
      checks: [
        "Every non-invented rule cites a judged source.",
        "Preferred and rejected sources cannot cross provenance lanes.",
        "Invented rules cite no source evidence.",
        "Unresolved evidence remains explicit.",
      ],
    },
  });
}
