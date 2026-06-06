/**
 * Phase 1 — Parse raw HSK files into structured JSON.
 *
 * Input:  scripts/data/hsk{1..6}.txt
 *         Format: simplified\ttraditional\tnumbered_pinyin\ttoned_pinyin\tenglish
 *
 * Output: scripts/data/hsk-base.json
 *         Array of { chinese, pinyin, en, hsk }
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");

const words = [];
const seen = new Set();

for (let level = 1; level <= 6; level++) {
  const file = path.join(dataDir, `hsk${level}.txt`);
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

const outPath = path.join(dataDir, "hsk-base.json");
fs.writeFileSync(outPath, JSON.stringify(words, null, 2), "utf-8");
console.log(`\nTotal: ${words.length} words → ${outPath}`);
