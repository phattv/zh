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

### Search ✅

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

Words are currently seeded in `src/data/words.ts` (100 words, HSK 1–6). The data layer (`src/lib/words-repo.ts`) is designed to swap the static array for Supabase queries. Richer content (examples, synonyms, stroke data) will be AI-generated via Claude and cached in Supabase.

Each word:

```ts
{
  chinese: "学习",
  pinyin:  "xuéxí",
  en:      "to study; to learn",
  vi:      "học tập; học hỏi",
  sino_vi: "HỌC TẬP",
  types:   [Type.V],
  hsk:     2,
}
```

---

## PWA

Planned as an installable PWA with offline word lookup from the local word cache.
