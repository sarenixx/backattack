import OpenAI from "openai";
import { NextResponse } from "next/server";

type ExtractedProduct = {
  url: string;
  title: string;
  priceText: string;
  description: string;
};

type Alternative = {
  name: string;
  priceEstimate: string;
  whyBetter: string;
};

type EvalResponse = {
  chairSummary: string;
  score: number;
  scoreBand: "Red" | "Yellow" | "Green";
  explanationBullets: string[];
  impactOnBody: string[];
  alternatives: Alternative[];
  assumptions: string[];
};

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function stripHtml(raw: string): string {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function between(raw: string, regex: RegExp): string {
  const m = raw.match(regex);
  return m?.[1]?.trim() ?? "";
}

function extractPrice(text: string): string {
  const m = text.match(/\$\s?\d{2,4}(?:\.\d{2})?/);
  return m ? m[0].replace(/\s+/g, "") : "Not listed";
}

function findBullets(text: string): string {
  const bulletKeywords = [
    "lumbar",
    "ergonomic",
    "adjustable",
    "tilt",
    "recline",
    "mesh",
    "headrest",
    "armrest",
    "seat",
  ];

  const parts = text
    .split(/[.!?]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  const hits = parts.filter((p) =>
    bulletKeywords.some((k) => p.toLowerCase().includes(k)),
  );

  return hits.slice(0, 8).join(". ");
}

async function extractProduct(url: string): Promise<ExtractedProduct> {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; backattack-mvp/1.0)",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch URL (${res.status})`);
  }

  const html = await res.text();
  const title =
    between(
      html,
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    ) ||
    between(html, /<title[^>]*>([^<]+)<\/title>/i) ||
    "Unknown chair";

  const bodyText = stripHtml(html);
  const description =
    findBullets(bodyText).slice(0, 1600) || bodyText.slice(0, 1600);

  return {
    url,
    title,
    priceText: extractPrice(bodyText),
    description,
  };
}

function band(score: number): "Red" | "Yellow" | "Green" {
  if (score <= 4) return "Red";
  if (score <= 7) return "Yellow";
  return "Green";
}

function fallbackEvaluate(
  product: ExtractedProduct,
  budgetMin?: number,
  budgetMax?: number,
): EvalResponse {
  const text = `${product.title} ${product.description}`.toLowerCase();
  let score = 6.0;
  const assumptions: string[] = [];

  if (text.includes("no lumbar") || text.includes("without lumbar")) score -= 2.0;
  else if (text.includes("adjustable lumbar")) score += 1.2;
  else assumptions.push("Lumbar type not explicit; assumed fixed lumbar support.");

  if (text.includes("mesh")) score += 0.5;
  if (text.includes("leather")) score -= 0.4;
  if (
    text.includes("4d arm") ||
    text.includes("recline") ||
    text.includes("tilt")
  )
    score += 0.6;
  if (text.includes("thin cushion") || text.includes("hard seat")) score -= 0.8;

  score = Math.max(1, Math.min(10, Number(score.toFixed(1))));

  const alternatives: Alternative[] = [];
  if (score <= 7) {
    const options: Alternative[] = [
      {
        name: "SIHOO M57",
        priceEstimate: "$299",
        whyBetter:
          "Adjustable lumbar, mesh back, and stronger tilt/recline controls improve spinal support and long-session comfort.",
      },
      {
        name: "Branch Ergonomic Chair",
        priceEstimate: "$359",
        whyBetter:
          "Higher adjustability and dynamic back support help reduce static lower-back loading.",
      },
      {
        name: "HON Ignition 2.0",
        priceEstimate: "$430",
        whyBetter:
          "Better seat/lumbar tuning and denser cushioning improve posture sustainability.",
      },
    ];

    const inBudget = options.filter((opt) => {
      const n = Number(opt.priceEstimate.replace(/[^\d]/g, ""));
      if (budgetMin && n < budgetMin) return false;
      if (budgetMax && n > budgetMax) return false;
      return true;
    });

    alternatives.push(...(inBudget.length > 0 ? inBudget : options).slice(0, 2));
  }

  return {
    chairSummary: `${product.title} (${product.priceText})`,
    score,
    scoreBand: band(score),
    explanationBullets: [
      "Scoring prioritized lumbar support quality, adjustability, pressure distribution, and backrest behavior over long sitting periods.",
      "The output is directional, not clinical diagnosis, and focuses on likely comfort/strain outcomes for desk work.",
      "If your current pain pattern matches the explained mechanism, the recommendation confidence is higher.",
    ],
    impactOnBody: [
      text.includes("no lumbar")
        ? "Without adjustable lumbar, your lower spine can round after 1-2 hours, increasing lower-back strain risk."
        : "If lumbar contour does not match your torso, static sitting can still build lower-back fatigue over time.",
      text.includes("thin cushion") || text.includes("hard seat")
        ? "Thin padding can create pressure points in glutes/thighs, making posture break down faster."
        : "Seat comfort likely stays moderate, but fit/adjustability still determine all-day posture quality.",
    ],
    alternatives,
    assumptions,
  };
}

function cleanJsonBlock(text: string): string {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

async function modelEvaluate(
  product: ExtractedProduct,
  budgetMin?: number,
  budgetMax?: number,
): Promise<EvalResponse> {
  if (!openai) {
    return fallbackEvaluate(product, budgetMin, budgetMax);
  }

  const budgetLine =
    budgetMin || budgetMax
      ? `Budget range: ${budgetMin ?? 0} to ${budgetMax ?? "open"} USD.`
      : "Budget range: not provided.";

  const prompt = `You are an ergonomic office-chair evaluator. Analyze the current chair from this extracted product text and return only strict JSON.

Product URL: ${product.url}
Product title: ${product.title}
Price text: ${product.priceText}
Extracted description bullets/text: ${product.description}
${budgetLine}

Rules:
- Focus on practical cause -> effect reasoning for back health.
- Keep explanation concrete, not generic.
- Score scale: 1-4 Red, 5-7 Yellow, 8-10 Green.
- If score <= 7, return exactly 1-2 better alternatives; include value options, not only premium brands.
- Alternatives should prefer the budget when provided.
- Avoid medical diagnosis language; ergonomic guidance only.

Return JSON with this exact schema:
{
  "chairSummary": "string",
  "score": number,
  "scoreBand": "Red" | "Yellow" | "Green",
  "explanationBullets": ["string", "string", "string", "optional string"],
  "impactOnBody": ["string", "string", "optional string"],
  "alternatives": [
    {"name": "string", "priceEstimate": "string", "whyBetter": "string"}
  ],
  "assumptions": ["string"]
}`;

  const response = await openai.responses.create({
    model: "gpt-5-mini",
    input: prompt,
    temperature: 0.3,
  });

  const raw = response.output_text || "";
  const parsed = JSON.parse(cleanJsonBlock(raw)) as EvalResponse;

  parsed.score = Math.max(1, Math.min(10, Number(parsed.score.toFixed(1))));
  parsed.scoreBand = band(parsed.score);
  if (parsed.score > 7) {
    parsed.alternatives = [];
  } else {
    parsed.alternatives = (parsed.alternatives || []).slice(0, 2);
  }

  return parsed;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      url?: string;
      budgetMin?: number;
      budgetMax?: number;
    };

    if (!body.url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const product = await extractProduct(body.url);
    const evaluation = await modelEvaluate(product, body.budgetMin, body.budgetMax);

    return NextResponse.json({
      product,
      evaluation,
      usedModel: Boolean(process.env.OPENAI_API_KEY),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
