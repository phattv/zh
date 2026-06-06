# Changelog

## 2026-06-06

- Upgrade dependencies to React 19, Next.js 16, Mantine 9, TypeScript 6; add Makefile and Turbopack config
- Introduce `Type` enum; rename `Word` fields (`characters→chinese`, `meaning_en→en`, etc.); seed 60 real HSK 1–6 words
- Expand search to match `en`, `vi`, `sino_vi` with Vietnamese diacritic normalization (`hoc` matches `học`)
- Extract `Header` and `WordCard` into `src/app/_components/`; 2-column card grid with equal-height rows
- Font-size toggle cycles S→M→L→S in a single icon button; search left icon toggles between 🔍 and ✕
- Add speak feature when pressing on pinyin

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
