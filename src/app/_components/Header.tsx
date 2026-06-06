import { GMButton } from "@/components/GMButton";
import { GMContainer } from "@/components/GMContainer";
import { GMIcon } from "@/components/GMIcon";
import { GMText } from "@/components/GMText";
import { useMantineColorScheme } from "@mantine/core";
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
  useEffect(() => setMounted(true), []);

  // Use defaultColorScheme ("dark") until after hydration to avoid mismatch,
  // since localStorageColorSchemeManager reads localStorage synchronously on the
  // client and may differ from the server-rendered default.
  const isDark = mounted ? colorScheme === "dark" : true;

  return (
    <GMContainer bb py="xs" px="sm">
      <GMContainer variant="row" justify="space-between">
        {/* App name */}
        <GMContainer gap="xs">
          <GMText variant="title">汉语</GMText>
          <GMText variant="secondary">hànyǔ</GMText>
        </GMContainer>

        {/* Controls */}
        <GMContainer variant="row" gap="sm">
          {/* Display size cycle */}
          <GMButton
            variant="icon"
            onClick={cycleSize}
            tooltip={`Font size: ${size}`}
          >
            {DISPLAY_SIZE_LABEL[size]}
          </GMButton>

          {/* Theme toggle */}
          <GMButton
            variant="icon"
            onClick={toggleColorScheme}
            tooltip={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            <GMIcon name={isDark ? "Sun" : "Moon"} />
          </GMButton>
        </GMContainer>
      </GMContainer>
    </GMContainer>
  );
}

export { Header };
