"use client";

import { TextInput } from "@mantine/core";
import { useMantineColorScheme } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import { GMButton } from "@/components/GMButton";
import { GMContainer } from "@/components/GMContainer";
import { GMIcon } from "@/components/GMIcon";
import { GMText } from "@/components/GMText";
import { WORDS, type Word } from "@/data/words";

// +------------------+
// | DISPLAY SIZE     |
// +------------------+

type DisplaySize = "small" | "medium" | "large";

const DISPLAY_SIZE_PX: Record<DisplaySize, string> = {
  small: "14px",
  medium: "16px",
  large: "18px",
};

function useDisplaySize() {
  const [size, setSize] = useState<DisplaySize>("medium");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("zh-display-size") as DisplaySize | null;
      if (stored && stored in DISPLAY_SIZE_PX) setSize(stored);
    } catch {}
  }, []);

  function applySize(next: DisplaySize) {
    setSize(next);
    document.documentElement.style.fontSize = DISPLAY_SIZE_PX[next];
    try {
      localStorage.setItem("zh-display-size", next);
    } catch {}
  }

  return { size, applySize };
}

// +------------------+
// | PINYIN SEARCH    |
// +------------------+

function normalizePinyin(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function filterWords(query: string): Word[] {
  const q = normalizePinyin(query);
  if (!q) return [];
  return WORDS.filter((word) => {
    const pinyin = normalizePinyin(word.pinyin ?? "");
    return pinyin.includes(q) || word.characters.includes(query.trim());
  });
}

// +------------------+
// | WORD CARD        |
// +------------------+

const HSK_COLOR: Record<number, "info" | "success" | "warning" | "brand" | "danger"> = {
  1: "success",
  2: "success",
  3: "info",
  4: "info",
  5: "warning",
  6: "danger",
};

function WordCard({ word }: { word: Word }): JSX.Element {
  return (
    <GMContainer variant="card" gap="sm">
      {/* Character + badges row */}
      <GMContainer variant="row" justify="space-between" align="flex-start">
        <span
          className="zh-characters"
          style={{ fontSize: "2.75rem" }}
          lang="zh"
        >
          {word.characters}
        </span>
        <GMContainer gap="xs" align="flex-end">
          {word.hsk_level && (
            <GMText variant="badge" color={HSK_COLOR[word.hsk_level] ?? "info"}>
              {`HSK ${word.hsk_level}`}
            </GMText>
          )}
          {word.word_type && <GMText variant="badge">{word.word_type}</GMText>}
        </GMContainer>
      </GMContainer>

      {/* Pinyin */}
      {word.pinyin && <GMText variant="title">{word.pinyin}</GMText>}

      {/* Meanings */}
      {word.meaning_en && <GMText variant="body">{word.meaning_en}</GMText>}
      {word.meaning_vi && <GMText variant="secondary">{word.meaning_vi}</GMText>}

      {/* Sino-Vietnamese */}
      {word.syno_vn && (
        <GMContainer variant="row" gap="xs" align="center">
          <GMText variant="secondary">漢越:</GMText>
          <span
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--mantine-color-brand-6)",
              fontFamily: "var(--font-plus-jakarta), sans-serif",
            }}
          >
            {word.syno_vn}
          </span>
        </GMContainer>
      )}
    </GMContainer>
  );
}

// +------------------+
// | HEADER           |
// +------------------+

function Header(): JSX.Element {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { size, applySize } = useDisplaySize();

  return (
    <GMContainer bb py="sm" px="md">
      <GMContainer variant="row" justify="space-between">
        {/* App name */}
        <GMContainer gap="xs">
          <GMText variant="title">汉语</GMText>
          <GMText variant="secondary">hànyǔ</GMText>
        </GMContainer>

        {/* Controls */}
        <GMContainer variant="row" gap="sm">
          {/* Display size */}
          <GMContainer variant="row" gap="xs">
            {(["small", "medium", "large"] as DisplaySize[]).map((s) => (
              <GMButton
                key={s}
                variant="chip"
                active={size === s}
                onClick={() => applySize(s)}
                tooltip={`Font size: ${s}`}
              >
                {s === "small" ? "S" : s === "medium" ? "M" : "L"}
              </GMButton>
            ))}
          </GMContainer>

          {/* Theme toggle */}
          <GMButton
            variant="icon"
            onClick={toggleColorScheme}
            tooltip={colorScheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            <GMIcon name={colorScheme === "dark" ? "Sun" : "Moon"} />
          </GMButton>
        </GMContainer>
      </GMContainer>
    </GMContainer>
  );
}

// +------------------+
// | EMPTY STATE      |
// +------------------+

function EmptyState({ query }: { query: string }): JSX.Element {
  if (query.length > 0) {
    return (
      <GMContainer align="center" py="xl" gap="sm">
        <GMIcon name="Search" size="xl" color="var(--gm-text-muted)" />
        <GMText variant="subtitle" textAlign="center">
          {`No results for "${query}"`}
        </GMText>
        <GMText variant="secondary" textAlign="center">
          Try searching without tone marks, e.g. "qian jin" for 前进
        </GMText>
      </GMContainer>
    );
  }

  return (
    <GMContainer align="center" py="xl" gap="md">
      <GMIcon name="Book" size="xl" color="var(--mantine-color-brand-6)" bg />
      <GMContainer gap="xs" align="center">
        <GMText variant="title" textAlign="center">
          Search by pinyin
        </GMText>
        <GMText variant="secondary" textAlign="center">
          Type with or without tone marks
        </GMText>
      </GMContainer>
      <GMContainer gap="xs" align="center">
        <GMText variant="secondary" textAlign="center">
          Try: qian jìn · xue xi · peng you
        </GMText>
      </GMContainer>
    </GMContainer>
  );
}

// +------------------+
// | PAGE             |
// +------------------+

export default function HomePage(): JSX.Element {
  const [query, setQuery] = useState("");

  const results = useMemo(() => filterWords(query), [query]);

  return (
    <GMContainer variant="col" fullHeight>
      <Header />

      {/* Search bar */}
      <GMContainer px="md" py="md">
        <TextInput
          placeholder="Search pinyin… e.g. qian, xue xi"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          size="md"
          radius="md"
          leftSection={<GMIcon name="Search" size="sm" color="var(--gm-text-muted)" />}
          rightSection={
            query.length > 0 ? (
              <GMButton variant="icon" onClick={() => setQuery("")} tooltip="Clear">
                <GMIcon name="X" size="sm" />
              </GMButton>
            ) : null
          }
          styles={{
            input: {
              background: "var(--mantine-color-default)",
              border: "1px solid var(--mantine-color-default-border)",
            },
          }}
        />
      </GMContainer>

      {/* Results count */}
      {query.length > 0 && results.length > 0 && (
        <GMContainer px="md">
          <GMText variant="secondary">{`${results.length} result${results.length === 1 ? "" : "s"}`}</GMText>
        </GMContainer>
      )}

      {/* Results list or empty state */}
      <GMContainer gap="sm" px="md" py="md" grow scrollable>
        {results.length > 0 ? (
          results.map((word) => <WordCard key={word.id} word={word} />)
        ) : (
          <EmptyState query={query} />
        )}
      </GMContainer>
    </GMContainer>
  );
}
