import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/src/theme/colors';
import { fontFamily, typeScale } from '@/src/theme/typography';
import { listItemHeight, spacing } from '@/src/theme/spacing';

interface ListItemProps {
  title: string;
  description?: string;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export function ListItem({
  title,
  description,
  leftSlot,
  rightSlot,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: ListItemProps) {
  const Inner = (
    <View style={styles.row}>
      {leftSlot ? <View style={styles.leftSlot}>{leftSlot}</View> : null}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {description ? (
          <Text style={styles.description} numberOfLines={1}>
            {description}
          </Text>
        ) : null}
      </View>
      {rightSlot ? <View style={styles.rightSlot}>{rightSlot}</View> : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityHint={accessibilityHint}
        testID={testID}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
      >
        {Inner}
      </Pressable>
    );
  }

  return <View style={styles.pressable}>{Inner}</View>;
}

const styles = StyleSheet.create({
  pressable: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    minHeight: listItemHeight.default,
  },
  pressed: {
    backgroundColor: colors.background,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: listItemHeight.default,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  leftSlot: {
    marginEnd: spacing.md,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontFamily: fontFamily.medium,
    ...typeScale.body,
  },
  description: {
    color: colors.textTertiary,
    fontFamily: fontFamily.regular,
    ...typeScale.bodySmall,
  },
  rightSlot: {
    marginStart: spacing.sm,
  },
});
