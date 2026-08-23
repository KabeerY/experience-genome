import { NextResponse, type NextRequest } from "next/server";

import { interpretCapture } from "@/lib/agents/interpret";
import { evidenceInterpretationSchema } from "@/lib/agents/schema";
import { liveCaptureSchema } from "@/lib/capture/public-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    return Boolean(forwardedHost && new URL(origin).host === forwardedHost);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "This interpretation request came from an untrusted origin." }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (!contentType.includes("application/json") || contentLength > 3_000_000) {
    return NextResponse.json({ error: "Send one bounded capture as JSON." }, { status: 415 });
  }

  try {
    const body: unknown = await request.json();
    const envelope = body && typeof body === "object" && "capture" in body ? body : null;
    const capture = liveCaptureSchema.parse(envelope?.capture);
    const interpretation = await interpretCapture(capture);
    return NextResponse.json(evidenceInterpretationSchema.parse(interpretation), {
      headers: { "Cache-Control": "no-store, max-age=0", "X-Content-Type-Options": "nosniff" },
    });
  } catch (error) {
    console.error("[interpret] Evidence Interpreter failed.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "The Evidence Interpreter could not complete this run. The verified capture is still available." },
      { status: 502, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
