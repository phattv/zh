import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/learn/enrich
 *
 * Request:  `{ chinese: string, pinyin: string, en: string, hsk: number }`
 * Response: `{ explanation_zh, examples, synonyms, antonyms }`
 */

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a Chinese language teacher. Given a word, return ONLY a valid JSON object — no markdown:

{
  "explanation_zh": "...",
  "examples": [
    { "zh": "...", "pinyin": "...", "en": "..." }
  ],
  "synonyms": [
    { "chinese": "...", "pinyin": "...", "en": "..." }
  ],
  "antonyms": [
    { "chinese": "...", "pinyin": "...", "en": "..." }
  ]
}

Rules:
- explanation_zh: 1–2 sentences explaining the word's meaning IN CHINESE, appropriate for the given HSK level. Use simple Chinese for HSK 1–3, richer Chinese for HSK 4–6.
- examples: exactly 3 natural example sentences. Each with zh (Chinese), pinyin (with tone marks), en (English translation).
- synonyms: up to 4 real synonyms with chinese/pinyin/en. Return [] if none.
- antonyms: up to 4 real antonyms with chinese/pinyin/en. Return [] if none.
- Keep examples natural and level-appropriate.`;

export async function POST(req: NextRequest) {
  const { chinese = "", pinyin = "", en = "", hsk = 1 } = await req.json().catch(() => ({}));

  if (!chinese.trim())
    return NextResponse.json({ error: "No word provided" }, { status: 400 });

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1536,
    temperature: 0,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Word: ${chinese} (${pinyin}) — "${en}" — HSK ${hsk}`,
      },
      { role: "assistant", content: "{" },
    ],
  });

  const tail = msg.content[0].type === "text" ? msg.content[0].text : "}";
  const data = JSON.parse("{" + tail);

  return NextResponse.json({
    explanation_zh: data.explanation_zh ?? "",
    examples: data.examples ?? [],
    synonyms: data.synonyms ?? [],
    antonyms: data.antonyms ?? [],
  });
}
