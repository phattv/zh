"use client";

import { GMButton } from "@/components/GMButton";
import { GMContainer } from "@/components/GMContainer";
import { GMIcon } from "@/components/GMIcon";
import { ROUTES } from "@/constants/routes";
import { useMantineColorScheme } from "@mantine/core";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type DisplaySize = "small" | "medium" | "large";

const DISPLAY_SIZES: DisplaySize[] = ["small", "medium", "large"];

const DISPLAY_SIZE_PX: Record<DisplaySize, string> = {
  small: "14px",
  medium: "16px",
  large: "18px",
};

const DISPLAY_SIZE_LABEL: Record<DisplaySize, string> = {
  small: "S",
  medium: "M",
  large: "L",
};

type NavItem = { label: string; href: string } | { label: string; href: null };

const NAV_ITEMS: NavItem[] = [
  { label: "Search", href: ROUTES.home },
  { label: "Learn", href: ROUTES.learn },
  { label: "Listen", href: null },
  { label: "Speak", href: null },
  { label: "Read", href: ROUTES.read },
  { label: "Write", href: ROUTES.write },
];

function useDisplaySize() {
  const [size, setSize] = useState<DisplaySize>("medium");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(
        "zh-display-size",
      ) as DisplaySize | null;
      if (stored && stored in DISPLAY_SIZE_PX) setSize(stored);
    } catch {}
  }, []);

  function applySize(next: DisplaySize) {
    setSize(next);
    document.documentElement.style.fontSize = DISPLAY_SIZE_PX[next];
    try {
      localStorage.setItem("zh-display-size", next);
    } catch {}
  }

  function cycleSize() {
    const next =
      DISPLAY_SIZES[(DISPLAY_SIZES.indexOf(size) + 1) % DISPLAY_SIZES.length];
    applySize(next);
  }

  return { size, cycleSize };
}

function Header(): React.JSX.Element {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { size, cycleSize } = useDisplaySize();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  useEffect(() => setMounted(true), []);

  const isDark = mounted ? colorScheme === "dark" : true;

  return (
    <GMContainer bb>
      {/* Title row */}
      <GMContainer variant="row" justify="space-between" py="xs" px="sm">
        <GMButton variant="link" href="/">
          zh.phattv.dev
        </GMButton>

        <GMContainer variant="row" gap="sm">
          <GMButton
            variant="icon"
            onClick={cycleSize}
            tooltip={`Font size: ${size}`}
          >
            {DISPLAY_SIZE_LABEL[size]}
          </GMButton>

          <GMButton
            variant="icon"
            onClick={toggleColorScheme}
            tooltip={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            <GMIcon name={isDark ? "Sun" : "Moon"} />
          </GMButton>
        </GMContainer>
      </GMContainer>

      {/* Nav tab strip */}
      <GMContainer variant="row" px="sm" gap="none" scrollable>
        {NAV_ITEMS.map((item) => {
          const isActive =
            mounted && item.href !== null && pathname === item.href;
          const btn = (
            <GMButton
              variant="tab"
              active={isActive}
              disabled={item.href === null}
            >
              {item.label}
            </GMButton>
          );
          return item.href !== null ? (
            <Link
              key={item.label}
              href={item.href}
              style={{ textDecoration: "none" }}
            >
              {btn}
            </Link>
          ) : (
            <span key={item.label}>{btn}</span>
          );
        })}
      </GMContainer>
    </GMContainer>
  );
}

export { Header };
