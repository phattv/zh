"use client";

import { Box, Paper } from "@mantine/core";
import { type CSSProperties, type ReactNode } from "react";
import { SPACING, type SpacingValue } from "@/constants/sizes";

/**
 * GMContainer — arrange and group content.
 * Never interactive — no onClick. Wrap in GMButton variant="row" if the whole area is tappable.
 *
 * Variants: col | row | card | page
 * Default: col
 */

type GMContainerVariant = "page" | "col" | "row" | "card";

type GMContainerProps = {
  variant?: GMContainerVariant;
  children?: ReactNode;

  // ── Spacing ──────────────────────────────────────────────────────────────────
  gap?: SpacingValue;
  px?: SpacingValue;
  py?: SpacingValue;

  // ── Flex layout ──────────────────────────────────────────────────────────────
  grow?: boolean;
  justify?: CSSProperties["justifyContent"];
  align?: CSSProperties["alignItems"];
  wrap?: boolean;

  // ── Borders ───────────────────────────────────────────────────────────────────
  bb?: boolean;
  bt?: boolean;
  br?: boolean;
  bl?: boolean;

  // ── Modifiers ─────────────────────────────────────────────────────────────────
  fullHeight?: boolean;
  scrollable?: boolean;
  dim?: boolean;
};

const BORDER = "1px solid var(--mantine-color-default-border)";

function GMContainer({
  variant = "col",
  children,
  gap,
  px,
  py,
  grow = false,
  justify,
  align,
  wrap = false,
  bb,
  bt,
  br,
  bl,
  fullHeight = false,
  scrollable = false,
  dim = false,
}: GMContainerProps): React.JSX.Element {
  const borderStyle = {
    ...(bb ? { borderBottom: BORDER } : {}),
    ...(bt ? { borderTop: BORDER } : {}),
    ...(br ? { borderRight: BORDER } : {}),
    ...(bl ? { borderLeft: BORDER } : {}),
  };

  if (variant === "page") {
    return (
      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          padding: SPACING.md,
          gap: SPACING[gap ?? "md"],
          ...(grow ? { flex: 1, minWidth: 0 } : {}),
          ...(fullHeight ? { height: "100%" } : {}),
          ...(dim ? { opacity: 0.5 } : {}),
          ...borderStyle,
        }}
      >
        {children}
      </Box>
    );
  }

  if (variant === "card") {
    return (
      <Paper
        withBorder
        shadow="md"
        radius="md"
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          padding: `${SPACING[py ?? "md"]} ${SPACING[px ?? "md"]}`,
          gap: SPACING[gap ?? "md"],
          ...(grow ? { flex: 1, minWidth: 0 } : {}),
          ...(fullHeight ? { height: "100%" } : {}),
          ...(dim ? { opacity: 0.5 } : {}),
          ...borderStyle,
        }}
      >
        {children}
      </Paper>
    );
  }

  if (variant === "row") {
    return (
      <Box
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: justify ?? "flex-start",
          alignItems: align ?? "center",
          flexWrap: wrap ? "wrap" : "nowrap",
          padding: `${SPACING[py ?? "none"]} ${SPACING[px ?? "none"]}`,
          gap: SPACING[gap ?? "md"],
          ...(grow ? { flex: 1, minWidth: 0 } : {}),
          ...(fullHeight ? { height: "100%" } : {}),
          ...(scrollable ? { overflowX: "auto", scrollbarWidth: "none" } : {}),
          ...(dim ? { opacity: 0.5 } : {}),
          ...borderStyle,
        }}
      >
        {children}
      </Box>
    );
  }

  // col (default)
  return (
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: justify ?? "flex-start",
        alignItems: align ?? "stretch",
        flexWrap: wrap ? "wrap" : "nowrap",
        padding: `${SPACING[py ?? "none"]} ${SPACING[px ?? "none"]}`,
        gap: SPACING[gap ?? "none"],
        ...(grow ? { flex: 1, minWidth: 0 } : {}),
        ...(fullHeight ? { height: "100%" } : {}),
        ...(scrollable ? { overflowY: "auto", scrollbarWidth: "none" } : {}),
        ...(dim ? { opacity: 0.5 } : {}),
        ...borderStyle,
      }}
    >
      {children}
    </Box>
  );
}

export { GMContainer };
