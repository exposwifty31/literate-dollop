import { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/src/theme/colors';
import { fontFamily, typeScale } from '@/src/theme/typography';
import { radius, spacing } from '@/src/theme/spacing';

interface SheetProps {
  visible: boolean;
  title: string;
  children: React.ReactNode;
  onDismiss: () => void;
  dismissible?: boolean;
  contentStyle?: ViewStyle;
}

export function Sheet({
  visible,
  title,
  children,
  onDismiss,
  dismissible = true,
  contentStyle,
}: SheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(400)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 400,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, backdropOpacity, translateY]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={dismissible ? onDismiss : undefined}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View
          style={[styles.backdrop, { opacity: backdropOpacity }]}
          pointerEvents={dismissible ? 'auto' : 'none'}
        >
          {dismissible && (
            <Pressable
              style={StyleSheet.absoluteFill as object}
              onPress={onDismiss}
              accessibilityRole="button"
              accessibilityLabel="Dismiss"
            />
          )}
        </Animated.View>

        {/* Sheet panel */}
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) },
            { transform: [{ translateY }] },
            contentStyle,
          ]}
          accessibilityViewIsModal
        >
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            {dismissible && (
              <Pressable
                onPress={onDismiss}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={8}
              >
                <Text style={styles.closeIcon}>✕</Text>
              </Pressable>
            )}
          </View>

          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: colors.border,
    borderRadius: radius.sm,
    height: 4,
    marginBottom: spacing.lg,
    width: 40,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.text,
    flex: 1,
    fontFamily: fontFamily.semiBold,
    ...typeScale.h3,
  },
  closeButton: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    marginStart: spacing.sm,
    width: 32,
  },
  closeIcon: {
    color: colors.textTertiary,
    fontFamily: fontFamily.medium,
    fontSize: 16,
  },
});
