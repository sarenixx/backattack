import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EventName =
  | "page_view"
  | "analyze_click"
  | "analyze_success"
  | "analyze_fail"
  | "copy_share_click";

type TrackPayload = {
  event: EventName;
  sessionId?: string;
  meta?: Record<string, string | number | boolean | null>;
};

type EventRecord = {
  event: EventName;
  sessionId: string;
  meta: Record<string, string | number | boolean | null>;
  ts: string;
};

const MAX_RECENT_EVENTS = 200;

type TrackState = {
  counts: {
    page_view: number;
    analyze_click: number;
    analyze_success: number;
    analyze_fail: number;
    copy_share_click: number;
  };
  recent: EventRecord[];
};

declare global {
  var __backattackTrackState: TrackState | undefined;
}

const state: TrackState =
  globalThis.__backattackTrackState ??
  (globalThis.__backattackTrackState = {
    counts: {
      page_view: 0,
      analyze_click: 0,
      analyze_success: 0,
      analyze_fail: 0,
      copy_share_click: 0,
    },
    recent: [],
  });

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TrackPayload;
    if (!body?.event || !(body.event in state.counts)) {
      return NextResponse.json({ error: "invalid event" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const sessionId = body.sessionId ?? "anonymous";
    const meta = body.meta ?? {};

    state.counts[body.event] += 1;
    state.recent.unshift({
      event: body.event,
      sessionId,
      meta,
      ts: now,
    });
    if (state.recent.length > MAX_RECENT_EVENTS) {
      state.recent.length = MAX_RECENT_EVENTS;
    }

    console.log("[track]", body.event, { sessionId, meta, ts: now });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({
    counts: state.counts,
    recent: state.recent.slice(0, 50),
  });
}
