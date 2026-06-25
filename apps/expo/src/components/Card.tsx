import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'critical';

interface CardProps extends ViewProps {
  variant?: CardVariant;
  children: React.ReactNode;
}

const variantStyles: Record<CardVariant, object> = {
  default: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  elevated: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  outlined: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1,
  },
  critical: {
    backgroundColor: '#fff5f5',
    borderColor: colors.semantic.error,
    borderWidth: 2,
  },
};

export function Card({ variant = 'default', children, style, ...rest }: CardProps) {
  return (
    <View
      style={[styles.base, variantStyles[variant], style]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
});
