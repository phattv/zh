import { WORDS, type Word } from "@/database";

/** A recognized dictionary word with its full {@link Word} record. */
export type WordSegment = { type: "word"; text: string; word: Word };

/** A single character (or punctuation) that did not match any dictionary entry. */
export type CharSegment = { type: "char"; text: string };

/** Union of all segment kinds produced by {@link segmentText}. */
export type Segment = WordSegment | CharSegment;

const WORD_INDEX = new Map<string, Word>();
let MAX_WORD_LEN = 1;
for (const word of WORDS) {
  WORD_INDEX.set(word.chinese, word);
  if (word.chinese.length > MAX_WORD_LEN) MAX_WORD_LEN = word.chinese.length;
}

/**
 * Segments a Chinese string into dictionary words and unmatched characters using a
 * greedy longest-match algorithm.
 *
 * At each position the longest matching entry in the word index is consumed first,
 * so overlapping matches favour longer words (e.g. 学习 beats 学 + 习).
 * Unmatched characters — punctuation, unknown hanzi, whitespace — are emitted as
 * {@link CharSegment} tokens one codepoint at a time.
 */
export function segmentText(text: string): Segment[] {
  const segments: Segment[] = [];
  let i = 0;
  while (i < text.length) {
    let matched = false;
    for (let len = Math.min(MAX_WORD_LEN, text.length - i); len >= 1; len--) {
      const candidate = text.slice(i, i + len);
      const word = WORD_INDEX.get(candidate);
      if (word) {
        segments.push({ type: "word", text: candidate, word });
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      segments.push({ type: "char", text: text[i] });
      i++;
    }
  }
  return segments;
}

/**
 * Splits Chinese text into individual sentences by breaking after each
 * sentence-ending punctuation mark: `。！？；…`
 *
 * The delimiter is kept attached to its sentence. Empty strings are dropped.
 *
 * @example
 * splitSentences("学而不思则罔，思而不学则殆。")
 * // → ["学而不思则罔，思而不学则殆。"]
 *
 * splitSentences("知人者智，自知者明。胜人者有力，自胜者强。")
 * // → ["知人者智，自知者明。", "胜人者有力，自胜者强。"]
 */
export function splitSentences(text: string): string[] {
  const result: string[] = [];
  let current = "";
  for (const char of text) {
    current += char;
    if ("。！？；…".includes(char)) {
      if (current.trim()) result.push(current.trim());
      current = "";
    }
  }
  if (current.trim()) result.push(current.trim());
  return result;
}
