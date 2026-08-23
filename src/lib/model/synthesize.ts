import "server-only";

import {
  projectGenomeSchema,
  type ExperienceGenome,
  type ProjectGenome,
} from "@/lib/genome/schema";
import { generateStructured, getModelIdentity } from "@/lib/model/provider";

type SynthesisInput = {
  brief: string;
  desiredAffect: string[];
  genomes: ExperienceGenome[];
};

export async function synthesizeProjectGenome(input: SynthesisInput): Promise<ProjectGenome> {
  const identity = getModelIdentity();
  const project = await generateStructured({
    schema: projectGenomeSchema,
    schemaName: "project_genome",
    system: [
      "You are the synthesis stage of Experience Compiler.",
      "Use only supplied claims and explicit project intent as source evidence.",
      "Keep observed, inferred, user-specified, and unresolved truth distinct.",
      "Create original implementation rules; never reproduce source copy, geometry, timing, assets, layout chrome, or camera paths.",
      "Non-invented rules must cite valid source claim IDs. Invented rules must cite none.",
    ].join(" "),
    prompt: JSON.stringify({
      task: "Synthesize a Project Genome with inherited, mutated, rejected, and invented rules.",
      brief: input.brief,
      desiredAffect: input.desiredAffect,
      experienceGenomes: input.genomes,
      modelIdentity: identity,
      generatedAt: new Date().toISOString(),
      promptVersion: "genome-synthesis-v1",
    }),
  });

  return projectGenomeSchema.parse({
    ...project,
    generatedAt: new Date().toISOString(),
    model: {
      provider: identity.provider,
      id: identity.id,
      promptVersion: "genome-synthesis-v1",
    },
  });
}
