/**
 * Phase 4 — Generate learn-enrichment data (explanation_zh, examples, synonyms, antonyms)
 * for every word in hsk-enriched.json via Claude Haiku.
 *
 * Input:  scripts/data/hsk-enriched.json
 * Output: scripts/data/hsk-learn-enrichment.json  (resume-safe, appends as it goes)
 *
 * Run: node scripts/enrich-learn.mjs
 * Then: node scripts/generate-enrichments-ts.mjs
 *
 * Strategy:
 *   - 5 words per API call to keep prompts tight and responses reliable
 *   - Saves after every batch so you can Ctrl-C and resume safely
 *   - ~$3-6 total with Haiku for all ~5000 words
 */

import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");

const IN_PATH = path.join(dataDir, "hsk-enriched.json");
const OUT_PATH = path.join(dataDir, "hsk-learn-enrichment.json");

const client = new Anthropic();
const BATCH_SIZE = 5;
const DELAY_MS = 300;

function loadProgress() {
  if (!fs.existsSync(OUT_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(OUT_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function saveProgress(data) {
  fs.writeFileSync(OUT_PATH, JSON.stringify(data, null, 2), "utf-8");
}

async function enrichBatch(words) {
  const wordList = words
    .map((w, i) => `${i + 1}. ${w.chinese} (${w.pinyin}): "${w.en}" — HSK ${w.hsk}`)
    .join("\n");

  const prompt = `You are a Chinese language teacher. For each word below, return enrichment data.

Words:
${wordList}

Return a JSON array of exactly ${words.length} objects in order:
[
  {
    "explanation_zh": "1-2 sentences explaining the word IN CHINESE, level-appropriate (simple for HSK 1-3, richer for HSK 4-6)",
    "examples": [
      { "zh": "...", "pinyin": "...", "en": "..." },
      { "zh": "...", "pinyin": "...", "en": "..." },
      { "zh": "...", "pinyin": "...", "en": "..." }
    ],
    "synonyms": [{ "chinese": "...", "pinyin": "...", "en": "..." }],
    "antonyms": [{ "chinese": "...", "pinyin": "...", "en": "..." }]
  }
]

Rules:
- explanation_zh: in Chinese only, no English
- examples: exactly 3 natural sentences per word
- synonyms: up to 4, return [] if none
- antonyms: up to 4, return [] if none
- No markdown, only valid JSON array`;

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    temperature: 0,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content[0].text.trim();
  const json = text.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(json);
}

async function main() {
  if (!fs.existsSync(IN_PATH)) {
    console.error(`Missing ${IN_PATH} — run enrich-words.mjs first`);
    process.exit(1);
  }

  const enriched = JSON.parse(fs.readFileSync(IN_PATH, "utf-8"));
  const allWords = Object.values(enriched).sort((a, b) => a.hsk - b.hsk);
  const progress = loadProgress();

  const todo = allWords.filter((w) => !progress[w.chinese]);
  const done = allWords.length - todo.length;

  console.log(`Total: ${allWords.length} | Done: ${done} | Remaining: ${todo.length}`);
  if (todo.length === 0) {
    console.log("All words already enriched.");
    return;
  }

  const batches = Math.ceil(todo.length / BATCH_SIZE);
  let processed = 0;

  for (let i = 0; i < todo.length; i += BATCH_SIZE) {
    const batch = todo.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    process.stdout.write(
      `Batch ${batchNum}/${batches} (${batch.map((w) => w.chinese).join(" ")}) `,
    );

    try {
      const results = await enrichBatch(batch);

      for (let j = 0; j < batch.length; j++) {
        const word = batch[j];
        const r = results[j];
        if (!r) continue;
        progress[word.chinese] = {
          explanation_zh: r.explanation_zh ?? "",
          examples: r.examples ?? [],
          synonyms: r.synonyms ?? [],
          antonyms: r.antonyms ?? [],
        };
      }

      saveProgress(progress);
      processed += batch.length;
      console.log(`✓ (${done + processed}/${allWords.length})`);
    } catch (err) {
      console.error(`✗ ${err.message}`);
      console.error("Retrying in 5s…");
      await new Promise((r) => setTimeout(r, 5000));
      i -= BATCH_SIZE;
      continue;
    }

    if (i + BATCH_SIZE < todo.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  console.log(`\nDone. ${Object.keys(progress).length} entries saved to ${OUT_PATH}`);
  console.log("Next: node scripts/generate-enrichments-ts.mjs");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
