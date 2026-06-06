"use client";

import { GMContainer } from "@/components/GMContainer";
import { GMIcon } from "@/components/GMIcon";
import { GMText } from "@/components/GMText";
import { WORDS, type Word } from "@/data/words";
import { TextInput } from "@mantine/core";
import { useMemo, useState } from "react";
import { DrawingInput } from "./_components/DrawingInput";
import { HANZI_CHAR_SIZE, HanziAnimation } from "./_components/HanziAnimation";
import { Header } from "./_components/Header";
import { WordCard } from "./_components/WordCard";

const SEARCH_PLACEHOLDER = `e.g. "学, xué, HỌC, học tập, study"`;

function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[đĐ]/g, "d")
    .replace(/[ơƠ]/g, "o")
    .replace(/[ưƯ]/g, "u")
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .trim();
}

function filterWords(query: string): Word[] {
  const q = normalize(query);
  if (!q) return [];
  return WORDS.filter((word) => {
    if (word.chinese.includes(query.trim())) return true;
    if (normalize(word.pinyin).includes(q)) return true;
    if (normalize(word.en).includes(q)) return true;
    if (normalize(word.vi).includes(q)) return true;
    if (normalize(word.sino_vi ?? "").includes(q)) return true;
    return false;
  });
}

function NoResultsState({ query }: { query: string }): React.JSX.Element {
  return (
    <GMContainer align="center" py="xl" gap="sm">
      <GMIcon name="Search" size="xl" color="var(--gm-text-muted)" />
      <GMText variant="subtitle">{`No results for "${query}"`}</GMText>
      <GMText variant="secondary">Search something else</GMText>
      <GMText variant="secondary">{SEARCH_PLACEHOLDER}</GMText>
    </GMContainer>
  );
}

function StartState(): React.JSX.Element {
  const [animated, setAnimated] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  function handleSpeak() {
    if (speaking) return;
    setSpeaking(true);
    const synth = window.speechSynthesis;
    if (!synth) {
      setSpeaking(false);
      return;
    }
    synth.cancel();
    setTimeout(() => {
      const utt = new SpeechSynthesisUtterance("学");
      utt.lang = "zh-CN";
      utt.rate = 0.85;
      utt.onend = () => setSpeaking(false);
      utt.onerror = () => setSpeaking(false);
      synth.speak(utt);
    }, 80);
  }

  return (
    <GMContainer align="center" py="xl" gap="lg">
      <GMContainer align="center">
        <GMIcon name="Book" size="xl" color="var(--mantine-color-brand-6)" bg />
        <GMText variant="title">Start searching...</GMText>
        <GMText variant="subtitle">{SEARCH_PLACEHOLDER}</GMText>
      </GMContainer>

      {/* Interactive demo */}
      <GMContainer>
        <GMContainer variant="row" align="center" gap="sm">
          <div
            onClick={() => setAnimated((a) => !a)}
            style={{
              width: HANZI_CHAR_SIZE,
              height: HANZI_CHAR_SIZE,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {animated ? (
              <HanziAnimation word="学" />
            ) : (
              <span className="zh-characters">学</span>
            )}
          </div>
          <GMText variant="secondary">tap for strokes</GMText>
        </GMContainer>
        <GMContainer variant="row" align="center" gap="sm">
          <div
            style={{
              width: HANZI_CHAR_SIZE,
              height: HANZI_CHAR_SIZE,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <button
              onClick={handleSpeak}
              disabled={speaking}
              style={{
                background: "none",
                border: "none",
                cursor: speaking ? "not-allowed" : "pointer",
                color: "var(--mantine-color-brand-6)",
                opacity: speaking ? 0.5 : 1,
                fontSize: "inherit",
                fontFamily: "inherit",
                padding: 0,
              }}
            >
              xué
            </button>
          </div>
          <GMText variant="secondary">tap for sound</GMText>
        </GMContainer>
      </GMContainer>
    </GMContainer>
  );
}

// +------------------+
// | PAGE             |
// +------------------+

function HomePage(): React.JSX.Element {
  const [query, setQuery] = useState("");

  const results = useMemo(() => filterWords(query), [query]);

  return (
    <GMContainer fullHeight>
      <Header />

      {/* Search: text input */}
      <GMContainer variant="row" px="sm" py="sm" gap="sm" align="center">
        <GMContainer grow>
          <TextInput
            placeholder={SEARCH_PLACEHOLDER}
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            leftSection={
              query.length > 0 ? (
                <span
                  onClick={() => setQuery("")}
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <GMIcon name="X" color="var(--gm-text-muted)" />
                </span>
              ) : (
                <GMIcon name="Search" color="var(--gm-text-muted)" />
              )
            }
          />
        </GMContainer>
        <GMContainer>
          {query.length > 0 && results.length > 0 && (
            <GMText variant="secondary">{`${results.length} result${results.length === 1 ? "" : "s"}`}</GMText>
          )}
        </GMContainer>
      </GMContainer>

      {/* Search: drawing input */}
      <DrawingInput onSelect={(char) => setQuery(char)} />

      {/* Results list or empty state */}
      <GMContainer px="sm" grow scrollable>
        {results.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gridAutoRows: "1fr",
              gap: "0.5rem",
            }}
          >
            {results.map((word) => (
              <WordCard key={word.chinese} word={word} />
            ))}
          </div>
        ) : query.length > 0 ? (
          <NoResultsState query={query} />
        ) : (
          <StartState />
        )}
      </GMContainer>
    </GMContainer>
  );
}

export default HomePage;
