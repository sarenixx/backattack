"use client";

import { FormEvent, useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";

type ApiAlternative = {
  name: string;
  priceEstimate: string;
  whyBetter: string;
};

type ApiResponse = {
  product: {
    url: string;
    title: string;
    priceText: string;
    description: string;
  };
  evaluation: {
    chairSummary: string;
    score: number;
    scoreBand: "Red" | "Yellow" | "Green";
    explanationBullets: string[];
    impactOnBody: string[];
    alternatives: ApiAlternative[];
    assumptions: string[];
  };
  usedModel: boolean;
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    trackEvent("page_view", { page: "home" });
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    trackEvent("analyze_click", { hasBudget: Boolean(budgetMin || budgetMax) });
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          budgetMin: budgetMin ? Number(budgetMin) : undefined,
          budgetMax: budgetMax ? Number(budgetMax) : undefined,
        }),
      });

      const data = (await response.json()) as ApiResponse & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Failed to evaluate chair");
      }
      setResult(data);
      trackEvent("analyze_success", {
        score: data.evaluation.score,
        scoreBand: data.evaluation.scoreBand,
        usedModel: data.usedModel,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
      trackEvent("analyze_fail", {
        message,
      });
    } finally {
      setLoading(false);
    }
  }

  async function copyShareText() {
    if (!result) return;

    const firstImpact =
      result.evaluation.impactOnBody[0] ||
      "This chair likely affects posture over long sessions.";
    const firstAlt = result.evaluation.alternatives[0];

    const lines = [
      `I analyzed this chair: ${result.product.title}`,
      `Score: ${result.evaluation.score}/10 (${result.evaluation.scoreBand})`,
      `Why it matters: ${firstImpact}`,
      firstAlt
        ? `Better option: ${firstAlt.name} (${firstAlt.priceEstimate})`
        : "No replacement needed right now.",
      "Try it yourself: paste your chair URL into BackAttack.",
    ];

    await navigator.clipboard.writeText(lines.join("\n"));
    trackEvent("copy_share_click", {
      score: result.evaluation.score,
      scoreBand: result.evaluation.scoreBand,
    });
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="wrap">
      <section className="panel hero">
        <div className="heroCopy">
          <p className="kicker">BackAttack MVP</p>
          <h1>Find out if your chair is causing your back pain in under a minute.</h1>
          <p className="sub">
            Paste a product URL, get a plain-English ergonomic breakdown, and
            see better options if your current chair is holding you back.
          </p>
          <div className="valueBullets">
            <p>Cause and effect explanation, not generic ergonomic fluff</p>
            <p>Score that tells you if it is urgent to replace your chair</p>
            <p>1-2 practical alternatives when your score is weak</p>
          </div>
        </div>

        <div className="heroForm panel">
          <p className="formTitle">Analyze your chair now</p>
          <form onSubmit={onSubmit} className="form">
            <label htmlFor="url">Chair product URL</label>
            <input
              id="url"
              type="url"
              required
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />

            <div className="budgetRow">
              <div>
                <label htmlFor="budgetMin">Budget min (optional)</label>
                <input
                  id="budgetMin"
                  type="number"
                  min={0}
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="budgetMax">Budget max (optional)</label>
                <input
                  id="budgetMax"
                  type="number"
                  min={0}
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                />
              </div>
            </div>

            <button disabled={loading} type="submit">
              {loading ? "Analyzing..." : "Analyze chair"}
            </button>
          </form>
          {error ? <p className="error">{error}</p> : null}
        </div>
      </section>

      <section className="panel">
        <h2>How it works</h2>
        <div className="steps">
          <article className="step">
            <p className="stepNum">01</p>
            <p>Paste your current chair URL from Amazon or the brand site.</p>
          </article>
          <article className="step">
            <p className="stepNum">02</p>
            <p>We evaluate lumbar support, adjustability, pressure distribution, and long-sit posture risk.</p>
          </article>
          <article className="step">
            <p className="stepNum">03</p>
            <p>You get a score, why it matters for your body, and better options if needed.</p>
          </article>
        </div>
      </section>

      <section className="panel">
        <h2>What you get</h2>
        <div className="outcomes">
          <article className="outcome">
            <h3>Clear pain explanation</h3>
            <p>Understand the likely mechanism behind your lower-back strain during long work sessions.</p>
          </article>
          <article className="outcome">
            <h3>Decision confidence</h3>
            <p>Know whether to keep your chair, tweak your setup, or replace it now.</p>
          </article>
          <article className="outcome">
            <h3>Practical alternatives</h3>
            <p>Get replacements that fit your budget instead of only expensive flagship picks.</p>
          </article>
        </div>
      </section>

      {result ? (
        <section className="panel result">
          <div className="scoreRow">
            <div>
              <p className="muted">Current chair</p>
              <h2>{result.product.title}</h2>
              <p className="muted">{result.product.priceText}</p>
            </div>
            <div className={`scoreBadge ${result.evaluation.scoreBand.toLowerCase()}`}>
              {result.evaluation.score}/10 {result.evaluation.scoreBand}
            </div>
          </div>

          <h3>Why this score</h3>
          <ul>
            {result.evaluation.explanationBullets.slice(0, 4).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3>Impact on your body</h3>
          <ul>
            {result.evaluation.impactOnBody.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          {result.evaluation.assumptions.length > 0 ? (
            <>
              <h3>Assumptions made</h3>
              <ul>
                {result.evaluation.assumptions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          ) : null}

          <h3>Recommended alternatives (1-2)</h3>
          {result.evaluation.alternatives.length > 0 ? (
            <div className="cards">
              {result.evaluation.alternatives.map((alt) => (
                <article className="card" key={`${alt.name}-${alt.priceEstimate}`}>
                  <p className="cardTitle">
                    {alt.name} <span>{alt.priceEstimate}</span>
                  </p>
                  <p>{alt.whyBetter}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="goodNews">
              No direct alternatives were returned. Try adding a budget range for
              closer matches.
            </p>
          )}

          <p className="muted modelTag">
            Engine: {result.usedModel ? "GPT evaluation" : "Fallback heuristic"}
          </p>

          <h3>Shareable card</h3>
          <article className="shareCard">
            <p className="shareTop">BackAttack Chair Check</p>
            <p className="shareTitle">{result.product.title}</p>
            <p className={`shareScore ${result.evaluation.scoreBand.toLowerCase()}`}>
              {result.evaluation.score}/10 {result.evaluation.scoreBand}
            </p>
            <p className="shareBody">
              {result.evaluation.impactOnBody[0] ||
                "This chair likely impacts posture over long sessions."}
            </p>
            {result.evaluation.alternatives[0] ? (
              <p className="shareAlt">
                Better pick: {result.evaluation.alternatives[0].name} (
                {result.evaluation.alternatives[0].priceEstimate})
              </p>
            ) : (
              <p className="shareAlt">This one is good enough to keep for now.</p>
            )}
          </article>
          <button type="button" className="copyBtn" onClick={copyShareText}>
            {copied ? "Copied" : "Copy share text"}
          </button>
        </section>
      ) : null}
    </main>
  );
}
