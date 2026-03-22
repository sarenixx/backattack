"use client";

export type TrackEventName =
  | "page_view"
  | "analyze_click"
  | "analyze_success"
  | "analyze_fail"
  | "copy_share_click";

type TrackMeta = Record<string, string | number | boolean | null>;

const SESSION_KEY = "backattack_session_id";

function getSessionId(): string {
  const fromStorage = window.localStorage.getItem(SESSION_KEY);
  if (fromStorage) {
    return fromStorage;
  }
  const sessionId = `s_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
  window.localStorage.setItem(SESSION_KEY, sessionId);
  return sessionId;
}

export function trackEvent(event: TrackEventName, meta: TrackMeta = {}) {
  const payload = JSON.stringify({
    event,
    sessionId: getSessionId(),
    meta,
  });

  // sendBeacon is resilient during navigation/unload; fallback to fetch otherwise.
  if (navigator.sendBeacon) {
    const blob = new Blob([payload], { type: "application/json" });
    navigator.sendBeacon("/api/track", blob);
    return;
  }

  void fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  });
}
