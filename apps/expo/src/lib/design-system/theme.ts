import { palette, typography, spacing, radii } from "./tokens";

export type ColorScheme = "light" | "dark";

export interface Theme {
  scheme: ColorScheme;
  color: {
    background: string;
    surface: string;
    border: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
      inverse: string;
      error: string;
    };
    brand: {
      default: string;
      pressed: string;
      subtle: string;
    };
    emergency: string;
    separator: string;
  };
  typography: typeof typography;
  spacing: typeof spacing;
  radii: typeof radii;
}

const shared = { typography, spacing, radii } as const;

export const lightTheme: Theme = {
  scheme: "light",
  color: {
    background: palette.neutral[0],
    surface: palette.neutral[50],
    border: palette.neutral[200],
    text: {
      primary: palette.neutral[900],
      secondary: palette.neutral[600],
      muted: palette.neutral[500],
      inverse: palette.neutral[0],
      error: palette.red[700],
    },
    brand: {
      default: palette.brand[500],
      pressed: palette.brand[700],
      subtle: palette.brand[50],
    },
    emergency: palette.navy[800],
    separator: palette.neutral[200],
  },
  ...shared,
};

export const darkTheme: Theme = {
  scheme: "dark",
  color: {
    background: palette.neutral[1000],
    surface: palette.neutral[900],
    border: palette.neutral[700],
    text: {
      primary: palette.neutral[0],
      secondary: palette.neutral[300],
      muted: palette.neutral[400],
      inverse: palette.neutral[1000],
      error: "#f87171",
    },
    brand: {
      default: palette.brand[400],
      pressed: palette.brand[300],
      subtle: palette.brand[900],
    },
    emergency: palette.navy[900],
    separator: palette.neutral[800],
  },
  ...shared,
};

export function resolveTheme(scheme: ColorScheme): Theme {
  return scheme === "dark" ? darkTheme : lightTheme;
}
