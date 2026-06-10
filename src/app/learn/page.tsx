"use client";

import { GMButton } from "@/components/GMButton";
import { GMContainer } from "@/components/GMContainer";
import { GMIcon } from "@/components/GMIcon";
import { GMText } from "@/components/GMText";
import { WORDS, type Word } from "@/data/words";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { HANZI_CHAR_SIZE, HanziAnimation } from "../_components/HanziAnimation";
import { Header } from "../_components/Header";

// +------------------+
// | TOPIC MATCHING   |
// +------------------+

const TOPIC_PATTERNS: Array<{ topic: string; pattern: RegExp }> = [
  {
    topic: "Food & Drink",
    pattern:
      /eat|food|drink|tea|water|rice|fish|meat|fruit|vegetable|dish|noodle|bread|meal|cook|restaurant|sugar|salt|soup|wine|beer|cake|egg|chicken|pork|beef|milk|juice|coffee/i,
  },
  {
    topic: "Family",
    pattern:
      /mother|father|son|daughter|brother|sister|wife|husband|family|child|parent|uncle|aunt|grandm|grandp|relative|sibling/i,
  },
  {
    topic: "Numbers & Time",
    pattern:
      /\bone\b|\btwo\b|\bthree\b|\bfour\b|\bfive\b|\bsix\b|\bseven\b|\beight\b|\bnine\b|\bten\b|hundred|thousand|million|year|month|week|hour|minute|second|morning|afternoon|evening|night|today|yesterday|tomorrow|\bnow\b|time|date|season|spring|summer|autumn|winter|century|decade/i,
  },
  {
    topic: "Travel & Transport",
    pattern:
      /bus|car|taxi|train|plane|airplane|airport|station|hotel|road|map|travel|arrive|leave|return|ticket|luggage|direction|north|south|east|west|trip|tour|visit|abroad/i,
  },
  {
    topic: "Work & Study",
    pattern:
      /work|study|school|learn|read|write|book|class|teacher|student|test|exam|job|company|office|meeting|computer|university|college|homework|research|science|lesson/i,
  },
  {
    topic: "Body & Health",
    pattern:
      /body|head|hand|foot|eye|ear|mouth|nose|heart|sick|doctor|hospital|medicine|healthy|pain|arm|leg|back|stomach|face|hair|tooth|tongue|brain|bone/i,
  },
  {
    topic: "Home & Objects",
    pattern:
      /house|home|room|door|window|table|chair|bed|cup|bag|clothes|pen|key|phone|television|computer|furniture|lamp|floor|wall|kitchen|bathroom/i,
  },
  {
    topic: "Nature",
    pattern:
      /sun|moon|star|sky|cloud|rain|snow|wind|weather|mountain|river|lake|sea|ocean|tree|flower|animal|dog|cat|bird|plant|grass|forest|field|earth/i,
  },
  {
    topic: "People & Society",
    pattern:
      /people|person|friend|man|woman|country|city|government|language|culture|society|police|army|nation|public|community|political|economic/i,
  },
  {
    topic: "Emotions & States",
    pattern:
      /happy|sad|angry|love|like|want|think|know|hope|feel|beautiful|important|interesting|boring|exciting|worry|afraid|proud|comfortable|careful|serious|honest/i,
  },
];

const ALL_TOPICS = TOPIC_PATTERNS.map((t) => t.topic);

function getWordTopic(word: Word): string | null {
  for (const { topic, pattern } of TOPIC_PATTERNS) {
    if (pattern.test(word.en)) return topic;
  }
  return null;
}

function findCompounds(word: Word): Word[] {
  return WORDS.filter(
    (w) => w.chinese !== word.chinese && w.chinese.includes(word.chinese),
  ).slice(0, 8);
}

function getSuggestions(word: Word, exclude?: string): Word[] {
  const sameHsk = WORDS.filter(
    (w) =>
      w.hsk === word.hsk && w.chinese !== word.chinese && w.chinese !== exclude,
  );
  // shuffle and take 6
  const shuffled = sameHsk.sort(() => Math.random() - 0.5).slice(0, 6);
  return shuffled;
}

// +------------------+
// | AI ENRICHMENT    |
// +------------------+

type Enrichment = {
  explanation_zh: string;
  examples: Array<{ zh: string; pinyin: string; en: string }>;
  synonyms: Array<{ chinese: string; pinyin: string; en: string }>;
  antonyms: Array<{ chinese: string; pinyin: string; en: string }>;
};

function speak(text: string, onDone?: () => void) {
  const synth = window.speechSynthesis;
  if (!synth) {
    onDone?.();
    return;
  }
  synth.cancel();
  setTimeout(() => {
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "zh-CN";
    utt.rate = 0.85;
    utt.onend = () => onDone?.();
    utt.onerror = () => onDone?.();
    synth.speak(utt);
  }, 80);
}

// +------------------+
// | MINI WORD CARD   |
// +------------------+

function MiniWordCard({
  word,
  onSelect,
}: {
  word: Word;
  onSelect: (w: Word) => void;
}): React.JSX.Element {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(word)}
      onKeyDown={(e) => e.key === "Enter" && onSelect(word)}
      className="gm-row-button"
      style={{
        border: "1px solid var(--mantine-color-default-border)",
        borderRadius: "var(--mantine-radius-md)",
        padding: "0.75rem",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "0.25rem",
        minWidth: 0, // override grid item min-width:auto so 1fr cells don't blow out
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "0.25rem",
          minWidth: 0,
        }}
      >
        <span
          className="zh-characters"
          style={{ fontSize: "1.75rem", lineHeight: 1 }}
        >
          {word.chinese}
        </span>
        <span
          style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            padding: "0.2rem 0.4rem",
            borderRadius: "var(--mantine-radius-sm)",
            background:
              "color-mix(in srgb, var(--mantine-color-brand-6) 15%, transparent)",
            color: "var(--mantine-color-brand-6)",
            flexShrink: 0,
            lineHeight: 1,
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          {`HSK ${word.hsk}`}
        </span>
      </div>
      <span
        style={{
          fontSize: "0.875rem",
          color: "var(--gm-text-muted)",
          lineHeight: 1.4,
        }}
      >
        {word.pinyin}
      </span>
      <span
        style={{
          fontSize: "0.875rem",
          color: "var(--gm-text-muted)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          lineHeight: 1.4,
        }}
      >
        {word.en}
      </span>
    </div>
  );
}

// +------------------+
// | WORD DETAIL      |
// +------------------+

function WordDetail({
  word,
  onBack,
  onNavigate,
}: {
  word: Word;
  onBack: () => void;
  onNavigate: (w: Word) => void;
}): React.JSX.Element {
  const [animated, setAnimated] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [enrichment, setEnrichment] = useState<Enrichment | null>(null);
  const [enrichLoading, setEnrichLoading] = useState(false);
  const enrichCache = useRef<Map<string, Enrichment>>(new Map());

  const compounds = useMemo(() => findCompounds(word), [word]);
  const suggestions = useMemo(() => getSuggestions(word), [word]);

  useEffect(() => {
    setAnimated(false);
    const cached = enrichCache.current.get(word.chinese);
    if (cached) {
      setEnrichment(cached);
      return;
    }
    setEnrichment(null);
    setEnrichLoading(true);
    fetch("/api/learn/enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chinese: word.chinese,
        pinyin: word.pinyin,
        en: word.en,
        hsk: word.hsk,
      }),
    })
      .then((r) => r.json())
      .then((data: Enrichment) => {
        enrichCache.current.set(word.chinese, data);
        setEnrichment(data);
      })
      .catch(() => setEnrichment(null))
      .finally(() => setEnrichLoading(false));
  }, [word]);

  function handleSpeak() {
    if (speaking) return;
    setSpeaking(true);
    speak(word.chinese, () => setSpeaking(false));
  }

  return (
    <GMContainer grow scrollable>
      {/* Back button */}
      <GMContainer variant="row" py="sm" px="sm">
        <GMButton variant="icon" onClick={onBack} tooltip="Back to word list">
          <GMIcon name="ChevronLeft" />
        </GMButton>
      </GMContainer>

      <GMContainer px="sm" gap="sm">
        {/* Character + pinyin */}
        <GMContainer variant="card" px="sm" py="sm">
          <GMContainer variant="row" gap="sm">
            <GMContainer align="center">
              <div
                onClick={() => setAnimated((a) => !a)}
                style={{
                  width: HANZI_CHAR_SIZE * 1.5,
                  height: HANZI_CHAR_SIZE * 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                {animated ? (
                  <HanziAnimation word={word.chinese} />
                ) : (
                  <span
                    className="zh-characters"
                    style={{
                      fontSize:
                        word.chinese.length === 1
                          ? "4.5rem"
                          : word.chinese.length === 2
                            ? "2.8rem"
                            : "1.8rem",
                      lineHeight: 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {word.chinese}
                  </span>
                )}
              </div>
              <GMButton
                variant="text"
                onClick={handleSpeak}
                disabled={speaking}
              >
                {word.pinyin}
              </GMButton>
            </GMContainer>
            <GMContainer grow gap="xs">
              <GMContainer variant="row" gap="sm" wrap>
                <GMText
                  variant="badge"
                  color="brand"
                >{`HSK ${word.hsk}`}</GMText>
                {word.types.map((t) => (
                  <GMText key={t} variant="badge">
                    {t}
                  </GMText>
                ))}
              </GMContainer>
              <GMText>{(word.sino_vi ?? "—").toUpperCase()}</GMText>
              <GMText>{word.vi}</GMText>
              <GMText>{word.en}</GMText>
            </GMContainer>
          </GMContainer>
        </GMContainer>

        {/* AI: Synonyms */}
        {enrichment?.synonyms?.length ? (
          <GMContainer gap="sm">
            <GMContainer variant="row" gap="sm" align="center">
              <GMIcon name="Sparkles" color="var(--mantine-color-brand-6)" />
              <GMText variant="section_title">Synonyms</GMText>
            </GMContainer>
            <GMContainer variant="card" px="sm" py="sm">
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "1rem 1.5rem",
                }}
              >
                {enrichment.synonyms.map((s) => {
                  const target = WORDS.find((w) => w.chinese === s.chinese);
                  return (
                    <div
                      key={s.chinese}
                      role={target ? "button" : undefined}
                      tabIndex={target ? 0 : undefined}
                      onClick={target ? () => onNavigate(target) : undefined}
                      onKeyDown={
                        target
                          ? (e) => e.key === "Enter" && onNavigate(target)
                          : undefined
                      }
                      className={target ? "gm-row-button" : undefined}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.1rem",
                        padding: "0.25rem",
                        borderRadius: "var(--mantine-radius-sm)",
                        cursor: target ? "pointer" : "default",
                      }}
                    >
                      <span
                        className="zh-characters"
                        style={{ fontSize: "1.1rem", lineHeight: 1.5 }}
                      >
                        {s.chinese}
                      </span>
                      <span
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--gm-text-muted)",
                        }}
                      >
                        {s.pinyin}
                      </span>
                      <span
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--gm-text-muted)",
                        }}
                      >
                        {s.en}
                      </span>
                    </div>
                  );
                })}
              </div>
            </GMContainer>
          </GMContainer>
        ) : null}

        {/* AI: Antonyms */}
        {enrichment?.antonyms?.length ? (
          <GMContainer gap="sm">
            <GMContainer variant="row" gap="sm" align="center">
              <GMIcon name="Sparkles" color="var(--mantine-color-brand-6)" />
              <GMText variant="section_title">Antonyms</GMText>
            </GMContainer>
            <GMContainer variant="card" px="sm" py="sm">
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "1rem 1.5rem",
                }}
              >
                {enrichment.antonyms.map((a) => {
                  const target = WORDS.find((w) => w.chinese === a.chinese);
                  return (
                    <div
                      key={a.chinese}
                      role={target ? "button" : undefined}
                      tabIndex={target ? 0 : undefined}
                      onClick={target ? () => onNavigate(target) : undefined}
                      onKeyDown={
                        target
                          ? (e) => e.key === "Enter" && onNavigate(target)
                          : undefined
                      }
                      className={target ? "gm-row-button" : undefined}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.1rem",
                        padding: "0.25rem",
                        borderRadius: "var(--mantine-radius-sm)",
                        cursor: target ? "pointer" : "default",
                      }}
                    >
                      <span
                        className="zh-characters"
                        style={{ fontSize: "1.1rem", lineHeight: 1.5 }}
                      >
                        {a.chinese}
                      </span>
                      <span
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--gm-text-muted)",
                        }}
                      >
                        {a.pinyin}
                      </span>
                      <span
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--gm-text-muted)",
                        }}
                      >
                        {a.en}
                      </span>
                    </div>
                  );
                })}
              </div>
            </GMContainer>
          </GMContainer>
        ) : null}

        {/* AI: Explanation in Chinese */}
        <GMContainer gap="sm">
          <GMContainer variant="row" gap="sm" align="center">
            <GMIcon name="Sparkles" color="var(--mantine-color-brand-6)" />
            <GMText variant="section_title">Meaning in Chinese</GMText>
          </GMContainer>
          {enrichLoading ? (
            <GMText variant="secondary">Loading…</GMText>
          ) : enrichment?.explanation_zh ? (
            <GMContainer variant="card" px="sm" py="sm">
              <span
                className="zh-characters"
                style={{ fontSize: "1rem", lineHeight: 1.6 }}
              >
                {enrichment.explanation_zh}
              </span>
            </GMContainer>
          ) : !enrichLoading && !enrichment ? (
            <GMText variant="secondary">Could not load enrichment.</GMText>
          ) : null}
        </GMContainer>

        {/* AI: Example sentences */}
        <GMContainer gap="sm">
          <GMContainer variant="row" gap="sm" align="center">
            <GMIcon name="Sparkles" color="var(--mantine-color-brand-6)" />
            <GMText variant="section_title">Example Sentences</GMText>
          </GMContainer>
          {enrichLoading ? (
            <GMText variant="secondary">Loading…</GMText>
          ) : enrichment?.examples?.length ? (
            <GMContainer variant="card" px="sm" py="sm" gap="sm">
              {enrichment.examples.map((ex, i) => (
                <GMContainer key={i}>
                  <span
                    className="zh-characters"
                    style={{ fontSize: "1.1rem", lineHeight: 1.5 }}
                  >
                    {ex.zh}
                  </span>
                  <GMText variant="secondary">{ex.pinyin}</GMText>
                  <GMText variant="secondary">{ex.en}</GMText>
                </GMContainer>
              ))}
            </GMContainer>
          ) : null}
        </GMContainer>

        {/* Compounds */}
        {compounds.length > 0 && (
          <GMContainer gap="sm">
            <GMText variant="section_title">{`Words containing "${word.chinese}"`}</GMText>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem",
              }}
            >
              {compounds.map((c) => (
                <div
                  key={c.chinese}
                  role="button"
                  tabIndex={0}
                  onClick={() => onNavigate(c)}
                  onKeyDown={(e) => e.key === "Enter" && onNavigate(c)}
                  className="gm-row-button"
                  style={{
                    border: "1px solid var(--mantine-color-default-border)",
                    borderRadius: "var(--mantine-radius-md)",
                    padding: "0.75rem",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                    minWidth: 0,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "0.25rem",
                    }}
                  >
                    <span
                      className="zh-characters"
                      style={{ fontSize: "1.1rem", lineHeight: 1.5 }}
                    >
                      {c.chinese}
                    </span>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        padding: "0.2rem 0.4rem",
                        borderRadius: "var(--mantine-radius-sm)",
                        background:
                          "color-mix(in srgb, var(--mantine-color-brand-6) 15%, transparent)",
                        color: "var(--mantine-color-brand-6)",
                        flexShrink: 0,
                        lineHeight: 1,
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                    >{`HSK ${c.hsk}`}</span>
                  </div>
                  <span
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--gm-text-muted)",
                    }}
                  >
                    {c.pinyin}
                  </span>
                  <span
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--gm-text-muted)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.en}
                  </span>
                </div>
              ))}
            </div>
          </GMContainer>
        )}

        {/* Suggestions */}
        <GMContainer gap="sm">
          <GMText variant="section_title">{`More HSK ${word.hsk} words`}</GMText>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.5rem",
            }}
          >
            {suggestions.map((s) => (
              <MiniWordCard key={s.chinese} word={s} onSelect={onNavigate} />
            ))}
          </div>
        </GMContainer>

        <GMContainer py="md" />
      </GMContainer>
    </GMContainer>
  );
}

// +------------------+
// | WORD LIST        |
// +------------------+

function WordList({
  words,
  onSelect,
}: {
  words: Word[];
  onSelect: (w: Word) => void;
}): React.JSX.Element {
  if (words.length === 0) {
    return (
      <GMContainer align="center" py="xl" gap="sm">
        <GMIcon name="Book" size="xl" color="var(--gm-text-muted)" />
        <GMText variant="subtitle">No words match these filters</GMText>
        <GMText variant="secondary">Try a different HSK level or topic</GMText>
      </GMContainer>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "0.5rem",
      }}
    >
      {words.map((word) => (
        <MiniWordCard key={word.chinese} word={word} onSelect={onSelect} />
      ))}
    </div>
  );
}

// +------------------+
// | FILTER BAR       |
// +------------------+

const HSK_LEVELS = [1, 2, 3, 4, 5, 6] as const;

function FilterBar({
  hskFilter,
  topicFilter,
  onHskChange,
  onTopicChange,
  onRandom,
  wordCount,
}: {
  hskFilter: number | null;
  topicFilter: string | null;
  onHskChange: (hsk: number | null) => void;
  onTopicChange: (topic: string | null) => void;
  onRandom: () => void;
  wordCount: number;
}): React.JSX.Element {
  return (
    <GMContainer bb px="sm" py="xs" gap="xs">
      {/* HSK filter row */}
      <GMContainer variant="row">
        <GMText variant="section_title">HSK</GMText>
        <GMContainer variant="row" gap="xs" scrollable grow>
          <GMButton
            variant="chip"
            active={hskFilter === null}
            onClick={() => onHskChange(null)}
          >
            All
          </GMButton>
          {HSK_LEVELS.map((level) => (
            <GMButton
              key={level}
              variant="chip"
              active={hskFilter === level}
              onClick={() => onHskChange(level)}
            >
              {String(level)}
            </GMButton>
          ))}
        </GMContainer>
        <GMButton
          variant="icon"
          onClick={onRandom}
          tooltip="Pick a random word"
        >
          <GMIcon name="ArrowsShuffle" />
        </GMButton>
      </GMContainer>

      {/* Topic filter — single scrollable row, no wrap */}
      <GMContainer variant="row" scrollable>
        <GMButton
          variant="chip"
          active={topicFilter === null}
          onClick={() => onTopicChange(null)}
        >
          All topics
        </GMButton>
        {ALL_TOPICS.map((topic) => (
          <GMButton
            key={topic}
            variant="chip"
            active={topicFilter === topic}
            onClick={() => onTopicChange(topicFilter === topic ? null : topic)}
          >
            {topic}
          </GMButton>
        ))}
      </GMContainer>
    </GMContainer>
  );
}

// +------------------+
// | PAGE (inner)     |
// +------------------+

function LearnPageInner(): React.JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [hskFilter, setHskFilter] = useState<number | null>(null);
  const [topicFilter, setTopicFilter] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);

  // Handle ?word= param from search page
  useEffect(() => {
    const wordParam = searchParams.get("word");
    if (wordParam) {
      const found = WORDS.find((w) => w.chinese === wordParam);
      if (found) setSelectedWord(found);
    }
  }, [searchParams]);

  const hasActiveFilter = hskFilter !== null || topicFilter !== null;

  const filteredWords = useMemo(() => {
    if (!hasActiveFilter) return WORDS; // kept full list so Random always works
    return WORDS.filter((word) => {
      if (hskFilter !== null && word.hsk !== hskFilter) return false;
      if (topicFilter !== null && getWordTopic(word) !== topicFilter)
        return false;
      return true;
    });
  }, [hskFilter, topicFilter, hasActiveFilter]);

  const handleRandom = useCallback(() => {
    if (filteredWords.length === 0) return;
    const word =
      filteredWords[Math.floor(Math.random() * filteredWords.length)];
    setSelectedWord(word);
    // Clear ?word= param without navigation
    router.replace("/learn", { scroll: false });
  }, [filteredWords, router]);

  const handleSelect = useCallback(
    (word: Word) => {
      setSelectedWord(word);
      router.replace("/learn", { scroll: false });
    },
    [router],
  );

  const handleBack = useCallback(() => {
    setSelectedWord(null);
    router.replace("/learn", { scroll: false });
  }, [router]);

  return (
    <GMContainer fullHeight>
      <Header />

      {selectedWord ? (
        <WordDetail
          word={selectedWord}
          onBack={handleBack}
          onNavigate={handleSelect}
        />
      ) : (
        <>
          <FilterBar
            hskFilter={hskFilter}
            topicFilter={topicFilter}
            onHskChange={setHskFilter}
            onTopicChange={setTopicFilter}
            onRandom={handleRandom}
            wordCount={hasActiveFilter ? filteredWords.length : 0}
          />
          <GMContainer px="sm" py="sm" grow scrollable>
            {hasActiveFilter ? (
              <WordList words={filteredWords} onSelect={handleSelect} />
            ) : (
              <GMContainer align="center" py="xl" gap="md">
                <GMIcon
                  name="Books"
                  size="xl"
                  color="var(--gm-text-muted)"
                  bg
                />
                <GMText variant="title">Browse words</GMText>
                <GMText variant="subtitle">
                  Select an HSK level or topic above, or hit shuffle to surprise
                  yourself
                </GMText>
              </GMContainer>
            )}
          </GMContainer>
        </>
      )}
    </GMContainer>
  );
}

// +------------------+
// | PAGE             |
// +------------------+

function LearnPage(): React.JSX.Element {
  return (
    <Suspense>
      <LearnPageInner />
    </Suspense>
  );
}

export default LearnPage;
