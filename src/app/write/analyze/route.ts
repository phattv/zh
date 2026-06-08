import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /write/analyze
 *
 * Request:  `{ text: string }`
 * Response: `{ grammar, vocabulary, correctedText }`
 *
 * `correctedText` is built server-side from the grammar notes so Claude never
 * has to echo the full input text (fewer tokens, avoids JSON escaping issues).
 */

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a Chinese writing teacher. Return ONLY a valid JSON object — no markdown:

{
  "grammar": [{ "original": "...", "correction": "...", "explanation": "...", "explanation_en": "..." }],
  "vocabulary": [{ "word": "...", "suggestion": "...", "reason": "...", "reason_en": "..." }]
}

- grammar: real errors only (particles, word order, measure words). Max 4. Return [] if none.
- vocabulary: 0–3 upgrades where a simpler word could be more precise. Return [] if fine.
- All explanation/reason fields: Chinese first, English in the _en variant.`;

export async function POST(req: NextRequest) {
  const { text = "" } = await req.json().catch(() => ({}));

  if (!text.trim())
    return NextResponse.json({ error: "No text provided" }, { status: 400 });

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    temperature: 0,
    system: SYSTEM_PROMPT,
    messages: [
      { role: "user", content: `Analyze:\n"""\n${text}\n"""` },
      { role: "assistant", content: "{" },
    ],
  });

  const tail = msg.content[0].type === "text" ? msg.content[0].text : "}";
  const { grammar = [], vocabulary = [] } = JSON.parse("{" + tail);

  let correctedText = text;
  for (const { original, correction } of grammar) {
    correctedText = correctedText.replace(original, correction);
  }

  return NextResponse.json({ grammar, vocabulary, correctedText });
}
