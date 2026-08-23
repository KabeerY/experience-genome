import JSZip from "jszip";
import { z } from "zod";

import { liveCaptureSchema } from "@/lib/capture/public-contract";

export const humanDecisionSchema = z.object({
  judgment: z.enum(["preferred", "rejected"]),
  rule: z.string().trim().min(1),
  note: z.string().trim().max(800).optional(),
});

export const judgedReferenceSchema = z.object({
  capture: liveCaptureSchema,
  decision: humanDecisionSchema,
});

export const portableProjectGenomeSchema = z.object({
  version: z.literal("project-genome@1"),
  title: z.string().min(1),
  brief: z.string().min(1),
  desiredAffect: z.array(z.string().min(1)),
  compiledAt: z.string().datetime(),
  thesis: z.literal("The machine records what happened. The human decides what mattered."),
  rules: z.array(
    z.object({
      title: z.string().min(1),
      rule: z.string().min(1),
      transformation: z.enum(["inherited", "mutated", "rejected", "invented"]),
      source: z.string().min(1).optional(),
      sourceReferences: z.array(
        z.object({
          reference: z.string().min(1),
          sourceName: z.string().min(1),
          sourceUrl: z.string().url(),
          evidenceMoments: z.array(z.number().int().positive()),
        }),
      ),
      evidenceMoments: z.array(z.number().int().positive()),
      epistemicBasis: z.enum(["observed", "inferred", "user-specified"]),
      humanJudgment: z.enum(["preferred", "rejected", "unreviewed"]),
      humanNote: z.string().optional(),
      rationale: z.string().min(1),
      implementationDirective: z.string().min(1),
      antiCopyConstraint: z.string().min(1),
    }),
  ),
  unresolved: z.array(z.object({ dimension: z.string(), reason: z.string() })),
  compiler: z.object({
    mode: z.enum(["agent", "deterministic"]),
    role: z.literal("Genome Synthesizer"),
    provider: z.string().optional(),
    model: z.string().optional(),
    promptVersion: z.string(),
  }),
  verification: z.object({
    status: z.literal("passed"),
    checks: z.array(z.string().min(1)).min(1),
  }),
});

export type HumanDecision = z.infer<typeof humanDecisionSchema>;
export type JudgedReference = z.infer<typeof judgedReferenceSchema>;
export type PortableProjectGenome = z.infer<typeof portableProjectGenomeSchema>;
type PortableRule = PortableProjectGenome["rules"][number];
type PackFile = { path: string; content: string; base64?: boolean };

type CompileInput = {
  title: string;
  brief: string;
  desiredAffect: string[];
  references: JudgedReference[];
};

function readableRuleTitle(sourceName: string, judgment: HumanDecision["judgment"]) {
  return judgment === "preferred" ? `${sourceName} — principle to carry forward` : `${sourceName} — pattern to leave behind`;
}

export function compileSessionGenome(input: CompileInput): PortableProjectGenome {
  const title = input.title.trim() || "Untitled experience";
  const brief = input.brief.trim() || "Create an original interactive experience from selected principles.";
  const desiredAffect = input.desiredAffect.map((item) => item.trim()).filter(Boolean);

  const rules: PortableRule[] = input.references.map(({ capture, decision }, index) => ({
    title: readableRuleTitle(capture.source.name, decision.judgment),
    rule: decision.rule.trim(),
    transformation:
      decision.judgment === "rejected" ? ("rejected" as const) : index === 0 ? ("inherited" as const) : ("mutated" as const),
    source: capture.source.name,
    sourceReferences: [
      {
        reference: `reference-${index + 1}`,
        sourceName: capture.source.name,
        sourceUrl: capture.source.url,
        evidenceMoments: capture.moments.map((moment) => moment.order),
      },
    ],
    evidenceMoments: capture.moments.map((moment) => moment.order),
    epistemicBasis: "inferred" as const,
    humanJudgment: decision.judgment,
    humanNote: decision.note?.trim() || undefined,
    rationale:
      decision.judgment === "preferred"
        ? "The user explicitly chose to carry this abstract principle into the destination project."
        : "The user explicitly rejected this pattern, so it remains as a negative constraint.",
    implementationDirective:
      decision.judgment === "preferred"
        ? `Translate this principle into ${title} with new composition, pacing, copy, and interaction mechanics.`
        : `Avoid this pattern in ${title}; satisfy the project brief through a different interaction strategy.`,
    antiCopyConstraint:
      "Do not reuse source assets, copy, geometry, layout, exact timing, camera paths, or branded visual language.",
  }));

  if (input.references.some((reference) => reference.decision.judgment === "preferred")) {
    rules.push({
      title: "An original convergence moment",
      rule: "Create one project-specific moment where the selected principles converge into a new interaction not present in any reference.",
      transformation: "invented" as const,
      source: undefined,
      sourceReferences: [],
      evidenceMoments: [],
      epistemicBasis: "user-specified" as const,
      humanJudgment: "preferred" as const,
      humanNote: `Invented for the brief: ${brief}`,
      rationale: "Introduces a project-specific convergence instead of averaging or cloning the references.",
      implementationDirective:
        "Prototype this moment independently, verify that it supports the desired affect, and keep its provenance marked as invented.",
      antiCopyConstraint:
        "The convergence moment must introduce new structure and motion rather than averaging the references.",
    });
  }

  const unresolved = Array.from(
    new Map(
      input.references.flatMap(({ capture }) =>
        capture.coverage
          .filter((item) => item.status !== "grounded")
          .map((item) => [`${item.dimension}:${item.reason}`, { dimension: item.dimension, reason: item.reason }] as const),
      ),
    ).values(),
  );

  return portableProjectGenomeSchema.parse({
    version: "project-genome@1",
    title,
    brief,
    desiredAffect,
    compiledAt: new Date().toISOString(),
    thesis: "The machine records what happened. The human decides what mattered.",
    rules,
    unresolved,
    compiler: {
      mode: "deterministic",
      role: "Genome Synthesizer",
      promptVersion: "local-genome-compiler-v1",
    },
    verification: {
      status: "passed",
      checks: [
        "Every non-invented rule retains a source reference.",
        "Human rejections remain explicit rejections.",
        "Unresolved dimensions remain unresolved.",
      ],
    },
  });
}

function ruleMarkdown(project: PortableProjectGenome) {
  return project.rules
    .map(
      (rule) =>
        `## ${rule.title}\n\n${rule.rule}\n\n- Treatment: ${rule.transformation}\n- Evidence source: ${rule.source ?? "Invented for this project"}\n- Human judgment: ${rule.humanJudgment}\n- Human note: ${rule.humanNote ?? "No note supplied"}\n- Rationale: ${rule.rationale}\n- Build directive: ${rule.implementationDirective}\n- Anti-copy: ${rule.antiCopyConstraint}`,
    )
    .join("\n\n");
}

function agentContext(project: PortableProjectGenome, agentName: string) {
  const activeRules = project.rules.filter((rule) => rule.transformation !== "rejected");
  const rejectedRules = project.rules.filter((rule) => rule.transformation === "rejected");

  return `# Experience context for ${agentName}\n\n## Project\n\n${project.title}\n\n${project.brief}\n\nDesired affect: ${project.desiredAffect.join(", ") || "Not specified"}.\n\n## Binding principles\n\n${activeRules.map((rule) => `- **${rule.title}:** ${rule.rule}\n  - Build: ${rule.implementationDirective}\n  - Constraint: ${rule.antiCopyConstraint}`).join("\n")}\n\n## Explicit rejections\n\n${rejectedRules.length ? rejectedRules.map((rule) => `- ${rule.rule}${rule.humanNote ? ` — ${rule.humanNote}` : ""}`).join("\n") : "- None supplied."}\n\n## Unknowns\n\n${project.unresolved.length ? project.unresolved.map((item) => `- ${item.dimension}: ${item.reason}`).join("\n") : "- None recorded."}\n\n## Provenance contract\n\nDo not describe inferred rules as direct measurements. Do not invent evidence for unresolved dimensions. Do not copy the references' assets, text, geometry, layout, exact timing, camera paths, or brand language.\n`;
}

export function buildSessionPackFiles(project: PortableProjectGenome, references: JudgedReference[]) {
  const screenshotFiles: PackFile[] = [];
  const evidence = references.map(({ capture, decision }, referenceIndex) => {
    const safeSource = capture.source.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "reference";
    const moments = capture.moments.map((moment) => {
      if (!moment.visual) return moment;

      const screenshotFile = `evidence/${String(referenceIndex + 1).padStart(2, "0")}-${safeSource}-moment-${moment.order}.jpg`;
      const { imageDataUrl, ...visualMeasurements } = moment.visual;
      screenshotFiles.push({
        path: screenshotFile,
        content: imageDataUrl.slice(imageDataUrl.indexOf(",") + 1),
        base64: true,
      });

      return { ...moment, visual: { ...visualMeasurements, screenshotFile } };
    });

    return {
      source: capture.source,
      capturedAt: capture.capturedAt,
      verifiedBy: capture.verification.provider,
      mode: capture.verification.mode,
      evidenceLayers: capture.verification.evidenceLayers,
      moments,
      transitions: capture.transitions,
      observation: capture.finding.observation,
      inference: capture.finding.inference,
      unknowns: capture.coverage.filter((item) => item.status !== "grounded"),
      humanDecision: decision,
    };
  });

  const files: PackFile[] = [
    {
      path: "README.md",
      content: `# ${project.title} — Experience Pack\n\nThis pack compiles live web evidence and explicit human judgment into portable creative context. It contains principles, not copied pixels.\n\n${project.thesis}\n`,
    },
    {
      path: "manifest.json",
      content: JSON.stringify(
        {
          format: "experience-pack@2",
          project: project.title,
          compiledAt: project.compiledAt,
          references: references.map(({ capture }) => ({
            name: capture.source.name,
            url: capture.source.url,
            verifiedBy: capture.verification.provider,
            capturedAt: capture.capturedAt,
          })),
        },
        null,
        2,
      ),
    },
    { path: "genome/PROJECT_GENOME.json", content: JSON.stringify(project, null, 2) },
    { path: "genome/EVIDENCE.json", content: JSON.stringify(evidence, null, 2) },
    { path: "design/PRINCIPLES.md", content: `# Experience principles\n\n${ruleMarkdown(project)}\n` },
    {
      path: "design/UNRESOLVED.md",
      content: `# What the capture did not establish\n\n${project.unresolved.map((item) => `- **${item.dimension}:** ${item.reason}`).join("\n") || "No unresolved dimensions were recorded."}\n`,
    },
    {
      path: "intent/PROJECT_BRIEF.md",
      content: `# ${project.title}\n\n${project.brief}\n\nDesired affect: ${project.desiredAffect.join(", ") || "Not specified"}.\n`,
    },
    {
      path: "intent/ANTI_COPY.md",
      content:
        "# Anti-copy contract\n\nUse the references to understand experiential principles only. Do not reuse source assets, text, geometry, layout, exact timing, camera paths, or branded visual language.\n",
    },
    { path: "agents/AGENTS.md", content: agentContext(project, "Codex and compatible coding agents") },
    { path: "agents/CLAUDE.md", content: agentContext(project, "Claude") },
    { path: "agents/GEMINI.md", content: agentContext(project, "Gemini") },
    { path: "agents/cursor.mdc", content: agentContext(project, "Cursor") },
    { path: "agents/copilot-instructions.md", content: agentContext(project, "GitHub Copilot") },
  ];

  return [...files, ...screenshotFiles];
}

export async function downloadSessionPack(project: PortableProjectGenome, references: JudgedReference[]) {
  const zip = new JSZip();
  const files = buildSessionPackFiles(project, references);
  files.forEach((file) => {
    if (file.base64) zip.file(file.path, file.content, { base64: true });
    else zip.file(file.path, file.content);
  });

  const blob = await zip.generateAsync({ type: "blob" });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = `${project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "experience"}-experience-pack.zip`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
}
