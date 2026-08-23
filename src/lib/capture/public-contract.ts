import { z } from "zod";

export const captureRequestSchema = z.object({
  url: z.string().trim().min(1).max(2048),
  intent: z.string().trim().max(500).optional(),
});

export const capturedMomentSchema = z.object({
  order: z.number().int().positive(),
  stage: z.string().min(1),
  actionBefore: z.string().min(1),
  heading: z.string().min(1).optional(),
  excerpt: z.string().min(1).optional(),
  url: z.string().url(),
  visual: z
    .object({
      imageDataUrl: z.string().startsWith("data:image/jpeg;base64,").max(750_000),
      scrollY: z.number().int().nonnegative(),
      scrollProgress: z.number().min(0).max(1),
      viewport: z.object({
        width: z.number().int().positive(),
        height: z.number().int().positive(),
      }),
      visibleHeadings: z.array(z.string()).max(8),
      runningAnimations: z.number().int().nonnegative(),
      fixedElements: z.number().int().nonnegative(),
      stickyElements: z.number().int().nonnegative(),
      transformedElements: z.number().int().nonnegative(),
    })
    .optional(),
});

export const capturedTransitionSchema = z.object({
  from: z.number().int().positive(),
  to: z.number().int().positive(),
  action: z.string().min(1),
  observedChange: z.string().min(1),
});

export const captureCoverageSchema = z.object({
  dimension: z.string().min(1),
  status: z.enum(["grounded", "partial", "unresolved"]),
  reason: z.string().min(1),
});

export const liveCaptureSchema = z.object({
  version: z.literal("live-capture@1"),
  source: z.object({
    name: z.string().min(1),
    host: z.string().min(1),
    url: z.string().url(),
  }),
  capturedAt: z.string().datetime(),
  verification: z.object({
    provider: z.literal("Bright Data"),
    mode: z.literal("live"),
    recordCount: z.number().int().positive(),
    evidenceLayers: z.array(z.enum(["structured-journey", "rendered-browser"])).min(1),
  }),
  moments: z.array(capturedMomentSchema).min(2).max(8),
  transitions: z.array(capturedTransitionSchema),
  finding: z.object({
    observation: z.string().min(1),
    inference: z.string().min(1),
    candidateRule: z.string().min(1),
    caveat: z.string().min(1),
  }),
  coverage: z.array(captureCoverageSchema).min(1),
  intent: z.string().optional(),
  durationMs: z.number().int().nonnegative(),
});

export const captureErrorSchema = z.object({
  error: z.object({
    code: z.enum([
      "INVALID_REQUEST",
      "INVALID_URL",
      "RATE_LIMITED",
      "CAPTURE_NOT_CONFIGURED",
      "CAPTURE_TIMED_OUT",
      "CAPTURE_REJECTED",
      "CAPTURE_FAILED",
    ]),
    message: z.string().min(1),
    retryable: z.boolean(),
  }),
});

export type CaptureRequest = z.infer<typeof captureRequestSchema>;
export type CapturedMoment = z.infer<typeof capturedMomentSchema>;
export type LiveCapture = z.infer<typeof liveCaptureSchema>;
export type CaptureError = z.infer<typeof captureErrorSchema>;
