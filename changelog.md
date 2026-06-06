# Changelog

## 2026-06-06

- Config: Upgrade dependencies to React 19, Next.js 16, Mantine 9, TypeScript 6; add Makefile and Turbopack config
- UI:
  - Upgrade text input search to work with `chinese, pinyin, en, vi, sino_vi` fields
  - Font-size toggle cycles S→M→L→S in a single icon button; search left icon toggles between 🔍 and ✕
  - Tap on chinese words to animate & tap on pinyin to pronounce
- Components: `src/app/_components/`
  - `WordCard` 2-column card grid with equal-height rows
  - `DrawingInput`: handwriting canvas → top-8 character candidates
  - `HanziAnimation`: stroke-order animation via `hanzi-writer`
- Data: `scripts` & `src/data`
  - Schema: revised with `chinese, pinyin, en, vi, sino_vi, types` fields & `Type` enum
  - Strokes: preprocess `hanzi-writer-data` medians into a 9574-character stroke-direction index with `build-hanzi` command
  - Pipeline: 1. download, 2. parse, 3. enrichment, 4. generate, with `make data-*` commands, expand to 4995 HSK 1-6 words

---

## 2026-06-03

- Bootstrap `zh` — standalone Next.js + Mantine app for searching and learning Chinese words
- GM\* design system (`GMText`, `GMButton`, `GMContainer`, `GMIcon`) ported from gocrm, decoupled from all `@gomedia` packages
- Dark/light theme with `localStorageColorSchemeManager`
- Display size preference (S/M/L) with FOUC-free inline script
- Noto Serif SC font for Chinese character rendering
- 25-word mock database (HSK 1–4) with pinyin, EN/VI meanings, and Sino-Vietnamese equivalents
- Pinyin search with tone normalization (`qian` matches `qián`)
- Data access layer in `src/lib/words-repo.ts` — ready to swap for Supabase
