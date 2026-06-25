import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/src/theme/colors';
import { fontFamily, typeScale } from '@/src/theme/typography';
import { radius, spacing, touchTarget } from '@/src/theme/spacing';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.base,
        selected ? styles.selected : styles.unselected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, selected ? styles.labelSelected : styles.labelUnselected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radius.full,
    borderWidth: 1.5,
    justifyContent: 'center',
    minHeight: touchTarget.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  selected: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  unselected: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.75,
  },
  label: {
    fontFamily: fontFamily.semiBold,
    ...typeScale.caption,
  },
  labelSelected: {
    color: '#ffffff',
  },
  labelUnselected: {
    color: colors.textSecondary,
  },
});
