/**
 * Add a single missing word to the database.
 *
 * Usage:  npx tsx scripts/missing_word/1_add_missing_word.ts "想念"
 *
 * - Enriches via Claude Haiku (all fields: vi, sino_vi, types, hsk, zh, examples, synonyms, antonyms)
 * - Appends to database/data/3_enriched.json
 * - Records to missing_word/data/1_added.json with date added
 * - Regenerates src/database.ts
 */

import Anthropic from "@anthropic-ai/sdk";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  MODEL,
  VALID_TYPES,
  type UnifiedWord,
} from "../constants.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..");

const ENRICHED_PATH = path.join(
  __dirname,
  "..",
  "database",
  "data",
  "3_enriched.json",
);
const ADDED_PATH = path.join(__dirname, "data", "1_added.json");

const word = process.argv[2]?.trim();
if (!word) {
  console.error(
    'Usage: npx tsx scripts/missing_word/1_add_missing_word.ts "想念"',
  );
  process.exit(1);
}

const client = new Anthropic();

async function enrich(chinese: string): Promise<Partial<UnifiedWord> & { hsk?: number }> {
  const prompt = `You are a Chinese-Vietnamese linguistics expert and language teacher.

For the Chinese word "${chinese}", provide all enrichment fields.

Respond with a single JSON object only, no explanation:
{
  "pinyin": "standard pinyin with tone marks",
  "en": "concise English definition (semicolons for multiple meanings)",
  "vi": "natural Vietnamese translation",
  "sino_vi": "Sino-Vietnamese (Hán Việt) reading, or null if none",
  "types": ["grammatical types — use only: ${VALID_TYPES.join(", ")}"],
  "hsk": 1,
  "zh": "1-2 sentences explaining the word IN CHINESE only, dictionary-style",
  "examples": [
    { "zh": "sentence", "pinyin": "pinyin with tones", "en": "English" },
    { "zh": "...", "pinyin": "...", "en": "..." },
    { "zh": "...", "pinyin": "...", "en": "..." }
  ],
  "synonyms": ["chinese1", "chinese2"],
  "antonyms": ["chinese1"]
}

Rules: hsk is 1–6 (assign 6 if not in official list); zh in Chinese only; examples exactly 3; synonyms/antonyms up to 4 Chinese strings each, [] if none.`;

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
  const json = text
    .replace(/^```json?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  return JSON.parse(json);
}

async function main(): Promise<void> {
  const enriched: Record<string, UnifiedWord> = fs.existsSync(ENRICHED_PATH)
    ? JSON.parse(fs.readFileSync(ENRICHED_PATH, "utf-8"))
    : {};

  if (enriched[word]) {
    console.log(`"${word}" already exists in the database.`);
    process.exit(0);
  }

  console.log(`Enriching "${word}" via Claude Haiku...`);
  const result = await enrich(word);

  const types = (result.types ?? []).filter(
    (t): t is (typeof VALID_TYPES)[number] =>
      (VALID_TYPES as readonly string[]).includes(t),
  );

  const entry: UnifiedWord = {
    chinese: word,
    pinyin: result.pinyin ?? "",
    en: result.en ?? "",
    hsk: Number(result.hsk) || 6,
    vi: result.vi ?? "",
    sino_vi: result.sino_vi ?? null,
    types: types.length ? types : ["noun"],
    zh: result.zh ?? "",
    examples: (result.examples ?? []).slice(0, 3),
    synonyms: (result.synonyms ?? [])
      .filter((s): s is string => typeof s === "string")
      .slice(0, 4),
    antonyms: (result.antonyms ?? [])
      .filter((a): a is string => typeof a === "string")
      .slice(0, 4),
  };

  console.log("Result:", JSON.stringify(entry, null, 2));

  enriched[word] = entry;
  fs.writeFileSync(ENRICHED_PATH, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`✓ Added to database/data/3_enriched.json`);

  const added: (UnifiedWord & { addedAt: string })[] = fs.existsSync(ADDED_PATH)
    ? JSON.parse(fs.readFileSync(ADDED_PATH, "utf-8"))
    : [];
  added.push({ ...entry, addedAt: new Date().toISOString() });
  fs.mkdirSync(path.dirname(ADDED_PATH), { recursive: true });
  fs.writeFileSync(ADDED_PATH, JSON.stringify(added, null, 2), "utf-8");
  console.log(`✓ Recorded in missing_word/data/1_added.json`);

  console.log("Regenerating src/database.ts...");
  execSync("npx tsx scripts/database/4_generate_database.ts", {
    cwd: ROOT,
    stdio: "inherit",
  });
  console.log(`\nDone. "${word}" is now in the database.`);
}

main().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
