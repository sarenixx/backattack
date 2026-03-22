import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const openaiConfigured = Boolean(process.env.OPENAI_API_KEY);

  return NextResponse.json({
    status: "ok",
    openaiConfigured,
    environment: process.env.VERCEL_ENV ?? "local",
    timestamp: new Date().toISOString(),
  });
}
