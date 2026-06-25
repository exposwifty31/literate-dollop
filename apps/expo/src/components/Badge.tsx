import { StyleSheet, Text, View } from 'react-native';

import { colors, statusVariantColors } from '@/src/theme/colors';
import { fontFamily, typeScale } from '@/src/theme/typography';
import { radius, spacing } from '@/src/theme/spacing';
import type { StatusVariant } from '@/src/theme/colors';

interface BadgeProps {
  label: string;
  variant: StatusVariant;
}

export function Badge({ label, variant }: BadgeProps) {
  const palette = statusVariantColors[variant];
  return (
    <View
      style={[styles.base, { backgroundColor: palette.bg, borderColor: palette.border }]}
      accessibilityRole="text"
    >
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  label: {
    fontFamily: fontFamily.semiBold,
    ...typeScale.caption,
  },
});
