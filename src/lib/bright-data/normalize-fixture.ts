import { z } from "zod";

import { experienceTraceSchema, type ExperienceTrace } from "@/lib/genome/schema";

const fixtureStateSchema = z.object({
  sequence: z.string().regex(/^\d+$/),
  state: z.string(),
  prior_action: z.string(),
  heading: z.string(),
  text_excerpt: z.string(),
  section_id: z.string(),
  url: z.string().url(),
});

const replaySchema = z.object({
  collectorId: z.string().startsWith("c_"),
  snapshotId: z.string(),
  capturedAt: z.string(),
  dataset: z.array(
    z.object({
      experience_states: z.array(fixtureStateSchema),
      product_page_url: z.string().url(),
      input: z.object({ url: z.string().url() }),
    }),
  ).length(1),
});

export function normalizeFixtureReplay(input: unknown): ExperienceTrace {
  const replay = replaySchema.parse(input);
  const record = replay.dataset[0];

  return experienceTraceSchema.parse({
    id: "trace-drift-lab-v1",
    referenceId: "ref-drift-lab",
    sourceName: "Experience Compiler Drift Lab",
    sourceUrl: record.product_page_url,
    sourceMode: "controlled-fixture",
    collectorId: replay.collectorId,
    snapshotId: replay.snapshotId,
    capturedAt: replay.capturedAt,
    states: record.experience_states.map((state, index) => ({
      id: `S0${index + 1}`,
      sequence: Number(state.sequence),
      label: state.state,
      elapsedMs: [0, 1200, 1440][index] ?? index * 1000,
      url: state.url,
      heading: state.heading,
      textExcerpt: state.text_excerpt,
      signals: [
        { key: "phase", value: state.state.toLowerCase(), provenance: "dom" },
        { key: "prior_action", value: state.prior_action, provenance: "interaction" },
        { key: "section_id", value: state.section_id, provenance: "dom" },
      ],
    })),
    actions: [
      {
        id: "A01",
        fromState: "S01",
        toState: "S02",
        type: "scroll",
        label: "scroll +410px",
        durationMs: 1200,
        actor: "fixture",
      },
      {
        id: "A02",
        fromState: "S02",
        toState: "S03",
        type: "wait",
        label: "wait 240ms",
        durationMs: 240,
        actor: "fixture",
      },
    ],
    deltas: [
      {
        id: "D01",
        fromState: "S01",
        toState: "S02",
        summary: "After the scroll action, the fixture advances from inscription to approach.",
        kind: "observed-after-action",
        changedSignals: ["phase", "prior_action", "section_id"],
      },
      {
        id: "D02",
        fromState: "S02",
        toState: "S03",
        summary: "After the controlled wait, the fixture advances to semantic reveal.",
        kind: "mechanism-observed",
        changedSignals: ["phase", "prior_action", "section_id"],
      },
    ],
  });
}
