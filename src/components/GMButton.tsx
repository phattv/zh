"use client";

import {
  ActionIcon,
  Anchor,
  type BoxProps,
  Button,
  Indicator,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import Link from "next/link";
import { type ReactElement, type ReactNode, useEffect, useRef, useState } from "react";
import { SPACING } from "@/constants/sizes";
import { type GMIconProps } from "./GMIcon";

// +--------+
// | TYPES  |
// +--------+

type GMButtonVariant =
  | "primary"
  | "secondary"
  | "confirm"
  | "chip"
  | "icon"
  | "link"
  | "text"
  | "row"
  | "tab";

type GMStyleProp = BoxProps["style"];

type GMButtonSharedProps = {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: ReactElement<GMIconProps>;
  active?: boolean;
  indicator?: boolean;
  grow?: boolean;
  href?: string;
  withBorder?: boolean;
};

type GMButtonProps =
  | (GMButtonSharedProps & { variant: "icon"; children: ReactNode; tooltip: string })
  | (GMButtonSharedProps & { variant: "row"; children: ReactNode; tooltip?: string })
  | (GMButtonSharedProps & { variant: "link"; href: string; children: string; tooltip?: string })
  | (GMButtonSharedProps & {
      variant?: Exclude<GMButtonVariant, "icon" | "row" | "link">;
      children: string;
      tooltip?: string;
    });

// +-----------+
// | CONSTANTS |
// +-----------+

const PADDING = {
  paddingTop: SPACING.sm,
  paddingBottom: SPACING.sm,
  paddingLeft: SPACING.md,
  paddingRight: SPACING.md,
};

// +---------+
// | HELPERS |
// +---------+

function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase());
}

function wrapWithTooltip(el: JSX.Element, tooltip?: string): JSX.Element {
  return tooltip ? (
    <Tooltip label={tooltip} withArrow>
      {el}
    </Tooltip>
  ) : (
    el
  );
}

function wrapWithIndicator(el: JSX.Element, indicator?: boolean): JSX.Element {
  return indicator ? (
    <Indicator color="brand" inline processing>
      {el}
    </Indicator>
  ) : (
    el
  );
}

// +-----------+
// | COMPONENT |
// +-----------+

/**
 * GMButton — entry point for every user action.
 *
 * Variants: primary | secondary | confirm | chip | icon | row | link | text | tab
 * Default: primary
 */
function GMButton({
  variant = "primary",
  children,
  onClick,
  disabled = false,
  loading = false,
  tooltip,
  leftIcon,
  active = false,
  indicator,
  grow,
  href,
  withBorder,
}: GMButtonProps): JSX.Element {
  const resolvedStyle: GMStyleProp = grow ? { flex: 1 } : undefined;
  const textOrNode = typeof children === "string" ? toTitleCase(children) : children;
  const [confirming, setConfirming] = useState(false);
  const [confirmCountdown, setConfirmCountdown] = useState(3);
  const resetTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearInterval(resetTimerRef.current);
    };
  }, []);

  // --- icon ---
  if (variant === "icon") {
    return wrapWithIndicator(
      wrapWithTooltip(
        <ActionIcon
          variant="default"
          size={36}
          disabled={disabled}
          loading={loading}
          onClick={onClick}
          style={resolvedStyle}
        >
          {textOrNode}
        </ActionIcon>,
        tooltip,
      ),
      indicator,
    );
  }

  // --- chip ---
  if (variant === "chip") {
    return wrapWithIndicator(
      wrapWithTooltip(
        <Button
          color={active ? "brand" : undefined}
          variant={active ? "filled" : "default"}
          radius="xl"
          disabled={disabled}
          leftSection={leftIcon}
          styles={{ root: PADDING }}
          style={resolvedStyle}
          onClick={onClick}
        >
          {textOrNode}
        </Button>,
        tooltip,
      ),
      indicator,
    );
  }

  // --- row ---
  if (variant === "row") {
    const rowStyle: GMStyleProp = {
      display: "block",
      width: "100%",
      textAlign: "left",
      borderRadius: "0.5rem",
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "background-color 120ms ease, transform 40ms ease",
      opacity: disabled ? 0.5 : undefined,
      pointerEvents: disabled ? "none" : undefined,
      border: withBorder ? "1px solid var(--mantine-color-default-border)" : undefined,
      ...PADDING,
      ...(grow ? { flex: 1 } : {}),
    };

    const content = href ? (
      <UnstyledButton
        component={Link}
        href={href}
        onClick={onClick}
        style={rowStyle}
        className="gm-row-button"
      >
        {textOrNode}
      </UnstyledButton>
    ) : (
      <UnstyledButton
        onClick={disabled ? undefined : onClick}
        style={rowStyle}
        className="gm-row-button"
      >
        {textOrNode}
      </UnstyledButton>
    );

    return wrapWithIndicator(wrapWithTooltip(content, tooltip), indicator);
  }

  // --- link ---
  if (variant === "link") {
    return wrapWithIndicator(
      wrapWithTooltip(
        <Anchor component={Link} href={href!} onClick={onClick} style={resolvedStyle}>
          {textOrNode}
        </Anchor>,
        tooltip,
      ),
      indicator,
    );
  }

  // --- text ---
  if (variant === "text") {
    return wrapWithIndicator(
      wrapWithTooltip(
        <UnstyledButton
          onClick={disabled ? undefined : onClick}
          disabled={disabled}
          style={{
            color: "var(--mantine-color-brand-6)",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
            ...resolvedStyle,
          }}
        >
          {textOrNode}
        </UnstyledButton>,
        tooltip,
      ),
      indicator,
    );
  }

  // --- tab ---
  if (variant === "tab") {
    return (
      <UnstyledButton
        onClick={onClick}
        disabled={disabled}
        className="gm-tab-button"
        style={{
          ...PADDING,
          color: active ? "var(--mantine-color-brand-6)" : "var(--gm-text-muted)",
          borderBottom: active ? "1px solid var(--mantine-color-brand-6)" : "1px solid transparent",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          flexShrink: 0,
          whiteSpace: "nowrap",
          transition: "color 120ms ease, border-color 120ms ease, background-color 120ms ease",
          ...(grow ? { flex: 1 } : {}),
        }}
      >
        {textOrNode}
      </UnstyledButton>
    );
  }

  // --- confirm ---
  if (variant === "confirm") {
    const handleConfirmClick = () => {
      if (disabled) return;
      if (!confirming) {
        setConfirming(true);
        setConfirmCountdown(3);
        let remaining = 3;
        resetTimerRef.current = setInterval(() => {
          remaining -= 1;
          setConfirmCountdown(remaining);
          if (remaining === 0) {
            clearInterval(resetTimerRef.current!);
            resetTimerRef.current = null;
            setConfirming(false);
            setConfirmCountdown(3);
          }
        }, 1000);
      } else {
        if (resetTimerRef.current) clearInterval(resetTimerRef.current);
        setConfirming(false);
        setConfirmCountdown(3);
        onClick?.();
      }
    };

    return wrapWithIndicator(
      wrapWithTooltip(
        <Button
          color={confirming ? "danger" : undefined}
          variant={confirming ? "filled" : "default"}
          disabled={disabled}
          loading={loading}
          leftSection={!confirming ? leftIcon : undefined}
          styles={{
            root: {
              ...PADDING,
              transition: "background 200ms ease, color 200ms ease, border-color 200ms ease",
            },
          }}
          style={resolvedStyle}
          onClick={handleConfirmClick}
        >
          {confirming ? `Are you sure? (${confirmCountdown}s)` : textOrNode}
        </Button>,
        !confirming ? tooltip : undefined,
      ),
      indicator,
    );
  }

  // --- primary / secondary ---
  if (href) {
    return wrapWithIndicator(
      wrapWithTooltip(
        <Button
          color={variant === "primary" ? "brand" : undefined}
          variant={variant === "primary" ? "filled" : "default"}
          component={Link}
          href={href}
          disabled={disabled}
          loading={loading}
          leftSection={leftIcon}
          styles={{ root: PADDING }}
          style={resolvedStyle}
          onClick={onClick}
        >
          {textOrNode}
        </Button>,
        tooltip,
      ),
      indicator,
    );
  }

  return wrapWithIndicator(
    wrapWithTooltip(
      <Button
        color={variant === "primary" ? "brand" : undefined}
        variant={variant === "primary" ? "filled" : "default"}
        disabled={disabled}
        loading={loading}
        leftSection={leftIcon}
        styles={{ root: PADDING }}
        style={resolvedStyle}
        onClick={onClick}
      >
        {textOrNode}
      </Button>,
      tooltip,
    ),
    indicator,
  );
}

export { GMButton };
