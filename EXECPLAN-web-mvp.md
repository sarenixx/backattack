# Launch a weekend web MVP for chair URL scoring

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

`PLANS.md` exists at the repository root, and this document is maintained in accordance with `/workspaces/backattack/PLANS.md`.

## Purpose / Big Picture

After this change, a user can paste a chair product URL into a web form and receive an ergonomic score, concise cause-and-effect explanation for likely back impact, and 1-2 better alternatives when the score is 7 or below. This is intentionally a launch-first MVP with minimal infrastructure: one page and one API route.

## Progress

- [x] (2026-03-22 00:30Z) Reviewed user pivot request and chose web MVP scope over expanding CLI complexity.
- [x] (2026-03-22 00:33Z) Scaffolded Next.js app at `web/`.
- [x] (2026-03-22 00:39Z) Implemented `/api/evaluate` route to fetch URL content and extract title/price/description text.
- [x] (2026-03-22 00:42Z) Added GPT evaluation path and deterministic fallback evaluator.
- [x] (2026-03-22 00:45Z) Replaced default UI with single-form and results-focused flow.
- [x] (2026-03-22 00:47Z) Verified quality gates: `npm run lint`, `npm run build`.
- [x] (2026-03-22 00:50Z) Updated README/docs and added `.env.example`.
- [x] (2026-03-22 00:58Z) Added shareable result card + copy-to-clipboard social text output on results page.
- [x] (2026-03-22 01:07Z) Added MVP analytics instrumentation (page view, analyze click/success/fail, share-copy click) and in-memory event collector endpoint.
- [x] (2026-03-22 01:18Z) Added `/dashboard` analytics view with counts, conversion rates, and recent events.
- [x] (2026-03-22 01:28Z) Expanded landing page into a full product narrative (hero, value bullets, how-it-works, outcomes) while preserving analyzer flow.
- [x] (2026-03-22 01:56Z) Updated recommendation behavior to always return 1-2 budget-aligned alternatives, regardless of score.

## Surprises & Discoveries

- Observation: Some external domains may reject fetches in local dev environment, so end-to-end URL extraction can fail by site.
  Evidence: POST to `/api/evaluate` with `https://example.com` returned `fetch failed`; localhost URL worked.
- Observation: A fallback path is required for smooth demoing without API key setup.
  Evidence: `usedModel: false` responses returned complete score/explanation payload with heuristic path.
- Observation: Analytics endpoint can stay database-free initially by exposing in-memory counters for rapid iteration.
  Evidence: `GET /api/track` returns live counts and recent event payloads during local testing.
- Observation: Seeing conversion percentages in UI immediately highlights funnel bottlenecks without needing external tooling.
  Evidence: `/dashboard` computes and displays analyze->success, success->share, and analyze->share conversion rates.
- Observation: The minimal form-only landing made value proposition unclear; expanding narrative sections improves first-visit comprehension.
  Evidence: New homepage now includes explicit sections for process and outcomes before/alongside input form.
- Observation: Users want alternatives even for high-scoring chairs to compare options within budget.
  Evidence: Product-direction feedback requested always-on recommendations.

## Decision Log

- Decision: Build Next.js app instead of deepening Python CLI for this stage.
  Rationale: User explicitly prioritized shipping speed and simple stack with one API route.
  Date/Author: 2026-03-22 / Codex
- Decision: Keep no-database architecture and use lightweight parsing over robust crawler logic.
  Rationale: Goal is insight MVP, not comprehensive product catalog extraction.
  Date/Author: 2026-03-22 / Codex
- Decision: Add deterministic fallback evaluator when OpenAI key is absent.
  Rationale: Keeps dev/demo flow operable with zero setup and reduces launch friction.
  Date/Author: 2026-03-22 / Codex
- Decision: Implement sharing as a text-based card + copy action rather than image export.
  Rationale: This ships faster, works without extra dependencies, and is immediately useful for content loops.
  Date/Author: 2026-03-22 / Codex
- Decision: Implement first-pass analytics as internal API event logging instead of external analytics SaaS.
  Rationale: Eliminates setup friction and captures enough behavior data to guide immediate product iterations.
  Date/Author: 2026-03-22 / Codex
- Decision: Add a built-in dashboard route instead of relying only on raw JSON from `/api/track`.
  Rationale: Faster operational feedback loop for non-technical review during launch experiments.
  Date/Author: 2026-03-22 / Codex
- Decision: Keep analysis form above the fold but add supporting sections below it.
  Rationale: Preserves low-friction action while improving message clarity and conversion context.
  Date/Author: 2026-03-22 / Codex
- Decision: Always show 1-2 recommendations instead of gating by low scores.
  Rationale: Better user utility and stronger comparison workflow, while still budget-constraining outputs.
  Date/Author: 2026-03-22 / Codex

## Outcomes & Retrospective

The repo now contains a deployable web MVP matching the requested launch shape: paste URL, get score and targeted explanation, and always receive 1-2 budget-aligned chair recommendations. It now also has a more complete landing-page narrative, a shareable card with one-click copy text output, and a built-in analytics dashboard for funnel visibility. Remaining gaps: URL extraction is best-effort and analytics storage is process-memory only.

## Context and Orientation

Key files for this MVP:

- `web/src/app/page.tsx`: single-page UI for input and result rendering.
- `web/src/app/api/evaluate/route.ts`: API route handling URL fetch, extraction, GPT call, fallback evaluation, and response formatting.
- `web/src/app/api/track/route.ts`: API route receiving analytics events and serving in-memory counts/recent events.
- `web/src/lib/analytics.ts`: client-side helper for session-aware event tracking.
- `web/src/app/dashboard/page.tsx`: analytics dashboard view with conversion metrics and recent event stream.
- `web/src/app/globals.css`: visual style for focused MVP experience.
- `web/src/app/layout.tsx`: metadata and font setup.
- `web/.env.example`: environment variable template for `OPENAI_API_KEY`.

A "fallback evaluator" here means deterministic rules used when `OPENAI_API_KEY` is missing or model path is not available.

## Plan of Work

Implement a minimal vertical slice. First scaffold Next.js and ensure dev/build commands work. Then create an API route that fetches URL HTML and extracts only the minimum required product context (title, possible price, feature text). Add a GPT prompt that forces strict JSON output with required fields, and clamp results to MVP constraints (score 1-10, max 2 alternatives). Add heuristic fallback for no-key environments. Finally build a clean page to submit URL/budget and render results with clear sections emphasizing cause-effect insight.

## Concrete Steps

From `/workspaces/backattack/web`:

1. Install dependencies:

       npm install

2. Run dev server:

       npm run dev

3. Submit a URL via UI at `http://localhost:3000`.

4. Validate:

       npm run lint
       npm run build

Expected indicators:

- UI renders input form and results panel.
- API returns `score`, `scoreBand`, explanation bullets, impact bullets, and alternatives when score <= 7.
- `GET /api/track` shows non-zero counts after interacting with the page.
- `/dashboard` renders count cards and conversion rates from live `/api/track` data.
- Homepage shows hero, process, and outcome sections in addition to analyzer form.

## Validation and Acceptance

Acceptance is met when:

- User can paste URL and optional budget inputs in web UI.
- Response includes clear “why this affects your body” explanation bullets.
- Score follows Red/Yellow/Green mapping from 1-10 range.
- If score <= 7, 1-2 alternatives are shown.
- 1-2 alternatives are always shown and budget-aligned when possible.
- Analytics events are emitted for page view, analyze click, analyze success/fail, and copy-share action.
- `/dashboard` shows funnel conversion from `analyze_click` to `analyze_success` to `copy_share_click`.
- Landing page communicates product value beyond only URL input.
- `npm run lint` and `npm run build` pass in `web/`.

## Idempotence and Recovery

All setup steps are safe to rerun. If API model call fails or no key is configured, fallback mode continues to return usable output. If a site blocks scraping, retry with another URL and record domain-specific handling for future improvement.

## Artifacts and Notes

Example local API response shape (abbreviated):

    {
      "product": {"title": "...", "priceText": "..."},
      "evaluation": {
        "score": 6,
        "scoreBand": "Yellow",
        "alternatives": [{"name": "SIHOO M57", ...}]
      },
      "usedModel": false
    }

## Interfaces and Dependencies

Dependencies in `web/package.json` include `next`, `react`, `react-dom`, and `openai`.

The API contract from `POST /api/evaluate` returns:

- `product`: extracted URL metadata (`title`, `priceText`, `description`)
- `evaluation`: ergonomic analysis payload (`score`, `scoreBand`, `explanationBullets`, `impactOnBody`, `alternatives`, `assumptions`)
- `usedModel`: boolean indicating GPT path vs fallback path

Revision note (2026-03-22): Initial plan created after implementation to document scope pivot, decisions, and validation evidence as a restartable record.
Revision note (2026-03-22): Added the lightweight shareable-card feature and recorded rationale for text-first sharing format.
Revision note (2026-03-22): Added first-pass analytics instrumentation and in-memory event collector endpoint for funnel visibility.
Revision note (2026-03-22): Added `/dashboard` funnel view for rapid launch feedback without external analytics tooling.
Revision note (2026-03-22): Expanded landing page content structure to improve first-visit clarity and conversion readiness.
Revision note (2026-03-22): Changed recommendation policy to always provide 1-2 budget-aligned alternatives.
