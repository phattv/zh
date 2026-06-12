import { WORDS, type Word } from "@/database";

/**
 * Strips diacritics for accent-insensitive search across pinyin, Vietnamese, and Sino-Vietnamese.
 * ơ/ư/đ don't decompose via NFD so are replaced explicitly before stripping combining marks.
 */
function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .replace(/[đĐ]/g, "d")
    .replace(/[ơƠ]/g, "o")
    .replace(/[ưƯ]/g, "u")
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .trim();
}

/**
 * Data access layer — replace WORDS with a real Supabase client call when ready.
 *
 * Supabase equivalent (with unaccent extension):
 * ```sql
 * const { data } = await supabase.rpc('search_words', { query })
 * return data ?? []
 * ```
 *
 * Matches against Chinese characters (exact), pinyin, English, Vietnamese, and Sino-Vietnamese,
 * all accent-insensitive via {@link normalizeText}.
 */
async function searchWords(query: string): Promise<Word[]> {
  const q = normalizeText(query);
  if (!q) return [];

  return WORDS.filter((word) => {
    if (word.chinese.includes(query.trim())) return true;
    if (normalizeText(word.pinyin).includes(q)) return true;
    if (normalizeText(word.en).includes(q)) return true;
    if (normalizeText(word.vi).includes(q)) return true;
    if (normalizeText(word.sino_vi ?? "").includes(q)) return true;
    return false;
  });
}

/** Returns the full word list. Placeholder for a future `SELECT * FROM words` query. */
async function getAllWords(): Promise<Word[]> {
  return WORDS;
}

export { getAllWords, searchWords };
