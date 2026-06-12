"use client";

import { GMButton } from "@/components/GMButton";
import { GMContainer } from "@/components/GMContainer";
import { GMIcon } from "@/components/GMIcon";
import { GMText } from "@/components/GMText";
import { type Word } from "@/database";
import { segmentText, type Segment, type WordSegment } from "@/lib/segment";
import { Table, Textarea } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import { Header } from "../_components/Header";

// +------------------+
// | TTS              |
// +------------------+

function speakChinese(text: string, onEnd?: () => void, rate = 0.85): void {
  const synth = window.speechSynthesis;
  if (!synth) {
    onEnd?.();
    return;
  }
  synth.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = "zh-CN";
  utt.rate = rate;
  utt.onend = () => onEnd?.();
  utt.onerror = () => onEnd?.();
  setTimeout(() => synth.speak(utt), 80);
}

// +------------------+
// | SHARED COMPONENTS|
// +------------------+

function WordToken({
  segment,
  isActive,
  showPinyin = true,
  onClick,
}: {
  segment: WordSegment;
  isActive: boolean;
  showPinyin?: boolean;
  onClick: () => void;
}): React.JSX.Element {
  return (
    <span
      onClick={onClick}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        cursor: "pointer",
        padding: "0 1px",
        borderRadius: "4px",
        background: isActive
          ? "color-mix(in srgb, var(--mantine-color-brand-6) 18%, transparent)"
          : "transparent",
        transition: "background 120ms ease",
        verticalAlign: "baseline",
        userSelect: "none",
      }}
    >
      <span
        className="zh-characters"
        style={{
          lineHeight: 1.5,
          borderBottom: isActive
            ? "2px solid var(--mantine-color-brand-6)"
            : "2px solid transparent",
          transition: "border-color 120ms ease",
        }}
      >
        {segment.text}
      </span>
      <span
        style={{
          fontSize: "0.6em",
          color: "var(--mantine-color-brand-6)",
          lineHeight: 1.3,
          whiteSpace: "nowrap",
          visibility: showPinyin ? "visible" : "hidden",
          height: showPinyin ? undefined : 0,
          overflow: "hidden",
        }}
      >
        {segment.word.pinyin}
      </span>
    </span>
  );
}

const HSK_COLOR: Record<number, "success" | "info" | "warning" | "danger"> = {
  1: "success",
  2: "success",
  3: "info",
  4: "info",
  5: "warning",
  6: "danger",
};

function GlossCard({ word }: { word: Word }): React.JSX.Element {
  return (
    <GMContainer variant="card" gap="sm">
      <GMContainer
        variant="row"
        gap="md"
        align="flex-start"
        justify="space-between"
      >
        <GMContainer variant="row" gap="md" align="center">
          <span
            className="zh-characters"
            style={{ fontSize: "2rem", lineHeight: 1, flexShrink: 0 }}
          >
            {word.chinese}
          </span>
          <GMContainer gap="xs">
            <GMText variant="body">{word.pinyin}</GMText>
            <GMText variant="secondary">{word.en}</GMText>
            <GMText variant="secondary">{word.vi}</GMText>
            {word.sino_vi && (
              <GMText variant="secondary">{`Sino-VI: ${word.sino_vi}`}</GMText>
            )}
          </GMContainer>
        </GMContainer>
        <GMContainer gap="xs" align="flex-end">
          {word.hsk && (
            <GMText variant="badge" color={HSK_COLOR[word.hsk] ?? "info"}>
              {`HSK ${word.hsk}`}
            </GMText>
          )}
          {word.types.length > 0 && (
            <GMText variant="badge">{word.types[0].replace("_", " ")}</GMText>
          )}
        </GMContainer>
      </GMContainer>
    </GMContainer>
  );
}

function VocabTable({ segments }: { segments: Segment[] }): React.JSX.Element {
  const words = useMemo(() => {
    const seen = new Set<string>();
    return segments
      .filter((s): s is WordSegment => s.type === "word")
      .filter((s) => {
        if (seen.has(s.word.chinese)) return false;
        seen.add(s.word.chinese);
        return true;
      })
      .sort((a, b) => (a.word.hsk ?? 99) - (b.word.hsk ?? 99));
  }, [segments]);

  if (words.length === 0) return <></>;

  return (
    <GMContainer gap="sm">
      <GMText variant="section_title">{`Vocabulary · ${words.length} words`}</GMText>
      <div style={{ overflowX: "auto" }}>
        <Table
          striped
          withColumnBorders
          withTableBorder
          style={{ fontSize: "0.875rem", minWidth: "480px" }}
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Chinese</Table.Th>
              <Table.Th>Pinyin</Table.Th>
              <Table.Th>English</Table.Th>
              <Table.Th>Vietnamese</Table.Th>
              <Table.Th>Sino-VI</Table.Th>
              <Table.Th>HSK</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {words.map((s) => (
              <Table.Tr key={s.word.chinese}>
                <Table.Td>
                  <span className="zh-characters" style={{ fontSize: "1.1em" }}>
                    {s.word.chinese}
                  </span>
                </Table.Td>
                <Table.Td>{s.word.pinyin}</Table.Td>
                <Table.Td>{s.word.en}</Table.Td>
                <Table.Td>{s.word.vi}</Table.Td>
                <Table.Td>{s.word.sino_vi ?? "—"}</Table.Td>
                <Table.Td>{s.word.hsk ?? "—"}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </div>
    </GMContainer>
  );
}

// +====================+
// | PASSAGE MODE       |
// +====================+

const SAMPLE_TEXTS: { title: string; level: number; text: string }[] = [
  {
    title: "你好",
    level: 1,
    text: "你好！我叫小明。我是学生。我学习中文。中文很有意思。我爱学习。",
  },
  {
    title: "早上好",
    level: 1,
    text: "早上好！今天是星期一。我去学校。学校很大。我有很多朋友。我们一起吃午饭。",
  },
  {
    title: "我的家",
    level: 2,
    text: "我家有四口人：爸爸、妈妈、姐姐和我。我们住在北京。爸爸是医生，妈妈是老师。我们都很喜欢看电影。每个周末，我们一起去公园散步。",
  },
  {
    title: "秋天",
    level: 2,
    text: "今天天气很好，阳光明媚。我和朋友们一起去爬山。山上有很多花，非常漂亮。我们在山顶拍了很多照片。下山的时候，我们很累，但也很开心。",
  },
  {
    title: "旅行",
    level: 3,
    text: "上个月，我去上海旅行了。上海是中国最大的城市之一。我参观了很多有名的地方，还吃了很多好吃的东西。上海的夜景非常漂亮，我拍了很多照片。以后我还想再去一次。",
  },
  {
    title: "健康生活",
    level: 3,
    text: "现代人的生活节奏越来越快，许多人忽视了健康的重要性。合理的饮食、规律的运动和充足的睡眠是保持健康的三个基本要素。每天坚持散步三十分钟，不仅可以增强体力，还能减轻工作带来的压力。",
  },
  {
    title: "环境保护",
    level: 4,
    text: "环境保护是当今世界面临的重要问题。随着经济的发展，工业污染越来越严重。我们每个人都应该从身边的小事做起，比如节约用水、减少使用塑料袋、多种树。保护环境，就是保护我们自己的未来。",
  },
  {
    title: "互联网",
    level: 4,
    text: "随着互联网的普及，人们的生活方式发生了巨大的变化。网上购物变得越来越方便，许多人选择在家里工作。社交媒体让世界各地的人可以实时联系，分享生活中的点点滴滴。这些变化既带来了便利，也引发了人们对数字依赖的担忧。",
  },
  {
    title: "人工智能",
    level: 5,
    text: "人工智能的迅速崛起正在深刻改变人类社会的各个领域。从医疗诊断到自动驾驶，从教育辅助到金融分析，智能算法已渗透进日常生活的方方面面。然而，技术的进步也带来了隐私泄露、就业替代等一系列伦理争议。如何在推动创新的同时保障公众利益，是各国政府与科技企业共同面临的挑战。",
  },
  {
    title: "城镇化",
    level: 5,
    text: "城镇化进程的加速推进，在推动经济增长的同时，也引发了一系列社会矛盾。大量农村人口涌入城市，导致住房紧张、交通拥堵、公共服务资源分配不均等问题日趋突出。如何在城镇化与可持续发展之间寻求平衡，已成为政策制定者亟待破解的核心课题。",
  },
  {
    title: "文化传承",
    level: 6,
    text: "文化是一个民族赖以生存与发展的精神根基。在全球化浪潮的冲击下，许多传统习俗与非物质文化遗产正面临消亡的困境。语言的式微尤为令人忧虑——一种语言的消失，意味着一套独特的世界观与认知体系的永久湮灭。因此，文化传承绝非单纯的怀旧情结，而是关乎人类文明多样性的战略抉择。唯有在现代语境中赋予传统以新的生命力，方能实现古今之间真正意义上的对话。",
  },
  {
    title: "独立思想",
    level: 6,
    text: "人之所以为人，在于其拥有超越本能的理性与悲悯。然而，历史一再表明，当集体意识被单一意识形态裹挟，个体的批判精神便极易沦为体制的牺牲品。真正的文明进步，不在于物质财富的积累，而在于每一个个体能否在多元碰撞中保持独立之人格、自由之思想。",
  },
];

function HskStats({ segments }: { segments: Segment[] }): React.JSX.Element {
  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    let unknown = 0;
    for (const seg of segments) {
      if (seg.type === "word") {
        const key = seg.word.hsk ? `HSK ${seg.word.hsk}` : "Other";
        counts[key] = (counts[key] ?? 0) + 1;
      } else if (/[一-鿿]/.test(seg.text)) {
        unknown++;
      }
    }
    if (unknown > 0) counts["Unknown"] = unknown;
    return counts;
  }, [segments]);

  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  if (total === 0) return <></>;

  const COLOR_MAP: Record<string, string> = {
    "HSK 1": "var(--mantine-color-success-6)",
    "HSK 2": "var(--mantine-color-success-6)",
    "HSK 3": "var(--mantine-color-info-6)",
    "HSK 4": "var(--mantine-color-info-6)",
    "HSK 5": "var(--mantine-color-warning-6)",
    "HSK 6": "var(--mantine-color-danger-6)",
    Unknown: "var(--gm-text-muted)",
    Other: "var(--gm-text-muted)",
  };
  const ORDER = [
    "HSK 1",
    "HSK 2",
    "HSK 3",
    "HSK 4",
    "HSK 5",
    "HSK 6",
    "Other",
    "Unknown",
  ];

  return (
    <GMContainer gap="xs">
      <GMText variant="section_title">Difficulty breakdown</GMText>
      <GMContainer variant="row" gap="xs" wrap>
        {Object.entries(stats)
          .sort(([a], [b]) => ORDER.indexOf(a) - ORDER.indexOf(b))
          .map(([key, count]) => (
            <span
              key={key}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
                padding: "0.2rem 0.5rem",
                borderRadius: "var(--mantine-radius-md)",
                fontSize: "0.75rem",
                fontWeight: 600,
                background: `color-mix(in srgb, ${COLOR_MAP[key] ?? "currentColor"} 15%, transparent)`,
                color: COLOR_MAP[key] ?? "var(--gm-text-primary)",
              }}
            >
              {key}
              <span style={{ opacity: 0.7 }}>·</span>
              {count}
            </span>
          ))}
      </GMContainer>
    </GMContainer>
  );
}

const READ_PREFILL_KEY = "zh-read-prefill";

async function pasteFromClipboard(set: (text: string) => void) {
  try {
    const text = await navigator.clipboard.readText();
    if (text) set(text);
  } catch {}
}

function PassageMode(): React.JSX.Element {
  const [mode, setMode] = useState<"input" | "reading">("input");
  const [inputText, setInputText] = useState("");
  const [activeWord, setActiveWord] = useState<Word | null>(null);

  useEffect(() => {
    const prefill = sessionStorage.getItem(READ_PREFILL_KEY);
    if (prefill) {
      sessionStorage.removeItem(READ_PREFILL_KEY);
      setInputText(prefill);
      setMode("reading");
    }
  }, []);
  const [showPinyin, setShowPinyin] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  const segments = useMemo(
    () => (mode === "reading" ? segmentText(inputText) : []),
    [mode, inputText],
  );

  function handleWordTap(word: Word) {
    const isNew = activeWord?.chinese !== word.chinese;
    setActiveWord(isNew ? word : null);
    if (isNew) speakChinese(word.chinese, undefined, 0.7);
  }

  if (mode === "reading") {
    return (
      <GMContainer grow>
        <GMContainer
          variant="row"
          px="sm"
          py="xs"
          bb
          gap="sm"
          justify="space-between"
        >
          <GMButton
            variant="icon"
            onClick={() => {
              setMode("input");
              setActiveWord(null);
              setSpeaking(false);
              window.speechSynthesis?.cancel();
            }}
            tooltip="Back"
          >
            <GMIcon name="ChevronLeft" />
          </GMButton>
          <GMContainer variant="row" gap="sm">
            <GMButton
              variant="icon"
              onClick={() => setShowPinyin((p) => !p)}
              tooltip={showPinyin ? "Hide pinyin" : "Show pinyin"}
            >
              <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>pīn</span>
            </GMButton>
            <GMButton
              variant="icon"
              onClick={() => {
                if (speaking) {
                  window.speechSynthesis?.cancel();
                  setSpeaking(false);
                } else {
                  setSpeaking(true);
                  speakChinese(inputText, () => setSpeaking(false));
                }
              }}
              tooltip={speaking ? "Stop" : "Play passage"}
            >
              <GMIcon name={speaking ? "PlayerPause" : "PlayerPlay"} />
            </GMButton>
          </GMContainer>
        </GMContainer>

        <GMContainer grow scrollable px="sm" py="sm" gap="lg">
          {activeWord && <GlossCard word={activeWord} />}
          <div
            style={{
              lineHeight: showPinyin ? 3.0 : 2,
              fontSize: "1.2rem",
              transition: "line-height 200ms ease",
            }}
          >
            {segments.map((seg, i) => {
              if (seg.type === "word")
                return (
                  <WordToken
                    key={i}
                    segment={seg}
                    isActive={activeWord?.chinese === seg.word.chinese}
                    showPinyin={showPinyin}
                    onClick={() => handleWordTap(seg.word)}
                  />
                );
              if (seg.text === "\n") return <br key={i} />;
              return (
                <span key={i} style={{ color: "var(--gm-text-primary)" }}>
                  {seg.text}
                </span>
              );
            })}
          </div>
          <div
            style={{
              borderTop: "1px solid var(--mantine-color-default-border)",
              paddingTop: "1rem",
            }}
          >
            <HskStats segments={segments} />
          </div>
          <VocabTable segments={segments} />
        </GMContainer>
      </GMContainer>
    );
  }

  return (
    <GMContainer px="sm" gap="md" grow scrollable>
      <GMContainer gap="xs">
        <GMContainer variant="row" justify="space-between" align="center">
          <GMText variant="section_title">Paste Chinese text</GMText>
          <GMButton
            variant="icon"
            onClick={() => pasteFromClipboard(setInputText)}
            tooltip="Paste from clipboard"
          >
            <GMIcon name="ClipboardText" size="sm" />
          </GMButton>
        </GMContainer>
        <Textarea
          placeholder="e.g. 今天天气很好。"
          value={inputText}
          onChange={(e) => setInputText(e.currentTarget.value)}
          autosize
          minRows={3}
          maxRows={5}
        />
      </GMContainer>
      <GMButton
        variant="primary"
        onClick={() => {
          if (inputText.trim()) {
            setMode("reading");
            setActiveWord(null);
          }
        }}
        disabled={!inputText.trim()}
      >
        Start reading →
      </GMButton>

      {/* Features guide */}
      <GMContainer gap="xs">
        <GMText variant="section_title">Features</GMText>
        <GMContainer gap="xs">
          {[
            "Tap any word → pinyin · EN · VI · Sino-VI gloss",
            "Word pronunciation plays automatically on tap",
            "Play full passage via text-to-speech",
            "Toggle pinyin annotations on/off",
            "Vocabulary table with HSK levels at the bottom",
          ].map((hint) => (
            <GMContainer key={hint} variant="row" gap="sm" align="flex-start">
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

      {/* Sample texts — scrollable list */}
      <GMContainer gap="xs">
        <GMText variant="section_title">Or try a sample</GMText>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.375rem",
          }}
        >
          {SAMPLE_TEXTS.map((sample) => (
            <GMButton
              key={sample.title}
              variant="row"
              withBorder
              onClick={() => setInputText(sample.text)}
            >
              <GMContainer>
                <GMContainer
                  variant="row"
                  justify="space-between"
                  align="center"
                >
                  <GMText>{sample.title}</GMText>
                  <GMText
                    variant="badge"
                    color={HSK_COLOR[sample.level] ?? "info"}
                  >
                    {`HSK ${sample.level}`}
                  </GMText>
                </GMContainer>
                <GMText variant="secondary">
                  {sample.text.slice(0, 50) + "…"}
                </GMText>
              </GMContainer>
            </GMButton>
          ))}
        </div>
      </GMContainer>
    </GMContainer>
  );
}

// +====================+
// | READ PAGE          |
// +====================+

function ReadPage(): React.JSX.Element {
  return (
    <GMContainer fullHeight>
      <Header />
      <PassageMode />
    </GMContainer>
  );
}

export default ReadPage;
