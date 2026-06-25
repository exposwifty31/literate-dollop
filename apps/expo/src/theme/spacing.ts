// 8px base grid. Use named tokens — never raw pixel literals in StyleSheet.
export const spacing = {
  0: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,

  // Page-level chrome
  pageHorizontal: 16,
  pageVertical: 24,
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
} as const;

// Touch targets must be ≥ 44px (iOS HIG / WCAG 2.5.5).
export const touchTarget = {
  sm: 32,  // non-critical UI only
  md: 44,  // default
  lg: 48,
} as const;

export const listItemHeight = {
  default: 56,  // 44px touch + 12px padding
} as const;
