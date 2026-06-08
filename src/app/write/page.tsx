"use client";

import { GMButton } from "@/components/GMButton";
import { GMContainer } from "@/components/GMContainer";
import { GMIcon } from "@/components/GMIcon";
import { GMText } from "@/components/GMText";
import { ROUTES } from "@/constants/routes";
import { Loader, Textarea } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Header } from "../_components/Header";

// +--------+
// | TYPES  |
// +--------+

type GrammarNote = {
  original: string;
  correction: string;
  explanation: string;
  explanation_en: string;
};

type VocabNote = {
  word: string;
  suggestion: string;
  reason: string;
  reason_en: string;
};

type Analysis = {
  grammar: GrammarNote[];
  vocabulary: VocabNote[];
  correctedText: string;
};

type WriteState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; data: Analysis }
  | { status: "error"; message: string };

type PageMode = "analyze" | "develop";

type DevelopAction =
  | "develop"
  | "longer"
  | "shorter"
  | "simpler"
  | "richer"
  | "hsk1"
  | "hsk2"
  | "hsk3"
  | "hsk4"
  | "hsk5"
  | "hsk6";

type DevelopState =
  | { status: "idle" }
  | { status: "loading"; action: DevelopAction }
  | {
      status: "done";
      action: DevelopAction;
      originalText: string;
      result: string;
      note_en: string;
    }
  | { status: "error"; message: string };

// +-----------+
// | CONSTANTS |
// +-----------+

const FEATURES = [
  "Grammar corrections with plain-language explanations",
  "Vocabulary upgrade suggestions — swap basic words for richer ones",
];

const DEVELOP_ACTIONS: { action: DevelopAction; label: string }[] = [
  { action: "develop", label: "Develop" },
  { action: "longer", label: "Longer" },
  { action: "shorter", label: "Shorter" },
  { action: "simpler", label: "Simpler" },
  { action: "richer", label: "Richer" },
];

const HSK_ACTIONS: {
  action: DevelopAction;
  label: string;
  color: "success" | "info" | "warning" | "danger";
}[] = [
  { action: "hsk1", label: "HSK 1", color: "success" },
  { action: "hsk2", label: "HSK 2", color: "success" },
  { action: "hsk3", label: "HSK 3", color: "info" },
  { action: "hsk4", label: "HSK 4", color: "info" },
  { action: "hsk5", label: "HSK 5", color: "warning" },
  { action: "hsk6", label: "HSK 6", color: "danger" },
];

// +-----------+
// | HELPERS   |
// +-----------+

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

async function pasteFromClipboard(set: (text: string) => void) {
  try {
    const text = await navigator.clipboard.readText();
    if (text) set(text);
  } catch {}
}

function zhCharCount(text: string): number {
  return (text.match(/[一-鿿㐀-䶿]/g) ?? []).length;
}

type DiffChunk = { text: string; type: "same" | "del" | "ins" };

function computeDiff(
  a: string,
  b: string,
): { orig: DiffChunk[]; res: DiffChunk[] } {
  if (a === b)
    return {
      orig: [{ text: a, type: "same" }],
      res: [{ text: b, type: "same" }],
    };
  // Skip diff for very long texts to avoid O(m*n) perf hit
  if (a.length * b.length > 200_000)
    return {
      orig: [{ text: a, type: "same" }],
      res: [{ text: b, type: "same" }],
    };

  const m = a.length,
    n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);

  const origChunks: DiffChunk[] = [];
  const resChunks: DiffChunk[] = [];
  let i = m,
    j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      origChunks.unshift({ text: a[i - 1], type: "same" });
      resChunks.unshift({ text: b[j - 1], type: "same" });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      resChunks.unshift({ text: b[j - 1], type: "ins" });
      j--;
    } else {
      origChunks.unshift({ text: a[i - 1], type: "del" });
      i--;
    }
  }

  const merge = (chunks: DiffChunk[]): DiffChunk[] =>
    chunks.reduce<DiffChunk[]>((acc, c) => {
      const last = acc[acc.length - 1];
      if (last?.type === c.type) {
        last.text += c.text;
        return acc;
      }
      return [...acc, { ...c }];
    }, []);

  return { orig: merge(origChunks), res: merge(resChunks) };
}

function DiffText({
  chunks,
  highlightBg,
  highlightColor,
}: {
  chunks: DiffChunk[];
  highlightBg: string;
  highlightColor: string;
}): React.JSX.Element {
  return (
    <>
      {chunks.map((chunk, i) =>
        chunk.type === "same" ? (
          <span key={i}>{chunk.text}</span>
        ) : (
          <mark
            key={i}
            style={{
              background: highlightBg,
              color: highlightColor,
              borderRadius: "3px",
              padding: "0 1px",
            }}
          >
            {chunk.text}
          </mark>
        ),
      )}
    </>
  );
}

type Highlight = { substring: string; bg: string; color: string };

function annotateText(text: string, highlights: Highlight[]): React.ReactNode {
  type Range = { start: number; end: number; bg: string; color: string };
  const ranges: Range[] = [];

  for (const { substring, bg, color } of highlights) {
    if (!substring) continue;
    let pos = 0;
    while (pos < text.length) {
      const idx = text.indexOf(substring, pos);
      if (idx === -1) break;
      ranges.push({ start: idx, end: idx + substring.length, bg, color });
      pos = idx + substring.length;
    }
  }

  ranges.sort((a, b) => a.start - b.start);

  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  for (const r of ranges) {
    if (r.start < cursor) continue;
    if (r.start > cursor) nodes.push(text.slice(cursor, r.start));
    nodes.push(
      <mark
        key={r.start}
        style={{
          background: r.bg,
          color: r.color,
          borderRadius: "3px",
          padding: "0 1px",
        }}
      >
        {text.slice(r.start, r.end)}
      </mark>,
    );
    cursor = r.end;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return <>{nodes}</>;
}

const TEXT_BOX: React.CSSProperties = {
  padding: "0.75rem",
  borderRadius: "var(--mantine-radius-md)",
  border: "1px solid var(--mantine-color-default-border)",
  lineHeight: 1.8,
  fontSize: "1rem",
  color: "var(--gm-text-primary)",
  whiteSpace: "pre-wrap",
};

// +------------------+
// | RESULT SECTIONS  |
// +------------------+

function CorrectedTextSection({
  original,
  corrected,
  grammar,
}: {
  original: string;
  corrected: string;
  grammar: GrammarNote[];
}) {
  const hasChanges = corrected.trim() !== original.trim();

  return (
    <GMContainer gap="md">
      {/* Original */}
      <GMContainer gap="xs">
        <GMText variant="section_title">{`Original · ${zhCharCount(original)} 字`}</GMText>
        <div style={TEXT_BOX}>
          {grammar.length > 0
            ? annotateText(
                original,
                grammar.map((n) => ({
                  substring: n.original,
                  bg: "color-mix(in srgb, var(--mantine-color-danger-6) 22%, transparent)",
                  color: "var(--mantine-color-danger-6)",
                })),
              )
            : original}
        </div>
      </GMContainer>

      {/* Corrected */}
      {hasChanges ? (
        <GMContainer gap="xs">
          <GMContainer variant="row" justify="space-between" align="center">
            <GMText variant="section_title">{`Corrected · ${zhCharCount(corrected)} 字`}</GMText>
            <GMButton
              variant="icon"
              onClick={() => copyToClipboard(corrected)}
              tooltip="Copy corrected text"
            >
              <GMIcon name="Clipboard" size="sm" />
            </GMButton>
          </GMContainer>
          <div
            style={{
              ...TEXT_BOX,
              background:
                "color-mix(in srgb, var(--mantine-color-success-6) 6%, transparent)",
            }}
          >
            {annotateText(
              corrected,
              grammar.map((n) => ({
                substring: n.correction,
                bg: "color-mix(in srgb, var(--mantine-color-success-6) 30%, transparent)",
                color: "var(--mantine-color-success-6)",
              })),
            )}
          </div>
        </GMContainer>
      ) : (
        <GMContainer variant="row" gap="sm">
          <GMIcon
            name="Check"
            size="sm"
            color="var(--mantine-color-success-6)"
          />
          <GMText variant="secondary">No grammar corrections needed.</GMText>
        </GMContainer>
      )}
    </GMContainer>
  );
}

function GrammarSection({ notes }: { notes: GrammarNote[] }) {
  if (notes.length === 0) return null;
  return (
    <GMContainer gap="sm">
      <GMText variant="section_title">{`Grammar · ${notes.length} correction${notes.length > 1 ? "s" : ""}`}</GMText>
      {notes.map((note, i) => (
        <GMContainer key={i} variant="card" gap="sm" py="sm" px="sm">
          <GMContainer variant="row" gap="sm" align="center" wrap>
            <span
              style={{
                color: "var(--mantine-color-danger-6)",
                textDecoration: "line-through",
                fontFamily: "inherit",
                fontSize: "1rem",
              }}
            >
              {note.original}
            </span>
            <GMIcon
              name="ArrowNarrowRight"
              size="sm"
              color="var(--gm-text-muted)"
            />
            <span
              style={{
                color: "var(--mantine-color-success-6)",
                fontWeight: 600,
                fontSize: "1rem",
              }}
            >
              {note.correction}
            </span>
          </GMContainer>
          <GMText variant="secondary">{note.explanation}</GMText>
          {note.explanation_en && (
            <GMText variant="secondary">{note.explanation_en}</GMText>
          )}
        </GMContainer>
      ))}
    </GMContainer>
  );
}

function VocabSection({ notes }: { notes: VocabNote[] }) {
  if (notes.length === 0) return null;
  return (
    <GMContainer gap="sm">
      <GMText variant="section_title">{`Vocabulary · ${notes.length} suggestion${notes.length > 1 ? "s" : ""}`}</GMText>
      {notes.map((note, i) => (
        <GMContainer key={i} variant="card" gap="xs" py="sm" px="sm">
          <GMContainer variant="row" gap="sm" align="center" wrap>
            <GMText variant="badge">{note.word}</GMText>
            <GMIcon
              name="ArrowNarrowRight"
              size="sm"
              color="var(--gm-text-muted)"
            />
            <GMText variant="badge" color="info">
              {note.suggestion}
            </GMText>
          </GMContainer>
          <GMText variant="secondary">{note.reason}</GMText>
          {note.reason_en && (
            <GMText variant="secondary">{note.reason_en}</GMText>
          )}
        </GMContainer>
      ))}
    </GMContainer>
  );
}

// +====================+
// | DEVELOP SECTION    |
// +====================+

function DevelopSection({
  inputText,
  onUseResult,
  onOpenInRead,
}: {
  inputText: string;
  onUseResult: (text: string) => void;
  onOpenInRead: (text: string) => void;
}): React.JSX.Element {
  const [state, setState] = useState<DevelopState>({ status: "idle" });
  const prevText = useRef(inputText);

  // Clear stale result when the textarea is edited manually
  if (prevText.current !== inputText) {
    prevText.current = inputText;
    if (state.status === "done") setState({ status: "idle" });
  }

  async function run(action: DevelopAction) {
    if (!inputText.trim()) return;
    const originalText = inputText;
    setState({ status: "loading", action });
    try {
      const res = await fetch("/write/develop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText, action }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        setState({ status: "error", message: err.error ?? "Transform failed" });
        return;
      }
      const data: { result: string; note_en: string } = await res.json();
      setState({
        status: "done",
        action,
        originalText,
        result: data.result,
        note_en: data.note_en,
      });
    } catch (e) {
      setState({
        status: "error",
        message: e instanceof Error ? e.message : "Network error",
      });
    }
  }

  const isLoading = state.status === "loading";
  const disabled = !inputText.trim() || isLoading;

  return (
    <GMContainer gap="md">
      {/* Transform chips */}
      <GMContainer gap="sm">
        <GMContainer variant="row" gap="xs" wrap>
          {DEVELOP_ACTIONS.map(({ action, label }) => (
            <GMButton
              key={action}
              variant="chip"
              disabled={disabled}
              loading={
                isLoading &&
                state.status === "loading" &&
                state.action === action
              }
              onClick={() => run(action)}
            >
              {label}
            </GMButton>
          ))}
        </GMContainer>
        <GMContainer variant="row" gap="xs" wrap>
          {HSK_ACTIONS.map(({ action, label }) => (
            <GMButton
              key={action}
              variant="chip"
              disabled={disabled}
              loading={
                isLoading &&
                state.status === "loading" &&
                state.action === action
              }
              onClick={() => run(action)}
            >
              {label}
            </GMButton>
          ))}
        </GMContainer>
      </GMContainer>

      {/* Inline loading */}
      {isLoading && (
        <GMContainer variant="row" gap="sm">
          <Loader size="xs" color="brand" />
          <GMText variant="secondary">Transforming…</GMText>
        </GMContainer>
      )}

      {/* Error */}
      {state.status === "error" && (
        <GMContainer variant="row" gap="sm">
          <GMIcon
            name="AlertCircle"
            size="sm"
            color="var(--mantine-color-danger-6)"
          />
          <GMText variant="secondary">{state.message}</GMText>
        </GMContainer>
      )}

      {/* Result with diff */}
      {state.status === "done" &&
        (() => {
          const { orig, res } = computeDiff(state.originalText, state.result);
          return (
            <GMContainer gap="md">
              <GMContainer gap="xs">
                <GMText variant="section_title">{`Original · ${zhCharCount(state.originalText)} 字`}</GMText>
                <div style={TEXT_BOX}>
                  <DiffText
                    chunks={orig}
                    highlightBg="color-mix(in srgb, var(--mantine-color-danger-6) 22%, transparent)"
                    highlightColor="var(--mantine-color-danger-6)"
                  />
                </div>
              </GMContainer>
              <GMContainer gap="xs">
                <GMContainer
                  variant="row"
                  justify="space-between"
                  align="center"
                >
                  <GMText variant="section_title">{`Result · ${zhCharCount(state.result)} 字`}</GMText>
                  <GMContainer variant="row" gap="xs">
                    <GMButton
                      variant="icon"
                      onClick={() => copyToClipboard(state.result)}
                      tooltip="Copy result"
                    >
                      <GMIcon name="Clipboard" size="sm" />
                    </GMButton>
                    <GMButton
                      variant="secondary"
                      onClick={() => onUseResult(state.result)}
                    >
                      Use as input
                    </GMButton>
                    <GMButton
                      variant="secondary"
                      onClick={() => onOpenInRead(state.result)}
                    >
                      Open in Read →
                    </GMButton>
                  </GMContainer>
                </GMContainer>
                <div
                  style={{
                    ...TEXT_BOX,
                    background:
                      "color-mix(in srgb, var(--mantine-color-success-6) 6%, transparent)",
                  }}
                >
                  <DiffText
                    chunks={res}
                    highlightBg="color-mix(in srgb, var(--mantine-color-success-6) 30%, transparent)"
                    highlightColor="var(--mantine-color-success-6)"
                  />
                </div>
                {state.note_en && (
                  <GMText variant="secondary">{state.note_en}</GMText>
                )}
              </GMContainer>
            </GMContainer>
          );
        })()}
    </GMContainer>
  );
}

// +====================+
// | WRITE MODE         |
// +====================+

function WriteMode(): React.JSX.Element {
  const router = useRouter();
  const [inputText, setInputText] = useState("");
  const [pageMode, setPageMode] = useState<PageMode>("analyze");
  const [state, setState] = useState<WriteState>({ status: "idle" });

  function openInRead(text: string) {
    sessionStorage.setItem("zh-read-prefill", text);
    router.push(ROUTES.read);
  }

  async function analyze() {
    if (!inputText.trim()) return;
    setState({ status: "loading" });
    try {
      const res = await fetch("/write/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        setState({ status: "error", message: err.error ?? "Analysis failed" });
        return;
      }
      const data: Analysis = await res.json();
      setState({ status: "done", data });
    } catch (e) {
      setState({
        status: "error",
        message: e instanceof Error ? e.message : "Network error",
      });
    }
  }

  // --- analyze: loading ---
  if (pageMode === "analyze" && state.status === "loading") {
    return (
      <GMContainer grow justify="center" align="center" gap="md">
        <Loader color="brand" size="md" />
        <GMText variant="secondary">Analyzing your writing…</GMText>
      </GMContainer>
    );
  }

  // --- analyze: results ---
  if (pageMode === "analyze" && state.status === "done") {
    const { data } = state;
    return (
      <GMContainer grow>
        <GMContainer
          variant="row"
          px="sm"
          py="xs"
          bb
          gap="sm"
          justify="space-between"
          align="center"
        >
          <GMContainer variant="row" gap="sm" align="center">
            <GMButton
              variant="icon"
              onClick={() => setState({ status: "idle" })}
              tooltip="Back"
            >
              <GMIcon name="ChevronLeft" />
            </GMButton>
            <GMText variant="secondary">Writing analysis</GMText>
          </GMContainer>
          <GMButton
            variant="secondary"
            onClick={() => openInRead(data.correctedText)}
          >
            Open in Read →
          </GMButton>
        </GMContainer>
        <GMContainer grow scrollable px="sm" py="sm" gap="lg">
          <CorrectedTextSection
            original={inputText}
            corrected={data.correctedText}
            grammar={data.grammar}
          />
          <GrammarSection notes={data.grammar} />
          <VocabSection notes={data.vocabulary} />
          <div style={{ height: "1rem" }} />
        </GMContainer>
      </GMContainer>
    );
  }

  // --- input screen (both modes) ---
  return (
    <GMContainer px="sm" gap="md" grow scrollable>
      {/* Mode tab strip */}
      <GMContainer variant="row" gap="none">
        {(["analyze", "develop"] as PageMode[]).map((m) => (
          <GMButton
            key={m}
            variant="tab"
            active={pageMode === m}
            onClick={() => setPageMode(m)}
          >
            {m === "analyze" ? "Analyze" : "Develop"}
          </GMButton>
        ))}
      </GMContainer>

      {/* Shared textarea */}
      <GMContainer gap="xs">
        <GMContainer variant="row" justify="space-between" align="center">
          <GMText variant="section_title">
            {pageMode === "analyze" ? "Your Chinese text" : "Notes or draft"}
          </GMText>
          <GMContainer variant="row" gap="xs" align="center">
            {inputText.trim() && (
              <GMText variant="secondary">{`${zhCharCount(inputText)} 字`}</GMText>
            )}
            <GMButton
              variant="icon"
              onClick={() => pasteFromClipboard(setInputText)}
              tooltip="Paste from clipboard"
            >
              <GMIcon name="ClipboardText" size="sm" />
            </GMButton>
          </GMContainer>
        </GMContainer>
        <Textarea
          placeholder={
            pageMode === "analyze"
              ? "写点什么吧… paste or type any Chinese text."
              : "写个大概… rough ideas, bullet points, or a draft."
          }
          value={inputText}
          onChange={(e) => setInputText(e.currentTarget.value)}
          autosize
          minRows={4}
          maxRows={8}
        />
      </GMContainer>

      {/* Analyze mode actions */}
      {pageMode === "analyze" && (
        <>
          {state.status === "error" && (
            <GMContainer variant="row" gap="sm">
              <GMIcon
                name="AlertCircle"
                size="sm"
                color="var(--mantine-color-danger-6)"
              />
              <GMText variant="secondary">{state.message}</GMText>
            </GMContainer>
          )}
          <GMButton
            variant="primary"
            leftIcon={<GMIcon name="Sparkles" />}
            onClick={analyze}
            disabled={!inputText.trim()}
          >
            Analyze writing
          </GMButton>
          <GMContainer gap="xs">
            <GMText variant="section_title">What you get</GMText>
            <GMContainer gap="xs">
              {FEATURES.map((hint) => (
                <GMContainer
                  key={hint}
                  variant="row"
                  gap="sm"
                  align="flex-start"
                >
                  <GMIcon
                    name="Check"
                    size="sm"
                    color="var(--mantine-color-success-6)"
                  />
                  <GMText variant="secondary">{hint}</GMText>
                </GMContainer>
              ))}
            </GMContainer>
          </GMContainer>
          <GMContainer gap="xs">
            <GMText variant="section_title">Try a sample</GMText>
            <GMContainer gap="xs">
              {SAMPLES.map((s) => (
                <GMButton
                  key={s.label}
                  variant="row"
                  withBorder
                  onClick={() => setInputText(s.text)}
                >
                  <GMContainer gap="none">
                    <GMContainer
                      variant="row"
                      justify="space-between"
                      align="center"
                    >
                      <GMText>{s.label}</GMText>
                      <GMText variant="badge" color={s.color}>
                        {s.level}
                      </GMText>
                    </GMContainer>
                    <GMText variant="secondary">
                      {s.text.slice(0, 32) + "…"}
                    </GMText>
                  </GMContainer>
                </GMButton>
              ))}
            </GMContainer>
          </GMContainer>
        </>
      )}

      {/* Develop mode actions */}
      {pageMode === "develop" && (
        <DevelopSection
          inputText={inputText}
          onUseResult={setInputText}
          onOpenInRead={openInRead}
        />
      )}
    </GMContainer>
  );
}

// +-----------+
// | SAMPLES   |
// +-----------+

const SAMPLES: {
  label: string;
  level: string;
  color: "success" | "info" | "warning" | "danger";
  text: string;
}[] = [
  {
    label: "日记",
    level: "HSK 2–3",
    color: "success",
    text: "今天我去了超市买东西。我买了很多食物，有苹果、牛奶和面包。回家的路上，天开始下雨了，我没有带伞，所以全身都湿了。",
  },
  {
    label: "请假条",
    level: "HSK 3–4",
    color: "info",
    text: "老师，您好。我明天因为身体不舒服，不能来学校上课。我去医院看病，医生说我需要休息两天。请您批准我的请假申请。谢谢！",
  },
  {
    label: "观点文章",
    level: "HSK 4–5",
    color: "warning",
    text: "手机对现代人的生活影响很大。一方面，手机让我们的生活更方便，可以随时随地联系朋友和家人。但是另一方面，很多人对手机依赖太大，影响了面对面的交流和睡眠质量。",
  },
  {
    label: "工作邮件",
    level: "HSK 5–6",
    color: "danger",
    text: "您好，感谢您对我们产品的关注。针对您提出的问题，我们经过认真研究和讨论，认为可以从以下几个方面加以改善。首先，我们将优化用户界面，使操作更加简便直观。其次，我们计划在下一个版本中增加您建议的功能。",
  },
];

// +====================+
// | WRITE PAGE         |
// +====================+

function WritePage(): React.JSX.Element {
  return (
    <GMContainer fullHeight>
      <Header />
      <WriteMode />
    </GMContainer>
  );
}

export default WritePage;
