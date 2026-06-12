# zh.phattv.dev

A personal Chinese learning tool built mobile-first, with a focus on the Sino-Vietnamese connection.

## Stack

- **Next.js 16** (App Router) + **React 19**
- **Mantine 9** UI + custom GM\* design system
- **Bun** package manager
- Data: static `database.ts` — auto-generated from open data + Claude enrichment

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

Browse and study words. All enrichment is pre-generated and instant — no async calls.

**Browse** words by:

- HSK level (1–6)
- Topic / thematic group (food, travel, time, etc.)

**Word detail** — tap any card to expand:

- Meaning explained in Chinese (dictionary-style)
- Example sentences (3 per word)
- Synonyms and antonyms (tap to navigate)
- Words that contain the current word (compounds)

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

`src/database.ts` is the word database across HSK 1–6, auto-generated from open data + Claude enrichment. **Do not edit it by hand.**

Each word:

```ts
{
  chinese:  "学习",
  pinyin:   "xuéxí",
  en:       "to study; to learn",
  vi:       "học tập; học hỏi",
  sino_vi:  "HỌC TẬP",              // null if no Sino-Vietnamese form
  types:    [Type.V],
  hsk:      2,
  zh:       "学习是指通过阅读、练习等方式获取知识或技能。",
  examples: [
    { zh: "我每天学习汉语。", pinyin: "Wǒ měitiān xuéxí Hànyǔ.", en: "I study Chinese every day." },
    // ...
  ],
  synonyms: ["学", "研究"],          // Chinese only — pinyin/en looked up from WORDS at runtime
  antonyms: [],
}
```

### Scripts

All offline pipeline scripts live in `scripts/` and are written in TypeScript, run with `tsx`.

```
scripts/
  constants.ts              ← shared: MODEL, VALID_TYPES, BaseWord, UnifiedWord types
  database/
    1_download_raw.ts       ← fetch source txt from GitHub
    2_concat_base.ts        ← parse txt → 2_base.json
    3_enrich_word.ts        ← Claude Haiku → 3_enriched.json  (resume-safe)
    4_generate_database.ts  ← emit src/database.ts
    data/
      1_hsk{1..6}.txt
      2_base.json
      3_enriched.json
  drawing/
    1_index_strokes.ts      ← build public/hanzi-index/index.json
  missing_word/
    1_add_missing_word.ts   ← enrich + append a single word
    data/
      1_added.json
```

### Pipeline

| Step | Script                         | Input             | Output                          | Notes               |
| ---- | ------------------------------ | ----------------- | ------------------------------- | ------------------- |
| 1    | `database/1_download_raw`      | glxxyz/hskhsk.com | `database/data/1_hsk{1..6}.txt` | Requires internet   |
| 2    | `database/2_concat_base`       | `1_hsk{1..6}.txt` | `database/data/2_base.json`     | Deterministic       |
| 3    | `database/3_enrich_word`       | `2_base.json`     | `database/data/3_enriched.json` | Claude Haiku, ~$3–6 |
| 4    | `database/4_generate_database` | `3_enriched.json` | `src/database.ts`             | Deterministic       |

### Make commands

```bash
make db-download    # Step 1 — fetch source txt files from GitHub
make db-parse       # Step 2 — parse txt → 2_base.json
make db-enrich      # Step 3 — enrich → 3_enriched.json  (reads ANTHROPIC_API_KEY from .env.local)
make db-generate    # Step 4 — generate src/database.ts

make db-pipeline    # Run all 4 steps in sequence

make db-clean       # Delete JSON intermediates (keeps source txt)
make db-clean-all   # Delete everything including source txt
```

### Adding a missing word

When a word is reported missing from the search page, add it with:

```bash
make missing word=撸串
```

This enriches the word via Claude Haiku (all fields), appends it to `3_enriched.json`, regenerates `database.ts`, and records it with a timestamp in `missing_word/data/1_added.json`.

### Refreshing / updating

- **Re-enrich specific words**: delete their entries from `3_enriched.json`, then re-run `make db-enrich`. It skips already-enriched words.
- **Add new words**: append to `2_base.json` manually, then run `make db-enrich` + `make db-generate`.
- **Fix a bad entry**: edit directly in `3_enriched.json`, then run `make db-generate`.
- **Full regeneration**: `make db-clean-all` then `make db-pipeline`. Expect ~$3–6 in Claude API costs over ~20 minutes.

---

## PWA

Planned as an installable PWA with offline word lookup from the local word cache.
