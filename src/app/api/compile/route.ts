import { NextResponse, type NextRequest } from "next/server";

import { synthesizeJudgedProject } from "@/lib/agents/synthesize";

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
    return NextResponse.json({ error: "This synthesis request came from an untrusted origin." }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (!contentType.includes("application/json") || contentLength > 5_000_000) {
    return NextResponse.json({ error: "Send a bounded judged project as JSON." }, { status: 415 });
  }

  try {
    const body: unknown = await request.json();
    const project = await synthesizeJudgedProject(body);
    return NextResponse.json(project, {
      headers: { "Cache-Control": "no-store, max-age=0", "X-Content-Type-Options": "nosniff" },
    });
  } catch (error) {
    console.error("[compile] Genome Synthesizer failed.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "The Genome Synthesizer could not complete this run. Your evidence and judgments are still intact." },
      { status: 502, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
