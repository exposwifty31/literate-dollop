import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { colors } from '@/src/theme/colors';
import { fontFamily, typeScale } from '@/src/theme/typography';
import { radius, spacing, touchTarget } from '@/src/theme/spacing';

interface FormFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  required?: boolean;
}

export function FormField({ label, error, required, ...inputProps }: FormFieldProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.semantic.error
    : focused
    ? colors.focusRing
    : colors.border;
  const borderWidth = error || focused ? 2 : 1;

  const accessibilityId = label.toLowerCase().replace(/\s+/g, '-');

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label} nativeID={`label-${accessibilityId}`}>
        {label}
        {required && <Text style={styles.requiredMark}> *</Text>}
      </Text>
      <TextInput
        style={[styles.input, { borderColor, borderWidth }]}
        placeholderTextColor={colors.textTertiary}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={label}
        aria-required={required}
        aria-invalid={!!error}
        {...inputProps}
      />
      {error ? (
        <Text
          style={styles.errorText}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  label: {
    color: colors.text,
    fontFamily: fontFamily.semiBold,
    ...typeScale.label,
  },
  requiredMark: {
    color: colors.semantic.error,
  },
  input: {
    borderRadius: radius.md,
    color: colors.text,
    fontFamily: fontFamily.regular,
    fontSize: 16,
    height: touchTarget.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  errorText: {
    color: colors.semantic.error,
    fontFamily: fontFamily.regular,
    ...typeScale.caption,
    marginTop: spacing.xs,
  },
});
