type SpacingValue = "none" | "xs" | "sm" | "md" | "lg" | "xl";

const SPACING: Record<SpacingValue, string> = {
  none: "0",
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
};

export { SPACING };
export type { SpacingValue };
