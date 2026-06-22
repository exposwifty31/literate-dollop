import { useEffect, useState } from "react";
import { I18nManager, Pressable, StyleSheet, Text, View } from "react-native";

import {
  dismissCutoverBanner,
  getCutoverBannerVariant,
  resolveCutoverBannerVisible,
} from "@/lib/cutover/cutover-banner-state";
import { t } from "@/lib/i18n";

/**
 * H6 coexistence/sunset banner. Tells users this Expo build is the primary
 * VetTrack app and the legacy Capacitor build is being retired. Visibility +
 * dismissal logic lives in `@/lib/cutover/cutover-banner-state` (testable).
 * RTL is respected via `I18nManager.isRTL` (Hebrew is the default locale).
 */
export function CutoverBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let active = true;
    void resolveCutoverBannerVisible().then((shouldShow) => {
      if (active) setVisible(shouldShow);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!visible) return null;

  const rowDirection = I18nManager.isRTL ? "row-reverse" : "row";
  const retired = getCutoverBannerVariant() === "retired";
  const title = retired ? t.cutoverBanner.retiredTitle : t.cutoverBanner.title;
  const message = retired ? t.cutoverBanner.retiredMessage : t.cutoverBanner.message;

  function onDismiss() {
    setVisible(false);
    void dismissCutoverBanner();
  }

  return (
    <View style={[styles.container, { flexDirection: rowDirection }]} accessibilityRole="alert">
      <View style={styles.textColumn}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      <Pressable
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel={t.cutoverBanner.dismissAria}
        style={styles.dismissButton}
      >
        <Text style={styles.dismissText}>{t.cutoverBanner.dismiss}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1e3a8a",
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  message: {
    color: "#dbeafe",
    fontSize: 12,
  },
  dismissButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dismissText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 13,
  },
});
