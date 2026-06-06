"use client";

import { resolveColor, type SemanticColor } from "@/constants/colors";
import { Code, Text, Title } from "@mantine/core";

// +--------+
// | TYPES  |
// +--------+

type GMTextCoreVariant =
  | "title"
  | "subtitle"
  | "body"
  | "secondary"
  | "section_title";
type GMTextExtendedVariant = "stat" | "code" | "badge";
type GMTextVariant = GMTextCoreVariant | GMTextExtendedVariant;

type VariantStyle = {
  fz: string;
  fw: number;
  color: string;
  lh?: number;
  letterSpacing?: string;
  textTransform?: React.CSSProperties["textTransform"];
};

type GMTextProps = {
  variant?: GMTextVariant;
  children: string;
  truncate?: boolean;
  inline?: boolean;
  color?: SemanticColor;
  textAlign?: React.CSSProperties["textAlign"];
  /** badge only — renders a muted key prefix: "[label · value]" */
  label?: string;
  /** Replaces the [highlight] placeholder in children with brand-colored bold text. */
  highlight?: string;
};

// +-----------+
// | CONSTANTS |
// +-----------+

const PRIMARY = "var(--gm-text-primary)";
const MUTED = "var(--gm-text-muted)";

const VARIANT_STYLE: Record<GMTextCoreVariant | "stat" | "code", VariantStyle> =
  {
    title: { fz: "1.25rem", fw: 700, color: PRIMARY },
    subtitle: { fz: "1rem", fw: 400, color: MUTED },
    body: { fz: "1rem", fw: 400, color: PRIMARY },
    secondary: { fz: "0.875rem", fw: 400, color: MUTED },
    section_title: {
      fz: "0.75rem",
      fw: 700,
      color: MUTED,
      lh: 2,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    },
    stat: {
      fz: "2rem",
      fw: 700,
      color: PRIMARY,
      lh: 1.1,
      letterSpacing: "-0.03em",
    },
    code: { fz: "0.875rem", fw: 400, color: PRIMARY },
  };

// +---------+
// | HELPERS |
// +---------+

function renderHighlight(text: string, highlight: string): React.ReactNode {
  const [before, after] = text.split(/\[highlight\]/i);
  return (
    <>
      {before}
      <span style={{ color: "var(--mantine-color-brand-6)", fontWeight: 700 }}>
        {highlight}
      </span>
      {after}
    </>
  );
}

// +-----------+
// | COMPONENT |
// +-----------+

/**
 * GMText — read-only text. Never interactive.
 *
 * Variants: title | subtitle | body | secondary | section_title | stat | badge | code
 * Default: body
 *
 * children must be a plain string (not ReactNode).
 */
function GMText({
  variant = "body",
  children,
  highlight,
  truncate,
  inline,
  color,
  label,
  textAlign,
}: GMTextProps): JSX.Element {
  const text = children;

  if (variant === "badge") {
    const resolvedColor = color ? resolveColor(color) : null;
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.25rem",
          padding: "0.25rem 0.5rem",
          borderRadius: "var(--mantine-radius-md)",
          fontSize: "0.75rem",
          fontWeight: 700,
          lineHeight: 1,
          whiteSpace: "nowrap",
          ...(resolvedColor
            ? {
                background: `color-mix(in srgb, ${resolvedColor} 15%, transparent)`,
                color: resolvedColor,
              }
            : {
                background: "var(--mantine-color-default)",
                border: "1px solid var(--mantine-color-default-border)",
                color: PRIMARY,
              }),
        }}
      >
        {label && (
          <span style={{ color: MUTED, fontWeight: 400 }}>{label} ·</span>
        )}
        <span>{text}</span>
      </span>
    );
  }

  if (variant === "code") {
    const { fz, fw, color: codeColor } = VARIANT_STYLE.code;
    const resolvedCodeColor = color ? resolveColor(color) : codeColor;
    const codeStyle = {
      fontSize: fz,
      fontWeight: fw,
      color: resolvedCodeColor,
    };
    return inline ? (
      <Code style={codeStyle}>{text}</Code>
    ) : (
      <Code
        block
        style={{
          ...codeStyle,
          border: "1px solid var(--mantine-color-default-border)",
        }}
      >
        {text}
      </Code>
    );
  }

  const highlightedText = highlight ? renderHighlight(text, highlight) : text;
  const {
    fz,
    fw,
    color: variantColor,
    lh = 1.4,
    letterSpacing,
    textTransform,
  } = VARIANT_STYLE[variant];
  const textColor = color ? resolveColor(color) : variantColor;

  if (variant === "title") {
    return (
      <Title
        order={2}
        fw={fw}
        fz={fz}
        lh={lh}
        style={{
          color: textColor,
          textAlign: textAlign ?? "left",
          ...(truncate && {
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }),
        }}
      >
        {highlightedText}
      </Title>
    );
  }

  return (
    <Text
      fw={fw}
      fz={fz}
      lh={lh}
      truncate={truncate}
      component={inline ? "span" : "p"}
      style={{
        color: textColor,
        letterSpacing,
        textTransform,
        ...(textAlign ? { textAlign } : {}),
      }}
    >
      {highlightedText}
    </Text>
  );
}

export { GMText };
