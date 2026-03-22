# BackAttack Web MVP

Paste a chair product URL and get:

- Ergonomic score (1-10 + Red/Yellow/Green)
- 3-4 explanation bullets
- Practical body-impact explanation
- 1-2 better alternatives when score <= 7

## Quick start

From `/workspaces/backattack/web`:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## GPT mode

To use GPT evaluation instead of fallback heuristics:

```bash
cp .env.example .env.local
# then set OPENAI_API_KEY in .env.local
```

When `OPENAI_API_KEY` is missing, the app still works using a deterministic fallback evaluator.

## Analytics (MVP)

The app tracks:

- `page_view`
- `analyze_click`
- `analyze_success`
- `analyze_fail`
- `copy_share_click`

These are collected by `POST /api/track` and kept in memory for quick iteration.

You can inspect current counts/recent events:

```bash
curl http://localhost:3000/api/track
```

Dashboard UI:

- `http://localhost:3000/dashboard`
- Auto-refreshes every 8 seconds and shows funnel conversion:
  `analyze_click -> analyze_success -> copy_share_click`

## Validate

```bash
npm run lint
npm run build
```
