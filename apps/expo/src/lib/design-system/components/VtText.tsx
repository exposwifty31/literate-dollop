import { Text, type TextProps, type StyleProp, type TextStyle } from "react-native";
import { useTheme } from "../useTheme";

type TextVariant = "heading" | "subheading" | "body" | "caption" | "muted" | "error";

interface VtTextProps extends Omit<TextProps, "style"> {
  variant?: TextVariant;
  style?: StyleProp<TextStyle>;
}

export function VtText({ variant = "body", style, ...rest }: VtTextProps) {
  const { color, typography } = useTheme();

  const variantStyle: Record<TextVariant, TextStyle> = {
    heading: {
      fontSize: typography.size["2xl"],
      fontWeight: typography.weight.bold,
      lineHeight: typography.lineHeight.relaxed,
      color: color.text.primary,
    },
    subheading: {
      fontSize: typography.size.lg,
      fontWeight: typography.weight.semibold,
      lineHeight: typography.lineHeight.normal,
      color: color.text.primary,
    },
    body: {
      fontSize: typography.size.base,
      fontWeight: typography.weight.regular,
      lineHeight: typography.lineHeight.normal,
      color: color.text.primary,
    },
    caption: {
      fontSize: typography.size.sm,
      fontWeight: typography.weight.medium,
      lineHeight: typography.lineHeight.tight,
      color: color.text.secondary,
    },
    muted: {
      fontSize: typography.size.sm,
      fontWeight: typography.weight.regular,
      lineHeight: typography.lineHeight.tight,
      color: color.text.muted,
    },
    error: {
      fontSize: typography.size.sm,
      fontWeight: typography.weight.medium,
      lineHeight: typography.lineHeight.tight,
      color: color.text.error,
    },
  };

  return <Text style={[variantStyle[variant], style]} {...rest} />;
}
