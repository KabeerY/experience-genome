import { NextResponse, type NextRequest } from "next/server";

import { capturePublicExperience, LiveCaptureError } from "@/lib/bright-data/live-capture";
import { captureErrorSchema, captureRequestSchema } from "@/lib/capture/public-contract";
import { PublicUrlError } from "@/lib/capture/public-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 12;
const requestWindows = new Map<string, number[]>();

function responseHeaders() {
  return {
    "Cache-Control": "no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
  };
}

function clientKey(request: NextRequest) {
  return (
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "local"
  );
}

function isRateLimited(request: NextRequest) {
  const now = Date.now();
  const key = clientKey(request);
  const recent = (requestWindows.get(key) ?? []).filter((timestamp) => now - timestamp < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) return true;
  recent.push(now);
  requestWindows.set(key, recent);
  return false;
}

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);
    const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    return Boolean(forwardedHost && originUrl.host === forwardedHost);
  } catch {
    return false;
  }
}

function errorResponse(
  code:
    | "INVALID_REQUEST"
    | "INVALID_URL"
    | "RATE_LIMITED"
    | "CAPTURE_NOT_CONFIGURED"
    | "CAPTURE_TIMED_OUT"
    | "CAPTURE_REJECTED"
    | "CAPTURE_FAILED",
  message: string,
  retryable: boolean,
  status: number,
) {
  return NextResponse.json(
    captureErrorSchema.parse({ error: { code, message, retryable } }),
    { status, headers: responseHeaders() },
  );
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return errorResponse("INVALID_REQUEST", "This capture request came from an untrusted origin.", false, 403);
  }

  if (isRateLimited(request)) {
    return errorResponse(
      "RATE_LIMITED",
      "This browser has started several live journeys recently. Wait a little before trying another.",
      true,
      429,
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (!contentType.includes("application/json") || contentLength > 4_096) {
    return errorResponse("INVALID_REQUEST", "Send a small JSON capture request.", false, 415);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_REQUEST", "The capture request was not valid JSON.", false, 400);
  }

  const parsed = captureRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("INVALID_REQUEST", "Enter a public website URL before starting capture.", false, 400);
  }

  try {
    const capture = await capturePublicExperience(parsed.data);
    return NextResponse.json(capture, { status: 200, headers: responseHeaders() });
  } catch (error) {
    if (error instanceof PublicUrlError) {
      return errorResponse("INVALID_URL", error.message, false, 400);
    }
    if (error instanceof LiveCaptureError) {
      const status = {
        CAPTURE_NOT_CONFIGURED: 503,
        CAPTURE_TIMED_OUT: 504,
        CAPTURE_REJECTED: 502,
        CAPTURE_FAILED: 502,
      }[error.code];
      return errorResponse(error.code, error.message, error.retryable, status);
    }

    return errorResponse(
      "CAPTURE_FAILED",
      "An unexpected capture error occurred. No replay data was substituted.",
      true,
      500,
    );
  }
}
