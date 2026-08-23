import JSZip from "jszip";

import type {
  ExperienceGenome,
  ExperienceTrace,
  ProjectGenome,
} from "@/lib/genome/schema";
import { verifyProvenance } from "@/lib/genome/verify";

export type PackFile = {
  path: string;
  content: string;
};

type PackInput = {
  traces: ExperienceTrace[];
  genomes: ExperienceGenome[];
  project: ProjectGenome;
};

function ruleMarkdown(project: ProjectGenome, dimension: string) {
  const rules = project.rules.filter((rule) => {
    const searchable = `${rule.title} ${rule.rule} ${rule.implementationDirective}`.toLowerCase();
    return searchable.includes(dimension.toLowerCase());
  });
  const selected = rules.length > 0 ? rules : project.rules;

  return selected
    .map(
      (rule) =>
        `## ${rule.id} — ${rule.title}\n\n${rule.rule}\n\n- Transformation: ${rule.transformation}\n- Why: ${rule.rationale}\n- Build directive: ${rule.implementationDirective}\n- Anti-copy: ${rule.antiCopyConstraint}\n- Source claims: ${rule.sourceClaimRefs.join(", ") || "invented for this project"}`,
    )
    .join("\n\n");
}

function agentContext(project: ProjectGenome, agent: string) {
  const rules = project.rules
    .filter((rule) => rule.transformation !== "rejected")
    .map(
      (rule) =>
        `- [${rule.id}] ${rule.rule}\n  Implementation: ${rule.implementationDirective}\n  Constraint: ${rule.antiCopyConstraint}`,
    )
    .join("\n");

  return `# Experience context for ${agent}\n\nProject: ${project.title}\n\n${project.brief}\n\nDesired affect: ${project.desiredAffect.join(", ")}\n\n## Binding experience rules\n\n${rules}\n\n## Provenance discipline\n\nKeep every rule ID in implementation notes. Do not copy source assets, text, geometry, layout, or exact timing. Treat unresolved dimensions as open design decisions rather than inventing source evidence.\n`;
}

export function buildPackFiles({ traces, genomes, project }: PackInput): PackFile[] {
  const issues = verifyProvenance(traces, genomes, project);
  const manifest = {
    format: "experience-pack@1",
    project: project.title,
    generatedAt: new Date().toISOString(),
    compiler: "EXPERIENCE//COMPILER",
    provenance: {
      collectorIds: [...new Set(traces.map((trace) => trace.collectorId))],
      snapshotIds: [...new Set(traces.map((trace) => trace.snapshotId))],
      model: project.model,
    },
    verification: {
      status: issues.some((issue) => issue.severity === "error") ? "failed" : "passed",
      issues,
    },
  };

  return [
    { path: "manifest.json", content: JSON.stringify(manifest, null, 2) },
    {
      path: "genome/EXPERIENCE_GENOME.json",
      content: JSON.stringify(genomes, null, 2),
    },
    {
      path: "genome/PROJECT_GENOME.json",
      content: JSON.stringify(project, null, 2),
    },
    {
      path: "genome/EVIDENCE.json",
      content: JSON.stringify(
        traces.flatMap((trace) => [...trace.states, ...trace.actions, ...trace.deltas]),
        null,
        2,
      ),
    },
    { path: "genome/TRACES.json", content: JSON.stringify(traces, null, 2) },
    {
      path: "design/FORM.md",
      content: `# Form\n\n${ruleMarkdown(project, "object")}`,
    },
    {
      path: "design/MOTION.md",
      content: `# Motion\n\n${ruleMarkdown(project, "animation")}`,
    },
    {
      path: "design/SCENE.md",
      content: `# Scene\n\n${ruleMarkdown(project, "spatial")}`,
    },
    {
      path: "design/AFFECT.md",
      content: `# Intended affect\n\n${project.desiredAffect.map((item) => `- ${item}`).join("\n")}\n\n${ruleMarkdown(project, "feeling")}`,
    },
    {
      path: "design/TOKENS.json",
      content: JSON.stringify(
        {
          note: "Project-level tokens derived from rules, not copied source values.",
          colorRoles: ["void", "bone", "cobalt-structure", "ember-motion", "brass-evidence"],
          motionRoles: ["approach", "settle", "semantic-reveal", "orbital-capture"],
        },
        null,
        2,
      ),
    },
    {
      path: "intent/PROJECT_BRIEF.md",
      content: `# ${project.title}\n\n${project.brief}\n\nDesired affect: ${project.desiredAffect.join(", ")}.\n`,
    },
    {
      path: "intent/ANTI_COPY.md",
      content: `# Anti-copy contract\n\n${project.rules.map((rule) => `- [${rule.id}] ${rule.antiCopyConstraint}`).join("\n")}\n`,
    },
    { path: "agents/AGENTS.md", content: agentContext(project, "Codex and compatible agents") },
    { path: "agents/CLAUDE.md", content: agentContext(project, "Claude") },
    { path: "agents/GEMINI.md", content: agentContext(project, "Gemini") },
    { path: "agents/cursor.mdc", content: agentContext(project, "Cursor") },
    {
      path: "agents/copilot-instructions.md",
      content: agentContext(project, "GitHub Copilot"),
    },
  ];
}

export async function downloadExperiencePack(input: PackInput) {
  const zip = new JSZip();
  const files = buildPackFiles(input);

  for (const file of files) {
    zip.file(file.path, file.content);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "experience-pack.zip";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);

  return files.length;
}
