"use client";

import { GMButton } from "@/components/GMButton";
import { GMContainer } from "@/components/GMContainer";
import { GMText } from "@/components/GMText";
import { useEffect, useRef, useState } from "react";

// [char, strokeCount, dir0, dir1, ...] — direction 0=E,1=SE,2=S,3=SW,4=W,5=NW,6=N,7=NE
type HanziEntry = [string, number, ...number[]];

type Stroke = [number, number][];

const CSS_SIZE = 200;

// Direction in screen coords (Y-down): 0=E,1=SE,2=S,3=SW,4=W,5=NW,6=N,7=NE
function strokeDir(stroke: Stroke): number {
  if (stroke.length < 2) return -1;
  const [x1, y1] = stroke[0];
  const [x2, y2] = stroke[stroke.length - 1];
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return -1;
  const angle = Math.atan2(dy, dx);
  const deg = ((angle * 180) / Math.PI + 360) % 360;
  return Math.round(deg / 45) % 8;
}

function dirDist(a: number, b: number): number {
  if (a < 0 || b < 0) return 0; // skip invalid
  const d = Math.abs(a - b);
  return Math.min(d, 8 - d);
}

function findCandidates(
  index: HanziEntry[],
  strokes: Stroke[],
  limit = 8,
): string[] {
  if (strokes.length === 0) return [];
  const drawnDirs = strokes.map(strokeDir);
  const n = strokes.length;

  const scored: [string, number][] = [];
  for (const entry of index) {
    const entryStrokeCount = entry[1];
    if (entryStrokeCount < n) continue; // drawn more strokes than this char has
    const entryDirs = entry.slice(2) as number[];

    // Score the matched portion
    let score = 0;
    for (let i = 0; i < n; i++) {
      score += Math.max(0, 3 - dirDist(drawnDirs[i], entryDirs[i]));
    }
    const normalised = score / (3 * n);
    // Bonus for exact total stroke count
    const bonus = entryStrokeCount === n ? 0.15 : 0;
    scored.push([entry[0], normalised + bonus]);
  }

  scored.sort((a, b) => b[1] - a[1]);
  return scored.slice(0, limit).map(([c]) => c);
}

function DrawingInput({
  onSelect,
}: {
  onSelect: (char: string) => void;
}): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<Stroke>([]);
  const strokesRef = useRef<Stroke[]>([]);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [candidates, setCandidates] = useState<string[]>([]);
  const [strokeCount, setStrokeCount] = useState(0);
  const [index, setIndex] = useState<HanziEntry[] | null>(null);
  const [loading, setLoading] = useState(true);

  // Load recognition index
  useEffect(() => {
    fetch("/hanzi-index/index.json")
      .then((r) => r.json())
      .then((data: HanziEntry[]) => {
        setIndex(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Set up canvas with DPR scaling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CSS_SIZE * dpr;
    canvas.height = CSS_SIZE * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctxRef.current = ctx;
    drawBackground(ctx);
  }, []);

  function drawBackground(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, CSS_SIZE, CSS_SIZE);
    // Grid guides
    ctx.strokeStyle = "rgba(128,128,128,0.25)";
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(CSS_SIZE / 2, 0);
    ctx.lineTo(CSS_SIZE / 2, CSS_SIZE);
    ctx.moveTo(0, CSS_SIZE / 2);
    ctx.lineTo(CSS_SIZE, CSS_SIZE / 2);
    ctx.moveTo(0, 0);
    ctx.lineTo(CSS_SIZE, CSS_SIZE);
    ctx.moveTo(CSS_SIZE, 0);
    ctx.lineTo(0, CSS_SIZE);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function redrawAll() {
    const ctx = ctxRef.current;
    if (!ctx) return;
    drawBackground(ctx);
    ctx.strokeStyle = "var(--mantine-color-brand-6)";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const stroke of strokesRef.current) {
      if (stroke.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0][0], stroke[0][1]);
      for (let i = 1; i < stroke.length; i++)
        ctx.lineTo(stroke[i][0], stroke[i][1]);
      ctx.stroke();
    }
  }

  function getPoint(
    e: React.MouseEvent | React.TouchEvent,
  ): [number, number] | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CSS_SIZE / rect.width;
    const scaleY = CSS_SIZE / rect.height;
    if ("touches" in e) {
      const t = e.touches[0] ?? e.changedTouches[0];
      if (!t) return null;
      return [
        (t.clientX - rect.left) * scaleX,
        (t.clientY - rect.top) * scaleY,
      ];
    }
    return [(e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY];
  }

  function onPointerDown(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const pt = getPoint(e);
    if (!pt) return;
    isDrawingRef.current = true;
    currentStrokeRef.current = [pt];
    const ctx = ctxRef.current;
    if (ctx) {
      ctx.strokeStyle = "var(--mantine-color-brand-6)";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(pt[0], pt[1]);
      ctx.lineTo(pt[0] + 0.1, pt[1]);
      ctx.stroke();
    }
  }

  function onPointerMove(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    const pt = getPoint(e);
    if (!pt) return;
    const prev = currentStrokeRef.current;
    if (prev.length > 0) {
      const ctx = ctxRef.current;
      if (ctx) {
        const last = prev[prev.length - 1];
        ctx.strokeStyle = "var(--mantine-color-brand-6)";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(last[0], last[1]);
        ctx.lineTo(pt[0], pt[1]);
        ctx.stroke();
      }
    }
    currentStrokeRef.current = [...prev, pt];
  }

  function onPointerUp(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const stroke = currentStrokeRef.current;
    currentStrokeRef.current = [];
    if (stroke.length < 2) return;

    strokesRef.current = [...strokesRef.current, stroke];
    const n = strokesRef.current.length;
    setStrokeCount(n);

    if (index) {
      setCandidates(findCandidates(index, strokesRef.current));
    }
  }

  function handleUndo() {
    strokesRef.current = strokesRef.current.slice(0, -1);
    const n = strokesRef.current.length;
    setStrokeCount(n);
    redrawAll();
    setCandidates(
      n > 0 && index ? findCandidates(index, strokesRef.current) : [],
    );
  }

  function handleClear() {
    strokesRef.current = [];
    setStrokeCount(0);
    redrawAll();
    setCandidates([]);
  }

  function handleSelect(char: string) {
    handleClear();
    onSelect(char);
  }

  return (
    <GMContainer gap="xs" px="sm" py="sm">
      <GMContainer variant="row" gap="sm" align="flex-start">
        {/* Drawing canvas */}
        <canvas
          ref={canvasRef}
          style={{
            width: CSS_SIZE,
            height: CSS_SIZE,
            flexShrink: 0,
            borderRadius: "0.5rem",
            border: "1px solid var(--mantine-color-default-border)",
            touchAction: "none",
            cursor: "crosshair",
            background: "var(--mantine-color-default)",
          }}
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onMouseLeave={onPointerUp}
          onTouchStart={onPointerDown}
          onTouchMove={onPointerMove}
          onTouchEnd={onPointerUp}
        />

        {/* Right column: controls + candidates */}
        <GMContainer grow gap="xs">
          <GMContainer variant="row" gap="xs">
            <GMButton variant="icon" tooltip="Undo last stroke" onClick={handleUndo}>
              ↩
            </GMButton>
            <GMButton variant="icon" tooltip="Clear" onClick={handleClear}>
              ✕
            </GMButton>
          </GMContainer>
          {loading && <GMText variant="secondary">Loading…</GMText>}
          {!loading && candidates.length === 0 && (
            <GMText variant="secondary">
              {strokeCount === 0 ? "Draw a character" : "Keep drawing…"}
            </GMText>
          )}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.25rem",
            }}
          >
            {candidates.map((char) => (
              <button
                key={char}
                onClick={() => handleSelect(char)}
                style={{
                  padding: "0.4rem 0.2rem",
                  background: "var(--mantine-color-default)",
                  border: "1px solid var(--mantine-color-default-border)",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  fontSize: "1.4rem",
                  lineHeight: 1,
                  color: "var(--mantine-color-text)",
                  fontFamily: "inherit",
                  textAlign: "center",
                }}
              >
                {char}
              </button>
            ))}
          </div>
        </GMContainer>
      </GMContainer>
    </GMContainer>
  );
}

export { DrawingInput };
