import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from 'react-native';

import { colors } from '@/src/theme/colors';
import { fontFamily, typeScale } from '@/src/theme/typography';
import { radius, touchTarget } from '@/src/theme/spacing';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: PressableProps['onPress'];
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isDisabled?: boolean;
  fullWidth?: boolean;
  testID?: string;
}

const variantStyles: Record<ButtonVariant, { bg: string; text: string; borderColor: string; borderWidth: number }> = {
  primary: { bg: colors.primary[600], text: '#ffffff', borderColor: 'transparent', borderWidth: 0 },
  secondary: { bg: 'transparent', text: colors.primary[600], borderColor: colors.primary[600], borderWidth: 2 },
  tertiary: { bg: 'transparent', text: colors.textSecondary, borderColor: 'transparent', borderWidth: 0 },
  danger: { bg: colors.semantic.error, text: '#ffffff', borderColor: 'transparent', borderWidth: 0 },
};

const sizeStyles: Record<ButtonSize, { height: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { height: touchTarget.sm, paddingHorizontal: 12, fontSize: 13 },
  md: { height: touchTarget.md, paddingHorizontal: 16, fontSize: 14 },
  lg: { height: touchTarget.lg, paddingHorizontal: 20, fontSize: 15 },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isDisabled = false,
  fullWidth = false,
  testID,
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const disabled = isLoading || isDisabled;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: isLoading }}
      accessibilityLabel={label}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.borderColor,
          borderWidth: v.borderWidth,
          height: s.height,
          paddingHorizontal: s.paddingHorizontal,
          opacity: pressed || disabled ? 0.72 : 1,
        },
        fullWidth && styles.fullWidth,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <Text
          style={[
            styles.label,
            { color: v.text, fontSize: s.fontSize },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: touchTarget.md,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  label: {
    fontFamily: fontFamily.semiBold,
    ...typeScale.label,
  },
});
