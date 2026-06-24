import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useTheme } from "../useTheme";
import { minTouchTarget } from "../tokens";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "style"> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const { color, typography, radii, spacing } = useTheme();
  const isDisabled = disabled || loading;

  const bgColor: Record<ButtonVariant, string> = {
    primary: color.brand.default,
    secondary: "transparent",
    ghost: "transparent",
    destructive: "#dc2626",
  };

  const textColor: Record<ButtonVariant, string> = {
    primary: color.text.inverse,
    secondary: color.brand.default,
    ghost: color.text.primary,
    destructive: color.text.inverse,
  };

  const borderColor: Record<ButtonVariant, string | undefined> = {
    primary: undefined,
    secondary: color.brand.default,
    ghost: undefined,
    destructive: undefined,
  };

  const paddingV: Record<ButtonSize, number> = {
    sm: spacing[2],
    md: spacing[3],
    lg: spacing[4],
  };

  const fontSize: Record<ButtonSize, number> = {
    sm: typography.size.sm,
    md: typography.size.base,
    lg: typography.size.lg,
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bgColor[variant],
          borderColor: borderColor[variant],
          borderWidth: variant === "secondary" ? 1.5 : 0,
          borderRadius: radii.md,
          paddingVertical: paddingV[size],
          paddingHorizontal: spacing[4],
          minHeight: minTouchTarget,
          opacity: pressed && !isDisabled ? 0.75 : isDisabled ? 0.45 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor[variant]} size="small" />
      ) : (
        <Text
          style={[
            styles.label,
            {
              color: textColor[variant],
              fontSize: fontSize[size],
              fontWeight: typography.weight.semibold,
            },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  label: {
    textAlign: "center",
  },
});
