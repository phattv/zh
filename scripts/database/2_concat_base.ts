/**
 * Step 2 — Parse raw HSK files into structured JSON.
 *
 * Input:  database/data/1_hsk{1..6}.txt
 *         Format: simplified\ttraditional\tnumbered_pinyin\ttoned_pinyin\tenglish
 *
 * Output: database/data/2_base.json
 *         Array of { chinese, pinyin, en, hsk }
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { BaseWord } from "../constants.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");

const words: BaseWord[] = [];
const seen = new Set<string>();

for (let level = 1; level <= 6; level++) {
  const file = path.join(dataDir, `1_hsk${level}.txt`);
  const lines = fs.readFileSync(file, "utf-8").replace(/^﻿/, "").split("\n");

  let added = 0;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("//")) continue;

    const parts = line.split("\t");
    if (parts.length < 5) continue;

    const chinese = parts[0].trim();
    const pinyin = parts[3].trim(); // toned pinyin
    const en = parts[4].trim();

    if (!chinese || !pinyin || !en) continue;
    if (seen.has(chinese)) continue; // skip dupes across levels

    seen.add(chinese);
    words.push({ chinese, pinyin, en, hsk: level });
    added++;
  }

  console.log(`HSK ${level}: ${added} words`);
}

const outPath = path.join(dataDir, "2_base.json");
fs.writeFileSync(outPath, JSON.stringify(words, null, 2), "utf-8");
console.log(`\nTotal: ${words.length} words → ${outPath}`);
console.log("Next: npx tsx scripts/database/3_enrich_word.ts");
