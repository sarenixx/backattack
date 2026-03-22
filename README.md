# backattack

BackAttack ergonomic evaluation project.

## Web MVP (recommended)

The fastest launch path is now the Next.js app in [`web/`](/workspaces/backattack/web):

- Paste a chair URL
- Get a 1-10 score + concise “why this affects your back” explanation
- Get 1-2 better alternatives when the score is 7 or below

Run:

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:3000`.

Set `OPENAI_API_KEY` in `web/.env.local` to enable GPT-backed evaluation.

## CLI (legacy prototype)

```bash
python -m chair_eval.cli --description "Fixed-back task chair with no lumbar support and thin cushion" --budget-min 150 --budget-max 400
```

## Python tests

```bash
python -m unittest discover -s tests -v
```
