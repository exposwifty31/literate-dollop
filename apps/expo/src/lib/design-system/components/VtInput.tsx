import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useTheme } from "../useTheme";
import { VtText } from "./VtText";
import { minTouchTarget } from "../tokens";

interface VtInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function VtInput({ label, error, containerStyle, style, ...rest }: VtInputProps) {
  const { color, typography, radii, spacing } = useTheme();

  return (
    <View style={containerStyle}>
      {label ? (
        <VtText variant="caption" style={styles.label}>
          {label}
        </VtText>
      ) : null}
      <TextInput
        style={[
          styles.input,
          {
            borderColor: error ? color.text.error : color.border,
            borderRadius: radii.md,
            color: color.text.primary,
            fontSize: typography.size.base,
            paddingHorizontal: spacing[3],
            minHeight: minTouchTarget,
          },
          style,
        ]}
        placeholderTextColor={color.text.muted}
        {...rest}
      />
      {error ? (
        <VtText variant="error" style={styles.errorText}>
          {error}
        </VtText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
  },
  errorText: {
    marginTop: 4,
  },
});
