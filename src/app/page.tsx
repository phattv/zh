"use client";

import { GMContainer } from "@/components/GMContainer";
import { GMIcon } from "@/components/GMIcon";
import { GMText } from "@/components/GMText";
import { WORDS, type Word } from "@/data/words";
import { TextInput } from "@mantine/core";
import { useMemo, useState } from "react";
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

function EmptyState({ query }: { query: string }): React.JSX.Element {
  if (query.length > 0) {
    return (
      <GMContainer align="center" py="xl" gap="sm">
        <GMIcon name="Search" size="xl" color="var(--gm-text-muted)" />
        <GMText variant="subtitle">{`No results for "${query}"`}</GMText>
        <GMText variant="secondary">Search something else</GMText>
        <GMText variant="secondary">{SEARCH_PLACEHOLDER}</GMText>
      </GMContainer>
    );
  }

  return (
    <GMContainer align="center" py="xl" gap="md">
      <GMIcon name="Book" size="xl" color="var(--mantine-color-brand-6)" bg />
      <GMContainer gap="xs" align="center">
        <GMText variant="title">Start searching</GMText>
        <GMText variant="secondary">{SEARCH_PLACEHOLDER}</GMText>
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

      {/* Search bar + result count row */}
      <GMContainer variant="row" px="sm" py="sm" gap="sm" align="center">
        <GMContainer grow>
          <TextInput
            placeholder={SEARCH_PLACEHOLDER}
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
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
        ) : (
          <EmptyState query={query} />
        )}
      </GMContainer>
    </GMContainer>
  );
}

export default HomePage;
