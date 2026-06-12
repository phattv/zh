/**
 * Step 3 — Enrich every word with all fields in one pass.
 *
 * Input:  database/data/2_base.json  (chinese, pinyin, en, hsk)
 * Output: database/data/3_enriched.json  (all fields, resume-safe)
 *
 * Run: npx tsx scripts/database/3_enrich_word.ts
 * Then: npx tsx scripts/database/4_generate_database.ts
 */

import Anthropic from "@anthropic-ai/sdk";
import { jsonrepair } from "jsonrepair";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  BATCH_SIZE,
  DELAY_MS,
  MAX_TOKENS,
  MODEL,
  VALID_TYPES,
  type BaseWord,
  type UnifiedWord,
} from "../constants.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");

const IN_PATH = path.join(dataDir, "2_base.json");
const OUT_PATH = path.join(dataDir, "3_enriched.json");

const client = new Anthropic();

function loadProgress(): Record<string, UnifiedWord> {
  if (!fs.existsSync(OUT_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(OUT_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function saveProgress(data: Record<string, UnifiedWord>): void {
  fs.writeFileSync(OUT_PATH, JSON.stringify(data, null, 2), "utf-8");
}

async function enrichBatch(words: BaseWord[]): Promise<Partial<UnifiedWord>[]> {
  const wordList = words
    .map(
      (w, i) =>
        `${i + 1}. ${w.chinese} (${w.pinyin}): "${w.en}" — HSK ${w.hsk}`,
    )
    .join("\n");

  const prompt = `You are a Chinese-Vietnamese linguistics expert and language teacher.

For each word, return enrichment data.

Words:
${wordList}

Return a JSON array of exactly ${words.length} objects:
[
  {
    "vi": "natural Vietnamese translation",
    "sino_vi": "Sino-Vietnamese (Hán Việt) reading, or null if the word has no classical Chinese origin",
    "types": ["grammatical types — use only: noun verb adjective adverb pronoun question_pronoun numeral measure_word preposition conjunction particle interjection auxiliary_verb modal_verb time_word location_word expression proper_noun"],
    "zh": "1-2 sentences explaining the word IN CHINESE only. Dictionary-style: simple Chinese for HSK 1-3, richer Chinese for HSK 4-6.",
    "examples": [
      { "zh": "sentence", "pinyin": "pinyin with tone marks", "en": "English translation" },
      { "zh": "...", "pinyin": "...", "en": "..." },
      { "zh": "...", "pinyin": "...", "en": "..." }
    ],
    "synonyms": ["chinese1", "chinese2"],
    "antonyms": ["chinese1"]
  }
]

Rules:
- vi: natural Vietnamese; sino_vi: Hán Việt form or null
- types: array of valid types only
- zh: Chinese only, dictionary-style — no English
- examples: exactly 3 natural, level-appropriate sentences
- synonyms: up to 4 Chinese characters only (no pinyin/English), [] if none
- antonyms: up to 4 Chinese characters only, [] if none
- No markdown, only valid JSON array`;

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: 0,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`No JSON array found in response: ${text.slice(0, 500)}`);
  }
  const json = text.slice(start, end + 1);
  try {
    return JSON.parse(jsonrepair(json)) as Partial<UnifiedWord>[];
  } catch (e) {
    throw new Error(`Unrecognized token in JSON: ${(e as Error).message}`);
  }
}

async function main(): Promise<void> {
  const base: BaseWord[] = JSON.parse(fs.readFileSync(IN_PATH, "utf-8"));
  const progress = loadProgress();

  // Only process words missing learn enrichment (zh is the marker)
  const todo = base.filter((w) => {
    const existing = progress[w.chinese];
    return !existing || !existing.zh;
  });
  const done = base.length - todo.length;

  console.log(
    `Total: ${base.length} | Done: ${done} | Remaining: ${todo.length}`,
  );
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

    let retries = 0;
    let succeeded = false;
    while (retries < 3 && !succeeded) {
      try {
        const results = await enrichBatch(batch);

        for (let j = 0; j < batch.length; j++) {
          const word = batch[j];
          const r = results[j];
          if (!r) continue;

          const types = (r.types ?? []).filter(
            (t): t is (typeof VALID_TYPES)[number] =>
              (VALID_TYPES as readonly string[]).includes(t),
          );

          progress[word.chinese] = {
            chinese: word.chinese,
            pinyin: word.pinyin,
            en: word.en,
            hsk: word.hsk,
            vi: r.vi ?? "",
            sino_vi: r.sino_vi ?? null,
            types: types.length ? types : ["noun"],
            zh: r.zh ?? "",
            examples: (r.examples ?? []).slice(0, 3),
            synonyms: (r.synonyms ?? [])
              .filter((s): s is string => typeof s === "string")
              .slice(0, 4),
            antonyms: (r.antonyms ?? [])
              .filter((a): a is string => typeof a === "string")
              .slice(0, 4),
          };
        }

        saveProgress(progress);
        processed += batch.length;
        console.log(`✓ (${done + processed}/${base.length})`);
        succeeded = true;
      } catch (err) {
        retries++;
        const msg = (err as Error).message;
        console.error(`✗ ${msg}`);
        // JSON structural errors won't be fixed by retrying the same batch — go solo immediately
        const isJsonErr = msg.includes("Unrecognized token") || msg.includes("No JSON array");
        if (retries < 3 && !isJsonErr) {
          process.stdout.write(`Retrying (${retries}/3) in 5s… `);
          await new Promise((r) => setTimeout(r, 5000));
        } else if (batch.length > 1) {
          // Fall back to one word at a time
          console.error(`Falling back to single-word mode for: ${batch.map((w) => w.chinese).join(" ")}`);
          for (const word of batch) {
            if (progress[word.chinese]?.zh) continue;
            process.stdout.write(`  Solo (${word.chinese}) `);
            let soloOk = false;
            for (let attempt = 0; attempt < 3 && !soloOk; attempt++) {
              try {
                const [r] = await enrichBatch([word]);
                if (!r) throw new Error("empty result");
                const types = (r.types ?? []).filter(
                  (t): t is (typeof VALID_TYPES)[number] =>
                    (VALID_TYPES as readonly string[]).includes(t),
                );
                progress[word.chinese] = {
                  chinese: word.chinese,
                  pinyin: word.pinyin,
                  en: word.en,
                  hsk: word.hsk,
                  vi: r.vi ?? "",
                  sino_vi: r.sino_vi ?? null,
                  types: types.length ? types : ["noun"],
                  zh: r.zh ?? "",
                  examples: (r.examples ?? []).slice(0, 3),
                  synonyms: (r.synonyms ?? [])
                    .filter((s): s is string => typeof s === "string")
                    .slice(0, 4),
                  antonyms: (r.antonyms ?? [])
                    .filter((a): a is string => typeof a === "string")
                    .slice(0, 4),
                };
                saveProgress(progress);
                processed += 1;
                console.log(`✓ (${done + processed}/${base.length})`);
                soloOk = true;
              } catch (soloErr) {
                console.error(`✗ ${(soloErr as Error).message}`);
                if (attempt < 2) await new Promise((r) => setTimeout(r, 5000));
                else console.error(`  Giving up on: ${word.chinese}`);
              }
            }
            await new Promise((r) => setTimeout(r, DELAY_MS));
          }
          succeeded = true;
        } else {
          console.error(`Giving up on: ${batch[0].chinese}`);
        }
      }
    }

    if (i + BATCH_SIZE < todo.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  console.log(
    `\nDone. ${Object.keys(progress).length} entries saved to ${OUT_PATH}`,
  );
  console.log("Next: npx tsx scripts/database/4_generate_database.ts");
}

main().catch((err: Error) => {
  console.error(err);
  process.exit(1);
});
