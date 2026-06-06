/**
 * Phase 2 — Enrich hsk-base.json with vi, sino_vi, and types via Claude Haiku.
 *
 * Input:  scripts/data/hsk-base.json
 * Output: scripts/data/hsk-enriched.json   (appends as it goes, safe to re-run)
 *
 * Strategy:
 *   - Process in batches of 30 words per API call
 *   - Save progress after each batch (resume-safe)
 *   - ~167 batches total, ~$2-4 with Haiku
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");

const BASE_PATH = path.join(dataDir, "hsk-base.json");
const OUT_PATH = path.join(dataDir, "hsk-enriched.json");

const client = new Anthropic();
const BATCH_SIZE = 30;
const DELAY_MS = 500;

const VALID_TYPES = [
  "noun","verb","adjective","adverb","pronoun","question_pronoun",
  "numeral","measure_word","preposition","conjunction","particle",
  "interjection","auxiliary_verb","modal_verb","time_word",
  "location_word","expression","proper_noun",
];

function loadProgress() {
  if (!fs.existsSync(OUT_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(OUT_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function saveProgress(enriched) {
  fs.writeFileSync(OUT_PATH, JSON.stringify(enriched, null, 2), "utf-8");
}

async function enrichBatch(words) {
  const wordList = words
    .map((w, i) => `${i + 1}. ${w.chinese} (${w.pinyin}): ${w.en}`)
    .join("\n");

  const prompt = `You are a Chinese-Vietnamese linguistics expert. For each word below, provide:
1. vi: natural Vietnamese translation
2. sino_vi: Sino-Vietnamese reading (Hán Việt) — the Vietnamese pronunciation derived from Classical Chinese. If the word has no Sino-Vietnamese form (colloquial Chinese, modern compounds with no Hán Việt equivalent), return null.
3. types: array of grammatical types from this exact list only: ${VALID_TYPES.join(", ")}

Words:
${wordList}

Respond with a JSON array of exactly ${words.length} objects in order, each:
{"vi":"...","sino_vi":"..." or null,"types":["..."]}

No explanation, only valid JSON.`;

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content[0].text.trim();
  // strip markdown code fences if present
  const json = text.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(json);
}

async function main() {
  const base = JSON.parse(fs.readFileSync(BASE_PATH, "utf-8"));
  const enriched = loadProgress();

  const todo = base.filter((w) => !enriched[w.chinese]);
  const done = base.length - todo.length;

  console.log(`Total: ${base.length} | Done: ${done} | Remaining: ${todo.length}`);
  if (todo.length === 0) {
    console.log("All words already enriched.");
    return;
  }

  let processed = 0;
  const batches = Math.ceil(todo.length / BATCH_SIZE);

  for (let i = 0; i < todo.length; i += BATCH_SIZE) {
    const batch = todo.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    process.stdout.write(`Batch ${batchNum}/${batches} (${batch[0].chinese}…) `);

    try {
      const results = await enrichBatch(batch);

      if (results.length !== batch.length) {
        console.warn(`⚠ length mismatch: expected ${batch.length}, got ${results.length}`);
      }

      for (let j = 0; j < batch.length; j++) {
        const word = batch[j];
        const r = results[j];
        if (!r) continue;

        const types = (r.types ?? []).filter((t) => VALID_TYPES.includes(t));

        enriched[word.chinese] = {
          chinese: word.chinese,
          pinyin: word.pinyin,
          en: word.en,
          hsk: word.hsk,
          vi: r.vi ?? "",
          sino_vi: r.sino_vi ?? null,
          types: types.length ? types : ["noun"],
        };
      }

      saveProgress(enriched);
      processed += batch.length;
      console.log(`✓ (${done + processed}/${base.length})`);
    } catch (err) {
      console.error(`✗ error: ${err.message}`);
      console.error("Retrying in 5s...");
      await new Promise((r) => setTimeout(r, 5000));
      i -= BATCH_SIZE; // retry same batch
      continue;
    }

    if (i + BATCH_SIZE < todo.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  console.log(`\nDone. ${Object.keys(enriched).length} words saved to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
