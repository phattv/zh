import { WORDS, type Word } from "@/data/words";

// +-------------------+
// | TEXT NORMALIZER   |
// +-------------------+
// Strips diacritics for accent-insensitive search across pinyin, Vietnamese, and Sino-Vietnamese.
// ơ/ư/đ don't decompose via NFD so are replaced explicitly before stripping combining marks.

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

// +------+
// | REPO |
// +------+
// Data access layer — replace WORDS with a real Supabase client call when ready.
//
// Supabase equivalent (with unaccent extension):
//   const { data } = await supabase.rpc('search_words', { query })
//   return data ?? []

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

async function getAllWords(): Promise<Word[]> {
  return WORDS;
}

export { getAllWords, searchWords };
