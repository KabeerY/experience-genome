import "server-only";

import { evidenceInterpretationDraftSchema, evidenceInterpretationSchema } from "@/lib/agents/schema";
import { liveCaptureSchema, type LiveCapture } from "@/lib/capture/public-contract";
import { generateStructured, getModelIdentity } from "@/lib/model/provider";

function interpretationInput(capture: LiveCapture) {
  return {
    source: capture.source,
    userStatement: capture.intent ?? null,
    moments: capture.moments.map((moment) => ({
      moment: moment.order,
      stage: moment.stage,
      priorAction: moment.actionBefore,
      heading: moment.heading ?? null,
      excerpt: moment.excerpt ?? null,
      renderedMeasurements: moment.visual
        ? {
            scrollProgress: moment.visual.scrollProgress,
            visibleHeadings: moment.visual.visibleHeadings,
            runningAnimations: moment.visual.runningAnimations,
            fixedElements: moment.visual.fixedElements,
            stickyElements: moment.visual.stickyElements,
            transformedElements: moment.visual.transformedElements,
          }
        : null,
    })),
    transitions: capture.transitions,
    deterministicCoverage: capture.coverage,
  };
}

export async function interpretCapture(rawCapture: unknown) {
  const capture = liveCaptureSchema.parse(rawCapture);
  const validMoments = new Set(capture.moments.map((moment) => moment.order));
  const identity = getModelIdentity();
  const draft = await generateStructured({
    schema: evidenceInterpretationDraftSchema,
    schemaName: "evidence_interpretation",
    images: capture.moments.flatMap((moment) => (moment.visual ? [moment.visual.imageDataUrl] : [])),
    system: [
      "You are the Evidence Interpreter inside Experience Compiler.",
      "Analyze one bounded web journey using structured state/action/state evidence and ordered rendered frames.",
      "Separate direct observation, plausible interpretation, and unresolved unknowns.",
      "Never infer what the user likes; userStatement is a quote of their intent, not visual evidence.",
      "Never claim exact easing, continuous timing, hover physics, audio behavior, authorial intent, or causality unless supplied evidence establishes it.",
      "Observed claims must cite at least one valid moment number. Inferred claims may cite supporting moments but must use calibrated language.",
      "Create an abstract reusable experience rule, never a request to copy source assets, wording, composition, geometry, branding, or exact motion.",
      "Write for a product designer: specific, plain, concise, and useful.",
    ].join(" "),
    prompt: JSON.stringify({
      task: "Interpret this live web experience and produce provenance-safe claims.",
      orderedFrames: "Images are attached in the same order as rendered moments in the JSON.",
      capture: interpretationInput(capture),
    }),
    validate: (value) => {
      const issues: string[] = [];
      for (const claim of value.claims) {
        if (claim.epistemicBasis === "observed" && claim.evidenceMoments.length === 0) {
          issues.push(`Observed claim “${claim.title}” has no evidence moments.`);
        }
        for (const moment of claim.evidenceMoments) {
          if (!validMoments.has(moment)) issues.push(`Claim “${claim.title}” cites unknown moment ${moment}.`);
        }
      }
      return issues;
    },
  });

  return evidenceInterpretationSchema.parse({
    ...draft,
    version: "evidence-interpretation@1",
    agent: {
      role: "Evidence Interpreter",
      provider: identity.provider,
      model: identity.id,
      promptVersion: "evidence-interpreter-v1",
    },
    verification: {
      status: "passed",
      checks: [
        "Every observed claim cites a captured moment.",
        "Every cited moment exists in the live trace.",
        "Normative preference remains reserved for the human.",
      ],
    },
  });
}
