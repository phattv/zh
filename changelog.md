# Changelog

## 2026-06-06

- Upgrade dependencies to React 19, Next.js 16, Mantine 9, TypeScript 6; add Makefile and Turbopack config
- Revise words database with `chinese, pinyin, en, vi, sino_vi, types` fields, seed 60 real HSK 1–6 words
- Upgrade search to work with `chinese, pinyin, en, vi, sino_vi` fields via text input
- Implement handwriting recognition panel (`DrawingInput`) — draw on canvas, get top-8 character candidates, click to search
- Extract `Header` and `WordCard` into `src/app/_components/`; 2-column card grid with equal-height rows
- Font-size toggle cycles S→M→L→S in a single icon button; search left icon toggles between 🔍 and ✕
- Implement click on chinese word to animate & pinyin to pronounce
- Preprocess `hanzi-writer-data` medians into a 9574-character stroke-direction index with `build-hanzi` command
- Use `hanzi-writer` to animate chinese characters

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
