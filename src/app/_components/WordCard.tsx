"use client";

import { GMButton } from "@/components/GMButton";
import { GMContainer } from "@/components/GMContainer";
import { GMText } from "@/components/GMText";
import { type Word } from "@/data/words";
import { useState } from "react";
import { HANZI_CHAR_SIZE, HanziAnimation } from "./HanziAnimation";

function speak(text: string, onDone: () => void) {
  const synth = window.speechSynthesis;
  if (!synth) return;
  synth.cancel();
  // cancel() is async with no callback — wait before queuing the next utterance
  setTimeout(() => {
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "zh-CN";
    utt.rate = 0.85;
    utt.onend = onDone;
    utt.onerror = onDone;
    synth.speak(utt);
  }, 80);
}

function WordCard({ word }: { word: Word }): React.JSX.Element {
  const [speaking, setSpeaking] = useState(false);
  const [animated, setAnimated] = useState(false);

  function handleSpeak() {
    if (speaking) return;
    setSpeaking(true);
    speak(word.chinese, () => setSpeaking(false));
  }

  return (
    <GMContainer variant="card" gap="sm" px="sm" py="sm" fullHeight>
      <GMContainer variant="row" justify="space-between" align="flex-start">
        <GMContainer>
          <div
            onClick={() => setAnimated((a) => !a)}
            style={{ height: HANZI_CHAR_SIZE, display: "flex", alignItems: "center", cursor: "pointer" }}
          >
            {animated ? (
              <HanziAnimation word={word.chinese} />
            ) : (
              <span className="zh-characters">{word.chinese}</span>
            )}
          </div>
          <GMContainer variant="row" align="center" gap="xs">
            <GMButton variant="text" onClick={handleSpeak} disabled={speaking}>
              {word.pinyin}
            </GMButton>
          </GMContainer>
        </GMContainer>
      </GMContainer>
      <GMContainer>
        <GMText>{`[${(word.sino_vi ?? "—").toUpperCase()}]`}</GMText>
        <GMText truncate>{word.vi}</GMText>
      </GMContainer>
      <GMContainer>
        <GMText>{`[${word.types.join(", ")}]`}</GMText>
        <GMText truncate>{word.en}</GMText>
      </GMContainer>
    </GMContainer>
  );
}

export { WordCard };
