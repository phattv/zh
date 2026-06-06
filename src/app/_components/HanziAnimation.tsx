"use client";

import HanziWriter from "hanzi-writer";
import { useEffect, useRef, useState } from "react";

const SIZE = 56;
export const HANZI_CHAR_SIZE = SIZE;

function charDataLoader(
  char: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onLoad: (data: any) => void,
  onError: (err: unknown) => void,
) {
  fetch(`/api/hanzi-data/${encodeURIComponent(char)}`)
    .then((r) => {
      if (!r.ok) throw new Error("not found");
      return r.json();
    })
    .then(onLoad)
    .catch(onError);
}

function HanziChar({
  char,
  onComplete,
}: {
  char: string;
  onComplete?: () => void;
}): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriter | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = "";
    setMissing(false);

    // Resolve CSS variable to rgb(...) — HanziWriter's parser rejects HSL strings
    const probe = document.createElement("span");
    probe.style.color = "var(--mantine-color-brand-6)";
    probe.style.position = "fixed";
    probe.style.visibility = "hidden";
    document.body.appendChild(probe);
    const strokeColor = getComputedStyle(probe).color || "#5c7cfa";
    document.body.removeChild(probe);

    const writer = HanziWriter.create(el, char, {
      width: SIZE,
      height: SIZE,
      padding: 4,
      showOutline: true,
      outlineColor: "rgba(128,128,128,0.25)",
      strokeColor,
      strokeAnimationSpeed: 3,
      delayBetweenStrokes: 50,
      charDataLoader: (c, onLoad, onError) =>
        charDataLoader(c, onLoad, (err) => {
          setMissing(true);
          onError(err);
        }),
    });

    writerRef.current = writer;
    writer.animateCharacter({ onComplete: () => onCompleteRef.current?.() });

    return () => {
      writerRef.current = null;
      if (el) el.innerHTML = "";
    };
  }, [char]);

  if (missing) {
    return (
      <span
        className="zh-characters"
        style={{
          width: SIZE,
          height: SIZE,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {char}
      </span>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: "inline-block",
        width: SIZE,
        height: SIZE,
        flexShrink: 0,
      }}
    />
  );
}

function HanziAnimation({
  word,
  onComplete,
}: {
  word: string;
  onComplete?: () => void;
}): React.JSX.Element {
  const chars = [...word];
  const doneRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  function handleCharDone() {
    doneRef.current += 1;
    if (doneRef.current === chars.length) {
      doneRef.current = 0;
      onCompleteRef.current?.();
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
      {chars.map((char, i) => (
        <HanziChar key={`${char}-${i}`} char={char} onComplete={handleCharDone} />
      ))}
    </div>
  );
}

export { HanziAnimation };
