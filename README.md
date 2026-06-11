# 汉语 · Hànyǔ

A personal Chinese learning tool built mobile-first, with a focus on the Sino-Vietnamese connection.

## Stack

- **Next.js 16** (App Router) + **React 19**
- **Mantine 9** UI + custom GM\* design system
- **Bun** package manager
- Data: static `words.ts` → Supabase + AI-generated (planned)

## Running locally

```bash
make run      # bun dev on :2025
make build    # production build
make install  # install deps
```

---

## Modes

The app is structured around six modes, accessible from a bottom nav (mobile) or top nav (desktop). **Search** is the default.

---

### Search

The dictionary. Look up any word across all supported fields.

**Word cards** show:

- Chinese characters (tap → stroke order animation via [Hanzi Writer](https://hanziwriter.org/), auto-resets after 1s)
- Pinyin (tap → pronunciation via Web Speech API, zh-CN)
- Word types & English meaning
- Sino-Vietnamese & Vietnamese meaning

**Search input** supports:

- Text: Chinese characters, pinyin, English, Sino-Vietnamese & Vietnamese meaning
- Handwriting canvas: draw a character → recognition via stroke-direction index built from [hanzi-writer-data](https://github.com/chanind/hanzi-writer-data), appends to current query
- Voice: use OS keyboard dictation (iOS mic key, macOS Dictation, Android voice input) — no in-app mic needed

---

### Learn 🔲

Browse and study words. Mostly deterministic with some AI-generated enrichment cached per word.

**Browse** words by:

- HSK level (1–6)
- Topic / thematic group (food, travel, time, etc.)

**Word detail** — tap any card to expand:

- Meaning explained in Chinese
- Example sentences (AI-generated, cached)
- Synonyms and antonyms
- Words that contain the current word (compounds)
- Radical breakdown and component/compound tree

---

### Listen 🔲

Train listening comprehension. AI-driven.

- AI generates a short conversational paragraph or dialogue (difficulty tied to chosen HSK level)
- Audio is played via TTS (zh-CN)
- User answers multiple-choice comprehension questions
- Answer feedback shows the relevant sentence and vocabulary breakdown

---

### Speak 🔲

Train pronunciation and tones. AI-driven with deterministic scoring.

- AI generates a short paragraph at the chosen level
- Text is displayed with pinyin shown on demand
- User reads aloud; the app records and scores pronunciation using the Web Speech API or a phoneme-level scoring API
- Each character/word is highlighted as correct, close, or wrong
- Retry individual sentences or the full passage

---

### Read 🔲

Annotated reading with full translation layer. Mix of deterministic rendering and AI generation.

- Input: paste any Chinese text, or ask AI to generate a passage at a chosen level and topic
- Output:
  - Paragraph rendered with Chinese + inline pinyin
  - Tap any word → inline English + Vietnamese gloss
  - Full paragraph translation toggle (English / Vietnamese)
  - Key vocabulary table at the bottom: Chinese · Pinyin · EN · VI · Sino-VI · HSK level

---

### Write 🔲

Chinese writing assistant. AI-driven.

- User types freely in Chinese (or pastes a draft)
- AI returns:
  - Grammar corrections with explanations
  - Paraphrased alternatives (more natural / more formal)
  - Vocabulary upgrade suggestions (e.g. swap a basic word for a richer synonym)
  - Tone/register feedback (casual vs. written Chinese)
- Diff view shows original vs. suggested side-by-side

---

## Data

`src/data/words.ts` is words database across HSK 1–6, auto-generated from open data + Claude enrichment. **Do not edit it by hand.**

Each word:

```ts
{
  chinese: "学习",
  pinyin:  "xuéxí",
  en:      "to study; to learn",
  vi:      "học tập; học hỏi",   // Claude-generated
  sino_vi: "HỌC TẬP",            // Claude-generated, null if none
  types:   [Type.V],             // Claude-generated
  hsk:     2,
}
```

### Pipeline

Four scripts in `scripts/` build the word list from scratch:

| Step | Script                  | Input               | Output                           | Notes               |
| ---- | ----------------------- | ------------------- | -------------------------------- | ------------------- |
| 0    | `download-hsk.mjs`      | glxxyz/hskhsk.com   | `scripts/data/hsk{1..6}.txt`     | Requires internet   |
| 1    | `parse-hsk.mjs`         | `hsk{1..6}.txt`     | `scripts/data/hsk-base.json`     | Deterministic       |
| 2    | `enrich-words.mjs`      | `hsk-base.json`     | `scripts/data/hsk-enriched.json` | Claude Haiku, ~$1–4 |
| 3    | `generate-words-ts.mjs` | `hsk-enriched.json` | `src/data/words.ts`              | Deterministic       |

### Make commands

```bash
make data-download                          # Step 0 — fetch source txt files from GitHub
make data-parse                             # Step 1 — parse txt → hsk-base.json
make data-enrich ANTHROPIC_API_KEY=sk-...   # Step 2 — enrich → hsk-enriched.json
make data-generate                          # Step 3 — generate src/data/words.ts

make data-pipeline ANTHROPIC_API_KEY=sk-... # Run all 4 steps in sequence

make data-clean                             # Delete JSON intermediates (keeps source txt)
make data-clean-all                         # Delete everything including source txt
```

### Adding a missing word

When a word is reported missing from the search page (via Slack), add it with:

```bash
make missing word=撸串
```

This enriches the word via Claude Haiku, appends it to `hsk-enriched.json`, regenerates `words.ts`, and records it with a timestamp in `scripts/data/added-words.json`.

### Refreshing / updating

- **Re-enrich specific words**: delete their entries from `hsk-enriched.json`, then re-run `make data-enrich`. It skips already-enriched words.
- **Add new words**: append to `hsk-base.json` manually, then run `make data-enrich` + `make data-generate`.
- **Fix a bad translation**: edit the entry directly in `hsk-enriched.json`, then run `make data-generate`.
- **Full regeneration**: `make data-clean-all` then `make data-pipeline`. Expect ~$1–4 in Claude API costs in around 10-20 minutes.

---

## PWA

Planned as an installable PWA with offline word lookup from the local word cache.
