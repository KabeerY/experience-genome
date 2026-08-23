import driftBaselineReplay from "@/data/replays/drift-baseline.json";
import razorpayRealWebReplay from "@/data/replays/razorpay-real-web.json";
import { normalizeFixtureReplay } from "@/lib/bright-data/normalize-fixture";
import { normalizeRealWebReplay } from "@/lib/bright-data/normalize-real-web";
import type { ExperienceGenome, ProjectGenome } from "@/lib/genome/schema";

export const demoTrace = normalizeFixtureReplay(driftBaselineReplay);
export const realWebTrace = normalizeRealWebReplay(razorpayRealWebReplay);

export const demoGenome: ExperienceGenome = {
  id: "genome-drift-lab",
  referenceId: "ref-drift-lab",
  name: "Arrival Before Meaning",
  claims: [
    {
      id: "C01",
      referenceId: "ref-drift-lab",
      dimension: "motion",
      statement: "Spatial arrival precedes semantic reveal.",
      interpretation: "The controlled state order establishes approach before asking the user to read.",
      epistemicBasis: "observed",
      humanJudgment: "preferred",
      humanNote: "Keep the heavy, patient feeling of the reveal.",
      evidenceRefs: ["S01", "A01", "S02", "A02", "S03", "D01", "D02"],
    },
    {
      id: "C02",
      referenceId: "ref-drift-lab",
      dimension: "affect",
      statement: "Withholding the semantic phase until after approach may create anticipation.",
      interpretation: "Anticipation is an inference from the recorded order, not a directly observed fact.",
      epistemicBasis: "inferred",
      humanJudgment: "preferred",
      humanNote: "I like that it feels patient without becoming slow.",
      evidenceRefs: ["S01", "S02", "S03", "D01", "D02"],
    },
    {
      id: "C03",
      referenceId: "ref-drift-lab",
      dimension: "layout",
      statement: "Reserve negative space around the primary intelligence object.",
      epistemicBasis: "user-specified",
      humanJudgment: "preferred",
      humanNote: "Do not bury the focal object in dashboard chrome.",
      evidenceRefs: [],
    },
    {
      id: "C04",
      referenceId: "ref-drift-lab",
      dimension: "mechanism",
      statement: "Audio response could not be established from the captured evidence.",
      epistemicBasis: "unresolved",
      humanJudgment: "unreviewed",
      evidenceRefs: ["S01", "S02", "S03"],
    },
  ],
  coverage: [
    {
      dimension: "Form",
      status: "grounded",
      reason: "The Bright Data record preserves headings, excerpts, state labels, and section IDs.",
      claimRefs: ["C03"],
    },
    {
      dimension: "Macro motion",
      status: "grounded",
      reason: "Three ordered states retain the triggering actions.",
      claimRefs: ["C01"],
    },
    {
      dimension: "Lighting intent",
      status: "unresolved",
      reason: "The bounded collector did not extract lighting measurements or authorial intent.",
      claimRefs: [],
    },
    {
      dimension: "Pointer physics",
      status: "partial",
      reason: "No repeated pointer trajectory was captured.",
      claimRefs: [],
    },
    {
      dimension: "Audio response",
      status: "unresolved",
      reason: "No reliable audio evidence was collected.",
      claimRefs: ["C04"],
    },
  ],
};

export const demoProjectGenome: ProjectGenome = {
  id: "project-genome-01",
  title: "Orbital Archive",
  brief: "A calm intelligence workspace that feels ancient, precise, and alive.",
  desiredAffect: ["anticipation", "weight", "lucid wonder"],
  generatedAt: "2026-08-23T16:47:00.000Z",
  model: {
    provider: "verified-replay",
    id: "curated-project-genome-v1",
    promptVersion: "genome-synthesis-v1-replay",
  },
  rules: [
    {
      id: "R01",
      title: "Arrival before language",
      rule: "Let the primary spatial event settle before revealing its semantic label.",
      transformation: "inherited",
      sourceClaimRefs: ["C01"],
      rationale: "Preserves the selected feeling of scale and anticipation.",
      implementationDirective: "Delay headline opacity until the hero object's approach animation completes.",
      antiCopyConstraint: "Do not reuse source geometry, timing values, copy, or camera path.",
    },
    {
      id: "R02",
      title: "Rhythmic withholding",
      rule: "Withhold secondary labels only during high-importance spatial transitions.",
      transformation: "mutated",
      sourceClaimRefs: ["C02"],
      rationale: "Mutates the inferred anticipation mechanism into a bounded project rule.",
      implementationDirective: "Reveal secondary labels after the focal object settles, then restore normal information density.",
      antiCopyConstraint: "Derive new durations, easing, hierarchy, and spatial composition from the project brief.",
    },
    {
      id: "R03",
      title: "No glass-card field",
      rule: "Reject dense fields of translucent cards around the focal object.",
      transformation: "rejected",
      sourceClaimRefs: ["C03"],
      rationale: "Human judgment explicitly prioritizes negative space.",
      implementationDirective: "Use one evidence panel at a time and let the world remain visible.",
      antiCopyConstraint: "Do not reproduce another product's panel grid or chrome hierarchy.",
    },
    {
      id: "R04",
      title: "Orbital capture",
      rule: "Secondary evidence converges as orbiting fragments, then resolves into labels only after attachment.",
      transformation: "invented",
      sourceClaimRefs: [],
      rationale: "Combines the brief's archival metaphor with selected temporal restraint.",
      implementationDirective: "Animate evidence fragments along distinct arcs into a stable rule node.",
      antiCopyConstraint: "Use original trajectories, silhouettes, vocabulary, and material language.",
    },
  ],
};

export const realWebGenome: ExperienceGenome = {
  id: "genome-razorpay-buildathon",
  referenceId: "ref-razorpay-buildathon",
  name: "Razorpay Buildathon experience genome",
  claims: [
    {
      id: "LC01",
      referenceId: "ref-razorpay-buildathon",
      dimension: "interaction",
      statement: "Successive scrolls traverse three semantically distinct page regions.",
      interpretation: "The bounded capture establishes sequence, but not animation quality or scroll distance.",
      epistemicBasis: "observed",
      humanJudgment: "unreviewed",
      evidenceRefs: ["LS01", "LA01", "LS02", "LA02", "LS03", "LD01", "LD02"],
    },
    {
      id: "LC02",
      referenceId: "ref-razorpay-buildathon",
      dimension: "semantics",
      statement: "The page appears to distribute its product story across a long vertical narrative.",
      interpretation: "This is an inference from region order and captured headings, not a measurement of reader attention.",
      epistemicBasis: "inferred",
      humanJudgment: "unreviewed",
      evidenceRefs: ["LS01", "LS02", "LS03"],
    },
    {
      id: "LC03",
      referenceId: "ref-razorpay-buildathon",
      dimension: "motion",
      statement: "Transition timing, easing, and visual continuity remain unknown.",
      interpretation: "The collector observed navigation order but returned no reliable motion measurements.",
      epistemicBasis: "unresolved",
      humanJudgment: "neutral",
      evidenceRefs: [],
    },
  ],
  coverage: [
    {
      dimension: "Semantic sequence",
      status: "grounded",
      reason: "Three ordered public page regions and their prior actions were returned by Bright Data.",
      claimRefs: ["LC01"],
    },
    {
      dimension: "Narrative intent",
      status: "partial",
      reason: "Region order is observed; the intent assigned to that order is inferred.",
      claimRefs: ["LC02"],
    },
    {
      dimension: "Transition motion",
      status: "unresolved",
      reason: "No timing, easing, screenshots, or frame-level deltas were captured.",
      claimRefs: ["LC03"],
    },
    {
      dimension: "Pointer and audio response",
      status: "unresolved",
      reason: "The bounded run did not test hover, pointer physics, or audio.",
      claimRefs: [],
    },
  ],
};

export const realWebProjectRule = {
  id: "R05",
  title: "Narrative depth markers",
  rule: "Let each major scroll region advance one legible idea while preserving a visible sense of journey.",
  transformation: "mutated" as const,
  sourceClaimRefs: ["LC01"],
  rationale: "Carries the selected vertical sequencing principle into a new, bounded narrative system.",
  implementationDirective: "Assign every major viewport region one semantic milestone and expose progress without copying source layout or copy.",
  antiCopyConstraint: "Invent new milestones, composition, pacing, typography, assets, and transitions for the destination project.",
};

export const demoTraces = [demoTrace, realWebTrace];
export const demoGenomes = [demoGenome, realWebGenome];
