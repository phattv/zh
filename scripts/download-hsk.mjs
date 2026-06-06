/**
 * Step 0 — Download raw HSK 1–6 word lists from glxxyz/hskhsk.com.
 *
 * Output: scripts/data/hsk{1..6}.txt
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");

const BASE =
  "https://raw.githubusercontent.com/glxxyz/hskhsk.com/main/data/lists";

const FILES = [1, 2, 3, 4, 5, 6].map((level) => ({
  level,
  url: `${BASE}/HSK%20Official%20With%20Definitions%202012%20L${level}.txt`,
  dest: path.join(dataDir, `hsk${level}.txt`),
}));

fs.mkdirSync(dataDir, { recursive: true });

for (const { level, url, dest } of FILES) {
  process.stdout.write(`Downloading HSK ${level}... `);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  fs.writeFileSync(dest, await res.text(), "utf-8");
  const lines = fs.readFileSync(dest, "utf-8").split("\n").length;
  console.log(`✓ (${lines} lines → ${path.basename(dest)})`);
}

console.log(`\nAll files saved to ${dataDir}`);
