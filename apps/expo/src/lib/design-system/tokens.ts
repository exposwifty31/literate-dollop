import type { EquipmentStatus } from "@/types/equipment";

export const palette = {
  brand: {
    50: "#e6f4f9",
    100: "#b3d9eb",
    200: "#80bfde",
    300: "#4da5d1",
    400: "#2695c9",
    500: "#0a7ea4",
    600: "#096d8e",
    700: "#075872",
    800: "#054256",
    900: "#032c3a",
  },
  neutral: {
    0: "#ffffff",
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#687076",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
    1000: "#000000",
  },
  green: {
    50: "#f0fdf4",
    100: "#dcfce7",
    500: "#16a34a",
    700: "#15803d",
  },
  red: {
    50: "#fef2f2",
    100: "#fee2e2",
    500: "#dc2626",
    700: "#b91c1c",
  },
  orange: {
    50: "#fff7ed",
    100: "#ffedd5",
    500: "#d97706",
    700: "#c2410c",
  },
  cyan: {
    50: "#ecfeff",
    100: "#cffafe",
    500: "#0891b2",
    700: "#0e7490",
  },
  navy: {
    800: "#1e3a8a",
    900: "#1e2d6e",
  },
} as const;

export const statusColors: Record<EquipmentStatus, string> = {
  ok: palette.green[500],
  issue: palette.red[500],
  maintenance: palette.orange[500],
  sterilized: palette.cyan[500],
  critical: palette.red[700],
  needs_attention: palette.orange[700],
};

export const typography = {
  size: {
    xs: 12,
    sm: 13,
    base: 16,
    lg: 18,
    xl: 22,
    "2xl": 28,
  },
  weight: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
  lineHeight: {
    tight: 18,
    normal: 22,
    relaxed: 26,
  },
} as const;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
} as const;

export const radii = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 16,
  full: 9999,
} as const;

export const minTouchTarget = 44;
