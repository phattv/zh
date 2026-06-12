/**
 * Prebuild script — run via `npx tsx scripts/drawing/1_index_strokes.ts` or
 * automatically before `next build` via the `build:hanzi` npm script.
 *
 * INPUT
 *   node_modules/hanzi-writer-data/<char>.json — one file per Chinese character.
 *   Each file has the shape:
 *     {
 *       strokes:  string[]      // SVG path strings (not used here)
 *       medians:  number[][][]  // per-stroke arrays of [x, y] waypoints in a
 *                               // 1024×1024 coordinate space where Y=0 is at
 *                               // the BOTTOM (standard math axes, not canvas)
 *       radStrokes: number[]    // indices of radical strokes (not used here)
 *     }
 *
 * OUTPUT
 *   public/hanzi-index/index.json — a JSON array consumed by DrawingInput.tsx
 *   at runtime for stroke-based character recognition.
 *
 *   Each element is a flat array:
 *     [char: string, strokeCount: number, dir0: number, dir1: number, ...]
 *
 *   Direction codes use screen coordinates (Y-axis down, 0=E going clockwise):
 *     0=E  1=SE  2=S  3=SW  4=W  5=NW  6=N  7=NE
 *   A value of -1 means the stroke is a dot (start ≈ end, no dominant direction).
 */

import { existsSync } from "fs";
import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const DATA_DIR = join(ROOT, "node_modules/hanzi-writer-data");
const OUTPUT_DIR = join(ROOT, "public/hanzi-index");
const OUTPUT = join(OUTPUT_DIR, "index.json");

type HanziData = {
  medians: number[][][];
};

/**
 * Converts a single stroke median into an 8-direction code.
 * Returns -1 for dot/noise strokes (start ≈ end).
 * Pass invertY=true when source uses math axes (Y=0 at bottom).
 */
function strokeDirection(median: number[][], invertY = false): number {
  if (!median || median.length < 2) return -1;
  const first = median[0];
  const last = median[median.length - 1];
  const dx = last[0] - first[0];
  const rawDy = last[1] - first[1];
  const dy = invertY ? -rawDy : rawDy; // hanzi-writer Y=0 is at bottom

  if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return -1;

  const angle = Math.atan2(dy, dx);
  const deg = ((angle * 180) / Math.PI + 360) % 360;
  return Math.round(deg / 45) % 8;
}

const files = await readdir(DATA_DIR);
const charFiles = files.filter(
  (f) => f.endsWith(".json") && f !== "package.json",
);

if (!existsSync(OUTPUT_DIR)) await mkdir(OUTPUT_DIR, { recursive: true });

const index: (string | number)[][] = [];
let skipped = 0;

for (const file of charFiles) {
  try {
    const char = file.replace(/\.json$/, "");
    const raw = await readFile(join(DATA_DIR, file), "utf-8");
    const data = JSON.parse(raw) as HanziData;
    const { medians } = data;
    if (!medians || medians.length === 0) {
      skipped++;
      continue;
    }
    const dirs = medians.map((m) => strokeDirection(m, true));
    if (dirs.every((d) => d === -1)) {
      skipped++;
      continue;
    }
    // Format: [char, strokeCount, dir0, dir1, ...]
    index.push([char, medians.length, ...dirs]);
  } catch {
    skipped++;
  }
}

await writeFile(OUTPUT, JSON.stringify(index));
console.log(
  `Built hanzi index: ${index.length} characters (${skipped} skipped) → ${OUTPUT}`,
);
