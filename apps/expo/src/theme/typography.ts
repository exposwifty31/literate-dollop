// React Native font families — loaded via useFonts in apps/expo/app/_layout.tsx.
// Use these constants in StyleSheet objects; do not hardcode font strings elsewhere.
export const fontFamily = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  // Hebrew locale — higher x-height, 1.6 line height
  heRegular: 'Heebo_400Regular',
  heMedium: 'Heebo_500Medium',
  heSemiBold: 'Heebo_600SemiBold',
  heBold: 'Heebo_700Bold',
  // Tabular numerals for serial numbers, IDs, counts
  mono: 'SpaceMono',
} as const;

export const typeScale = {
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: '600' as const, lineHeight: 29 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 25 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  label: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
  mono: { fontSize: 12, fontWeight: '400' as const, lineHeight: 18 },
} as const;

// Returns the body scale adjusted for Hebrew's taller script.
export function getBodyLineHeight(locale: 'en' | 'he'): number {
  return locale === 'he' ? 26 : 24;
}
