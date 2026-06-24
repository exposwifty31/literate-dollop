import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { useTheme } from "../useTheme";

interface DividerProps {
  inset?: number;
  style?: StyleProp<ViewStyle>;
}

export function Divider({ inset = 0, style }: DividerProps) {
  const { color } = useTheme();

  return (
    <View
      style={[
        styles.line,
        {
          height: StyleSheet.hairlineWidth,
          backgroundColor: color.separator,
          marginLeft: inset,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  line: {
    alignSelf: "stretch",
  },
});
