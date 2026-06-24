import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useTheme } from "../useTheme";

interface CardProps {
  children: React.ReactNode;
  onPress?: PressableProps["onPress"];
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Card({ children, onPress, style, testID }: CardProps) {
  const { color, radii, spacing } = useTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: color.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
    padding: spacing[4],
    gap: spacing[3],
  };

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [cardStyle, { opacity: pressed ? 0.85 : 1 }, style]}
        testID={testID}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[cardStyle, style]} testID={testID}>
      {children}
    </View>
  );
}
