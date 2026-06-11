import { NextRequest, NextResponse } from "next/server";

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL ?? "";

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  console.log(
    JSON.stringify({
      event: "missing_word",
      query,
      ts: new Date().toISOString(),
    }),
  );

  await fetch(SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `🔍 Missing word reported: \`${query}\``,
    }),
  });

  return NextResponse.json({ ok: true });
}
