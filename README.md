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

## Features

### Word definition & search

Each word card shows:

- Chinese characters & pinyin
- Word types & English meaning
- Sino-Vietnamese & Vietnamese meaning

Search by:

- Text: Chinese characters & pinyin, English meaning, Sino-Vietnamese & Vietnamese meaning
- Drawing canvas with data from [hanzi-writer-data](https://github.com/chanind/hanzi-writer-data)

### Voice search _(v1)_

Speak a word in Mandarin (or pinyin) to search. Uses the Web Speech API with `zh-CN` locale — no external API, works in-browser.

---

## Roadmap

### Learn mode

Expand any word card to see:

- Meaning explained in Chinese
- Example sentences
- Synonyms and antonyms
- Words that contain the current word (compounds)
- Stroke order animation ([Hanzi Writer](https://hanziwriter.org/))
- Radical breakdown and component/compound tree

### Writing & speaking

Paste any Chinese text → the app:

1. Chunks it into speakable paragraphs showing Chinese + pinyin inline
2. Extracts key vocabulary as word cards for deeper study

---

## Data

Words are currently seeded in `src/data/words.ts` (60 words, HSK 1–6). The data layer (`src/lib/words-repo.ts`) is designed to swap the static array for Supabase queries. Richer content (examples, synonyms, stroke data) will be AI-generated via Claude and cached in Supabase.

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
