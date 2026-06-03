/**
 * Color system — source of truth & index
 *
 * Two other files depend on this:
 *   globals.css  →  --gm-* CSS variables (neutrals). Values must match GM_NEUTRAL_TOKENS.
 *   theme.ts     →  createTheme({ colors: GM_PALETTES })
 *
 * What to write in a component:
 *   Neutral bg / text / border  →  var(--gm-bg) / var(--gm-text-primary) / var(--gm-border)
 *   Brand (primary CTA)         →  color="brand"    or  --mantine-color-brand-6
 *   Error / destructive         →  color="danger"   or  --mantine-color-danger-6
 *   Warning                     →  color="warning"  or  --mantine-color-warning-6
 *   Confirmed / active          →  color="success"  or  --mantine-color-success-6
 *   Informational               →  color="info"     or  --mantine-color-info-6
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hsl(h: number, s: number, l: number): string {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

// ─── 1. Neutrals ──────────────────────────────────────────────────────────────

/**
 * Background, text, and border values for light and dark mode.
 * globals.css [data-mantine-color-scheme] blocks MUST match these values exactly.
 */
const GM_NEUTRAL_TOKENS = {
  dark: {
    bgDark: hsl(0, 0, 0),
    bg: hsl(0, 0, 5),
    bgLight: hsl(0, 0, 10),
    border: hsl(0, 0, 16),
    text: hsl(0, 0, 95),
    textMuted: hsl(0, 0, 70),
  },
  light: {
    bgDark: hsl(0, 0, 90),
    bg: hsl(0, 0, 95),
    bgLight: hsl(0, 0, 100),
    border: hsl(0, 0, 84),
    text: hsl(0, 0, 5),
    textMuted: hsl(0, 0, 30),
  },
} as const;

// ─── 2. Semantic color bases ───────────────────────────────────────────────────

const BASES = {
  brand: { h: 359, s: 73 }, // cool crimson — primary action color
  danger: { h: 15, s: 84 }, // warm orange-red — error/destructive
  warning: { h: 38, s: 90 },
  success: { h: 142, s: 52 },
  info: { h: 209, s: 78 },
} as const;

// ─── 3. Palette builder ────────────────────────────────────────────────────────

function makeMantinePalette(
  h: number,
  s: number,
  baseL = 50,
): [string, string, string, string, string, string, string, string, string, string] {
  return [
    hsl(h, s, 97),
    hsl(h, s, 93),
    hsl(h, s, 85),
    hsl(h, s, 75),
    hsl(h, s, 65),
    hsl(h, s, 57),
    hsl(h, s, baseL), // 6 — base solid colour
    hsl(h, s, 42),
    hsl(h, s, 35),
    hsl(h, s, 28),
  ];
}

// ─── 4. Semantic palettes ──────────────────────────────────────────────────────

const GM_PALETTES = {
  brand: makeMantinePalette(BASES.brand.h, BASES.brand.s, 46),
  danger: makeMantinePalette(BASES.danger.h, BASES.danger.s),
  warning: makeMantinePalette(BASES.warning.h, BASES.warning.s),
  success: makeMantinePalette(BASES.success.h, BASES.success.s),
  info: makeMantinePalette(BASES.info.h, BASES.info.s),
};

// ─── 5. Utilities ─────────────────────────────────────────────────────────────

type SemanticColor = "brand" | "danger" | "warning" | "success" | "info";

/**
 * Resolves a color string to a CSS value for use in inline style props.
 * SemanticColor ("brand", "danger", …) → var(--mantine-color-{name}-6)
 * CSS passthrough → returned as-is
 */
function resolveColor(color: string): string {
  if (
    color === "currentColor" ||
    color.startsWith("var(") ||
    color.startsWith("#") ||
    color.startsWith("rgb") ||
    color.startsWith("hsl") ||
    color.startsWith("color-mix")
  ) {
    return color;
  }
  const [name, shade] = color.split(".");
  return shade ? `var(--mantine-color-${name}-${shade})` : `var(--mantine-color-${name}-6)`;
}

export { GM_NEUTRAL_TOKENS, GM_PALETTES, resolveColor, type SemanticColor };
