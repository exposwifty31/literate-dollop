import { Pressable, Text, type PressableProps } from "react-native";

import { useTheme } from "../useTheme";
import { minTouchTarget } from "../tokens";

interface FilterChipProps extends Omit<PressableProps, "style"> {
  label: string;
  selected: boolean;
}

export function FilterChip({ label, selected, ...rest }: FilterChipProps) {
  const { color, typography, radii, spacing } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        backgroundColor: selected ? color.brand.default : color.surface,
        borderWidth: 1,
        borderColor: selected ? color.brand.default : color.border,
        borderRadius: radii.full,
        paddingHorizontal: spacing[4] - 2,
        paddingVertical: spacing[2] - 2,
        minHeight: minTouchTarget,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.75 : 1,
      })}
      {...rest}
    >
      <Text
        style={{
          color: selected ? color.text.inverse : color.text.primary,
          fontSize: typography.size.sm,
          fontWeight: selected ? typography.weight.semibold : typography.weight.medium,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
