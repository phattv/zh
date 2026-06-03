import { WORDS, type Word } from "@/data/words";

// +--------------------+
// | PINYIN NORMALIZER  |
// +--------------------+
// Strips tone diacritics so "qian" matches "qián", "hao" matches "hǎo", etc.

function normalizePinyin(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// +------+
// | REPO |
// +------+
// Data access layer — replace WORDS with a real Supabase client call when ready.
//
// Supabase equivalent:
//   const { data } = await supabase
//     .from('words')
//     .select('*')
//     .or(`pinyin.ilike.%${query}%,characters.ilike.%${query}%`)
//   return data ?? []

async function searchWords(query: string): Promise<Word[]> {
  const q = normalizePinyin(query);
  if (!q) return [];

  return WORDS.filter((word) => {
    const pinyin = normalizePinyin(word.pinyin ?? "");
    return pinyin.includes(q) || word.characters.includes(query.trim());
  });
}

async function getAllWords(): Promise<Word[]> {
  return WORDS;
}

export { searchWords, getAllWords };
