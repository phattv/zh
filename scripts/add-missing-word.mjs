/**
 * Add a single missing word to the database.
 *
 * Usage:  node scripts/add-missing-word.mjs "想念"
 *
 * - Enriches via Claude Haiku (pinyin, en, vi, sino_vi, types, hsk)
 * - Appends to scripts/data/hsk-enriched.json
 * - Records to scripts/data/added-words.json with date added
 * - Regenerates src/data/words.ts
 */

import Anthropic from "@anthropic-ai/sdk";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");
const ENRICHED_PATH = path.join(dataDir, "hsk-enriched.json");
const ADDED_PATH = path.join(dataDir, "added-words.json");

const VALID_TYPES = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "pronoun",
  "question_pronoun",
  "numeral",
  "measure_word",
  "preposition",
  "conjunction",
  "particle",
  "interjection",
  "auxiliary_verb",
  "modal_verb",
  "time_word",
  "location_word",
  "expression",
  "proper_noun",
];

const word = process.argv[2]?.trim();
if (!word) {
  console.error('Usage: node scripts/add-missing-word.mjs "想念"');
  process.exit(1);
}

const client = new Anthropic();

async function enrich(chinese) {
  const prompt = `You are a Chinese-Vietnamese linguistics expert. For the Chinese word "${chinese}", provide all of the following fields:

1. pinyin: standard pinyin with tone marks
2. en: concise English definition (use semicolons for multiple meanings)
3. vi: natural Vietnamese translation
4. sino_vi: Sino-Vietnamese (Hán Việt) reading — the Vietnamese pronunciation derived from Classical Chinese. Return null if the word has no Sino-Vietnamese form.
5. types: array of grammatical types from this exact list only: ${VALID_TYPES.join(", ")}
6. hsk: HSK 2.0 level (1–6). If the word is not in the official HSK 2.0 list, assign 6.

Respond with a single JSON object only, no explanation:
{"pinyin":"...","en":"...","vi":"...","sino_vi":"..." or null,"types":["..."],"hsk":N}`;

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content[0].text.trim();
  const json = text
    .replace(/^```json?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  return JSON.parse(json);
}

async function main() {
  const enriched = fs.existsSync(ENRICHED_PATH)
    ? JSON.parse(fs.readFileSync(ENRICHED_PATH, "utf-8"))
    : {};

  if (enriched[word]) {
    console.log(`"${word}" already exists in the database.`);
    process.exit(0);
  }

  console.log(`Enriching "${word}" via Claude Haiku...`);
  const result = await enrich(word);

  const types = (result.types ?? []).filter((t) => VALID_TYPES.includes(t));
  const entry = {
    chinese: word,
    pinyin: result.pinyin ?? "",
    en: result.en ?? "",
    hsk: result.hsk ?? 7,
    vi: result.vi ?? "",
    sino_vi: result.sino_vi ?? null,
    types: types.length ? types : ["noun"],
  };

  console.log("Result:", JSON.stringify(entry, null, 2));

  // Save to hsk-enriched.json
  enriched[word] = entry;
  fs.writeFileSync(ENRICHED_PATH, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`✓ Added to hsk-enriched.json`);

  // Save to added-words.json with date
  const added = fs.existsSync(ADDED_PATH)
    ? JSON.parse(fs.readFileSync(ADDED_PATH, "utf-8"))
    : [];
  added.push({ ...entry, addedAt: new Date().toISOString() });
  fs.writeFileSync(ADDED_PATH, JSON.stringify(added, null, 2), "utf-8");
  console.log(`✓ Recorded in added-words.json`);

  // Regenerate words.ts
  console.log("Regenerating src/data/words.ts...");
  execSync("node scripts/generate-words-ts.mjs", { stdio: "inherit" });
  console.log(`\nDone. "${word}" is now in the database.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
