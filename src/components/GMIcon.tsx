"use client";

import {
  IconAlertCircle,
  IconAlertTriangle,
  IconBook,
  IconBookmark,
  IconBrandGoogleFilled,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconCircleFilled,
  IconDots,
  IconLanguage,
  IconLogout,
  IconMoon,
  IconSearch,
  IconSettings,
  IconStar,
  IconSun,
  IconTextSize,
  IconUser,
  IconVolume,
  IconX,
  type TablerIcon,
} from "@tabler/icons-react";
import { resolveColor } from "@/constants/colors";
import { type SpacingValue } from "@/constants/sizes";

/**
 * GMIcon — visual context, never interactive alone.
 * Wrap in GMButton variant="icon" if it must be tappable.
 *
 * name — PascalCase Tabler key without "Icon" prefix (e.g. "Search" for IconSearch).
 * bg — wraps in a 15%-tinted container.
 */

const ICON_MAP = {
  AlertCircle: IconAlertCircle,
  AlertTriangle: IconAlertTriangle,
  Book: IconBook,
  Bookmark: IconBookmark,
  BrandGoogleFilled: IconBrandGoogleFilled,
  Check: IconCheck,
  ChevronDown: IconChevronDown,
  ChevronLeft: IconChevronLeft,
  ChevronRight: IconChevronRight,
  ChevronUp: IconChevronUp,
  CircleFilled: IconCircleFilled,
  Dots: IconDots,
  Language: IconLanguage,
  Logout: IconLogout,
  Moon: IconMoon,
  Search: IconSearch,
  Settings: IconSettings,
  Star: IconStar,
  Sun: IconSun,
  TextSize: IconTextSize,
  User: IconUser,
  Volume: IconVolume,
  X: IconX,
} satisfies Record<string, TablerIcon>;

type IconName = keyof typeof ICON_MAP;

type IconSize = Exclude<SpacingValue, "none">;

const ICON_SIZES: Record<IconSize, string> = {
  xs: "0.625rem",
  sm: "0.875rem",
  md: "1.125rem",
  lg: "1.375rem",
  xl: "1.875rem",
};

const CONTAINER_SIZES: Record<IconSize, string> = {
  xs: "1rem",
  sm: "1.5rem",
  md: "2rem",
  lg: "2.5rem",
  xl: "3.5rem",
};

const BORDER_RADIUS = {
  xs: "var(--mantine-radius-xs)",
  sm: "var(--mantine-radius-sm)",
  md: "var(--mantine-radius-md)",
  lg: "var(--mantine-radius-lg)",
  xl: "var(--mantine-radius-xl)",
} as const;

type GMIconProps = {
  name: IconName;
  size?: IconSize;
  color?: string;
  bg?: boolean;
  stroke?: number;
  radius?: keyof typeof BORDER_RADIUS;
};

function GMIcon({
  name,
  size = "md",
  color = "currentColor",
  bg = false,
  stroke = 2,
  radius = "md",
}: GMIconProps): React.JSX.Element {
  const Icon = ICON_MAP[name];
  const iconSize = ICON_SIZES[size];

  if (bg) {
    const resolvedBg = resolveColor(color);
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: CONTAINER_SIZES[size],
          height: CONTAINER_SIZES[size],
          borderRadius: BORDER_RADIUS[radius],
          background: `color-mix(in srgb, ${resolvedBg} 15%, transparent)`,
          color: resolvedBg,
          flexShrink: 0,
        }}
      >
        <Icon size={iconSize} color="currentColor" stroke={stroke} />
      </span>
    );
  }

  return <Icon size={iconSize} color={resolveColor(color)} stroke={stroke} />;
}

export { GMIcon };
export type { GMIconProps, IconName };
