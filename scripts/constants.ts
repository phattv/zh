export const MODEL = "claude-haiku-4-5-20251001" as const;

export const BATCH_SIZE = 3;
export const MAX_TOKENS = 8192;
export const DELAY_MS = 300;

export const VALID_TYPES = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "pronoun",
  "question_pronoun",
  "numeral",
  "measure_word",
  "preposition",
  "conjunction",
  "particle",
  "interjection",
  "auxiliary_verb",
  "modal_verb",
  "time_word",
  "location_word",
  "expression",
  "proper_noun",
] as const;

export type ValidType = (typeof VALID_TYPES)[number];

export type BaseWord = {
  chinese: string;
  pinyin: string;
  en: string;
  hsk: number;
};

export type Example = {
  zh: string;
  pinyin: string;
  en: string;
};

export type UnifiedWord = {
  chinese: string;
  pinyin: string;
  en: string;
  hsk: number;
  vi: string;
  sino_vi: string | null;
  types: ValidType[];
  zh: string;
  examples: Example[];
  synonyms: string[];
  antonyms: string[];
};
