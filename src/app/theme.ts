import { type CSSVariablesResolver, createTheme } from "@mantine/core";
import { GM_PALETTES } from "@/constants/colors";

const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    "--mantine-color-dimmed": "#5c6470",
    "--mantine-color-body": "hsl(0, 0%, 95%)",
  },
  dark: {
    "--mantine-color-body": "hsl(0, 0%, 5%)",
  },
});

const theme = createTheme({
  primaryColor: "brand",
  colors: {
    black: [
      "#FFFFFF",
      "#F8F8F8",
      "#E3E3E3",
      "#B2B2B2",
      "#999999",
      "#808080",
      "#666666",
      "#4D4D4D",
      "#333333",
      "#000000",
    ],
    ...GM_PALETTES,
  },
  defaultRadius: "md",
  fontFamily: `var(--font-plus-jakarta), -apple-system, BlinkMacSystemFont, sans-serif`,
  headings: {
    fontFamily: `var(--font-plus-jakarta), -apple-system, BlinkMacSystemFont, sans-serif`,
    fontWeight: "800",
  },
});

export { cssVariablesResolver, theme };
