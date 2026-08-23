import { z } from "zod";

import { experienceTraceSchema, type ExperienceTrace } from "@/lib/genome/schema";

const realWebStateSchema = z.object({
  sequence: z.number().int().positive(),
  state: z.string(),
  prior_action: z.string(),
  heading: z.string().optional(),
  text_excerpt: z.string().optional(),
  section_id: z.string().optional(),
  url: z.string().url(),
});

const replaySchema = z.object({
  collectorId: z.string().startsWith("c_"),
  snapshotId: z.string(),
  capturedAt: z.string(),
  dataset: z.array(
    z.object({
      experience_states: z.array(realWebStateSchema).min(2),
      product_page_url: z.string().url(),
      input: z.object({ url: z.string().url() }),
    }),
  ).length(1),
});

export function normalizeRealWebReplay(input: unknown): ExperienceTrace {
  const replay = replaySchema.parse(input);
  const record = replay.dataset[0];

  const states = record.experience_states.map((state, index) => ({
    id: `LS0${index + 1}`,
    sequence: state.sequence,
    label: state.state.replaceAll("_", " ").toUpperCase(),
    elapsedMs: index * 1000,
    url: state.url,
    heading: state.heading ?? "Heading not extracted",
    textExcerpt: state.text_excerpt ?? "No text excerpt returned by the bounded collector.",
    signals: [
      { key: "phase", value: state.state, provenance: "dom" as const },
      { key: "prior_action", value: state.prior_action, provenance: "interaction" as const },
      {
        key: "heading_capture",
        value: state.heading ? "present" : "not_extracted",
        provenance: "dom" as const,
      },
    ],
  }));

  return experienceTraceSchema.parse({
    id: "trace-linear-real-web-v1",
    referenceId: "ref-linear-real-web",
    sourceName: "Linear public landing page",
    sourceUrl: record.product_page_url,
    sourceMode: "verified-replay",
    collectorId: replay.collectorId,
    snapshotId: replay.snapshotId,
    capturedAt: replay.capturedAt,
    states,
    actions: states.slice(0, -1).map((state, index) => ({
      id: `LA0${index + 1}`,
      fromState: state.id,
      toState: states[index + 1].id,
      type: "scroll" as const,
      label: "scroll · distance not captured",
      durationMs: 0,
      actor: "bright-data-browser-worker" as const,
    })),
    deltas: states.slice(0, -1).map((state, index) => ({
      id: `LD0${index + 1}`,
      fromState: state.id,
      toState: states[index + 1].id,
      summary: `After scroll, the captured page region changed from ${state.label.toLowerCase()} to ${states[index + 1].label.toLowerCase()}.`,
      kind: "observed-after-action" as const,
      changedSignals: ["phase", "prior_action", "heading_capture"],
    })),
  });
}
