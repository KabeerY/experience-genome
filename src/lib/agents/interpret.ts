import "server-only";

import { buildOrderedContactSheet } from "@/lib/agents/contact-sheet";
import { enforceEvidenceProvenance } from "@/lib/agents/provenance";
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
  const interpreterModelId = process.env.VISION_MODEL_ID;
  const enableVision = process.env.INTERPRETER_ENABLE_VISION === "true";
  const identity = getModelIdentity(interpreterModelId);
  const contactSheet = enableVision ? await buildOrderedContactSheet(capture) : [];
  const hasRenderedInput = contactSheet.length > 0;
  const draft = await generateStructured({
    schema: evidenceInterpretationDraftSchema,
    schemaName: "evidence_interpretation",
    images: hasRenderedInput ? contactSheet : undefined,
    modelId: interpreterModelId,
    maxTokens: 2_600,
    reasoningEffort: "minimal",
    system: [
      "You are the Evidence Interpreter inside Experience Compiler.",
      "Analyze one bounded web journey using structured state/action/state evidence and ordered rendered frames.",
      "Separate direct observation, plausible interpretation, and unresolved unknowns.",
      "Never infer what the user likes; userStatement is a quote of their intent, not visual evidence.",
      "Never claim exact easing, continuous timing, hover physics, audio behavior, authorial intent, or causality unless supplied evidence establishes it.",
      "Observed claims must cite at least one valid moment number. Inferred claims may cite supporting moments but must use calibrated language.",
      "Create an abstract reusable experience rule, never a request to copy source assets, wording, composition, geometry, branding, or exact motion.",
      "Write for a product designer: specific, plain, concise, and useful. Keep each top-level summary to one sentence under 180 characters and the candidate rule under 220 characters.",
    ].join(" "),
    prompt: JSON.stringify({
      task: "Interpret this live web experience and produce provenance-safe claims.",
      renderedInput: hasRenderedInput
        ? `${contactSheet.length} compact ordered contact sheet${contactSheet.length === 1 ? " is" : "s are"} attached. Read every labeled frame in moment order.`
        : "Pixel frames remain human-visible and exportable. Your input contains the browser-measured properties and visible headings from each frame, not the pixels themselves.",
      capture: interpretationInput(capture),
    }),
  });
  const provenanceSafeDraft = enforceEvidenceProvenance(
    draft,
    validMoments,
    capture.finding.observation,
  );

  return evidenceInterpretationSchema.parse({
    ...provenanceSafeDraft,
    version: "evidence-interpretation@1",
    agent: {
      role: "Evidence Interpreter",
      provider: identity.provider,
      model: identity.id,
      promptVersion: "evidence-interpreter-v1",
      inputMode: hasRenderedInput ? "rendered-multimodal" : "rendered-measurements",
    },
    verification: {
      status: "passed",
      checks: [
        "Every observed claim cites a captured moment.",
        "Every cited moment exists in the live trace.",
        "Interpretive observed claims are deterministically downgraded.",
        "Normative preference remains reserved for the human.",
      ],
    },
  });
}
