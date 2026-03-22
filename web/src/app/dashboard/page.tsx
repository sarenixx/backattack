"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type TrackCounts = {
  page_view: number;
  analyze_click: number;
  analyze_success: number;
  analyze_fail: number;
  copy_share_click: number;
};

type TrackEvent = {
  event: keyof TrackCounts;
  sessionId: string;
  meta: Record<string, string | number | boolean | null>;
  ts: string;
};

type TrackResponse = {
  counts: TrackCounts;
  recent: TrackEvent[];
};

function pct(numerator: number, denominator: number): string {
  if (!denominator) return "0.0%";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

export default function DashboardPage() {
  const [data, setData] = useState<TrackResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const response = await fetch("/api/track", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load dashboard");
      const payload = (await response.json()) as TrackResponse;
      setData(payload);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected dashboard error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 8000);
    return () => window.clearInterval(id);
  }, []);

  const funnel = useMemo(() => {
    const counts = data?.counts;
    if (!counts) return null;
    return {
      analyzeToSuccess: pct(counts.analyze_success, counts.analyze_click),
      successToShare: pct(counts.copy_share_click, counts.analyze_success),
      analyzeToShare: pct(counts.copy_share_click, counts.analyze_click),
      failRate: pct(counts.analyze_fail, counts.analyze_click),
    };
  }, [data]);

  return (
    <main className="wrap dashboardWrap">
      <section className="panel">
        <p className="kicker">BackAttack Analytics</p>
        <h1>Funnel dashboard</h1>
        <p className="sub">
          Core funnel: analyze click {"->"} analyze success {"->"} copy share.
        </p>
        <div className="dashActions">
          <Link className="dashLink" href="/">
            Back to app
          </Link>
          <button type="button" onClick={() => void load()}>
            Refresh now
          </button>
        </div>
        {error ? <p className="error">{error}</p> : null}
      </section>

      <section className="panel">
        <h2>Counts</h2>
        {loading && !data ? <p className="muted">Loading...</p> : null}
        {data ? (
          <div className="statGrid">
            <article className="statCard">
              <p>Page views</p>
              <h3>{data.counts.page_view}</h3>
            </article>
            <article className="statCard">
              <p>Analyze clicks</p>
              <h3>{data.counts.analyze_click}</h3>
            </article>
            <article className="statCard">
              <p>Analyze success</p>
              <h3>{data.counts.analyze_success}</h3>
            </article>
            <article className="statCard">
              <p>Analyze fail</p>
              <h3>{data.counts.analyze_fail}</h3>
            </article>
            <article className="statCard">
              <p>Copy share clicks</p>
              <h3>{data.counts.copy_share_click}</h3>
            </article>
          </div>
        ) : null}
      </section>

      <section className="panel">
        <h2>Conversion</h2>
        {funnel ? (
          <div className="statGrid">
            <article className="statCard">
              <p>Analyze {"->"} Success</p>
              <h3>{funnel.analyzeToSuccess}</h3>
            </article>
            <article className="statCard">
              <p>Success {"->"} Share</p>
              <h3>{funnel.successToShare}</h3>
            </article>
            <article className="statCard">
              <p>Analyze {"->"} Share</p>
              <h3>{funnel.analyzeToShare}</h3>
            </article>
            <article className="statCard">
              <p>Analyze fail rate</p>
              <h3>{funnel.failRate}</h3>
            </article>
          </div>
        ) : (
          <p className="muted">No data yet.</p>
        )}
      </section>

      <section className="panel">
        <h2>Recent events</h2>
        {data?.recent.length ? (
          <div className="eventList">
            {data.recent.slice(0, 20).map((event) => (
              <article className="eventItem" key={`${event.ts}-${event.event}-${event.sessionId}`}>
                <p className="eventTop">
                  <strong>{event.event}</strong> <span>{new Date(event.ts).toLocaleString()}</span>
                </p>
                <p className="muted">session: {event.sessionId}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">No events captured yet.</p>
        )}
      </section>
    </main>
  );
}
