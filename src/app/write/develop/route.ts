import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /write/develop
 *
 * Request:  `{ text: string, action: string }`
 * Response: `{ result: string, note_en: string }`
 *
 * Actions: develop | longer | shorter | simpler | richer | hsk1–hsk6
 */

const client = new Anthropic();

const INSTRUCTIONS: Record<string, string> = {
  develop: "Expand the rough notes or draft into a coherent, well-structured paragraph with smooth transitions. Use natural HSK 4–5 vocabulary.",
  longer:  "Expand the text with more detail, examples, or supporting points while keeping the same style and register.",
  shorter: "Condense to the essential points only, removing any redundancy. Keep every sentence meaningful.",
  simpler: "Rewrite using simpler everyday vocabulary and shorter sentences, appropriate for HSK 2–3 learners.",
  richer:  "Enhance with richer vocabulary, idiomatic expressions, and more varied sentence structures.",
  hsk1: "Rewrite using only the most basic vocabulary and simple patterns (HSK 1 level).",
  hsk2: "Rewrite entirely at HSK 2 level vocabulary and grammar.",
  hsk3: "Rewrite entirely at HSK 3 level vocabulary and grammar.",
  hsk4: "Rewrite entirely at HSK 4 level vocabulary and grammar.",
  hsk5: "Rewrite entirely at HSK 5 level vocabulary and grammar.",
  hsk6: "Rewrite at HSK 6 level using sophisticated vocabulary and complex structures.",
};

export async function POST(req: NextRequest) {
  const { text = "", action = "" } = await req.json().catch(() => ({}));

  if (!text.trim())
    return NextResponse.json({ error: "No text provided" }, { status: 400 });

  const instruction = INSTRUCTIONS[action];
  if (!instruction)
    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    temperature: 0,
    system: `You are a Chinese writing assistant. Return ONLY a JSON object — no markdown:
{ "result": "...", "note_en": "..." }
- result: the transformed Chinese text
- note_en: one English sentence summarising the main changes made`,
    messages: [
      { role: "user", content: `Instruction: ${instruction}\n\nText:\n"""\n${text}\n"""` },
      { role: "assistant", content: "{" },
    ],
  });

  const tail = msg.content[0].type === "text" ? msg.content[0].text : "}";
  return NextResponse.json(JSON.parse("{" + tail));
}
