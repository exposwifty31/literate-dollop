import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { fetchAlerts } from "@/lib/api/alerts";
import { t } from "@/lib/i18n";
import type { Alert, AlertType } from "@/types/equipment";

// Fix 4: Single lookup record merging the two parallel switch functions.
const ALERT_TYPE_META: Record<AlertType, { label: string; badgeLabel: string }> = {
  issue: { label: t.alerts.types.issue.label, badgeLabel: t.alerts.types.issue.badgeLabel },
  overdue: { label: t.alerts.types.overdue.label, badgeLabel: t.alerts.types.overdue.badgeLabel },
  sterilization_due: {
    label: t.alerts.types.sterilization_due.label,
    badgeLabel: t.alerts.types.sterilization_due.badgeLabel,
  },
  inactive: {
    label: t.alerts.types.inactive.label,
    badgeLabel: t.alerts.types.inactive.badgeLabel,
  },
};

const BADGE_SEVERITY_COLORS: Record<AlertType, string> = {
  issue: "#b91c1c",
  overdue: "#c2410c",
  sterilization_due: "#d97706",
  inactive: "#6b7280",
};

// Fix 3: Wrap AlertRow in React.memo to avoid unnecessary re-renders.
const AlertRow = React.memo(function AlertRow({
  alert,
  onPress,
  textColor,
  mutedTextColor,
}: {
  alert: Alert;
  onPress: () => void;
  textColor: string;
  mutedTextColor: string;
}) {
  const meta = ALERT_TYPE_META[alert.type];
  const badgeColor = BADGE_SEVERITY_COLORS[alert.type] ?? "#6b7280";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.75 : 1 }]}
      testID={`alert-row-${alert.equipmentId}-${alert.type}`}
    >
      <View style={styles.rowContent}>
        <Text style={[styles.rowName, { color: textColor }]} numberOfLines={1}>
          {alert.equipmentName}
        </Text>
        {/* Fix 5: Use passed-in mutedTextColor instead of hardcoded #687076 */}
        <Text style={[styles.rowMeta, { color: mutedTextColor }]} numberOfLines={1}>
          {meta.label}
          {alert.detail ? ` — ${alert.detail}` : ""}
        </Text>
      </View>
      <View style={[styles.badge, { backgroundColor: badgeColor }]}>
        <Text style={styles.badgeText}>{meta.badgeLabel}</Text>
      </View>
    </Pressable>
  );
});

export default function AlertsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [items, setItems] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAlerts();
      setItems(result.items);
    } catch {
      setError(t.alerts.errors.loadFailed);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Fix 3: Wrap renderItem in useCallback.
  // Fix 5: Pass colors.text and muted variant into AlertRow.
  const mutedTextColor = colors.text + "99";
  const renderItem = useCallback(
    ({ item, index }: { item: Alert; index: number }) => (
      <AlertRow
        alert={item}
        textColor={colors.text}
        mutedTextColor={mutedTextColor}
        onPress={() => router.push(`/equipment/${item.equipmentId}`)}
        key={index}
      />
    ),
    [colors.text, mutedTextColor, router],
  );

  const count = items.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {count > 0 ? (
        <Text style={[styles.countHeader, { color: colors.text }]}>
          {t.alerts.itemCount(count)}
        </Text>
      ) : null}

      {/* Fix 1: Show inline error banner when stale data exists; full-screen error only when items.length === 0. */}
      {error && items.length > 0 ? (
        <View style={[styles.inlineBanner, { backgroundColor: colors.text + "1a" }]}>
          <Text style={[styles.inlineBannerText, { color: colors.text }]}>{error}</Text>
          <Pressable onPress={load} accessibilityRole="button">
            <Text style={[styles.inlineRetry, { color: colors.tint }]}>{t.common.tryAgain}</Text>
          </Pressable>
        </View>
      ) : null}

      {loading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : error && items.length === 0 ? (
        // Fix 1: Full-screen error only when there is no stale list to show.
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <Pressable
            onPress={load}
            style={[styles.retryButton, { backgroundColor: colors.tint }]}
            accessibilityRole="button"
          >
            <Text style={styles.retryButtonText}>{t.common.tryAgain}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          // Fix 2: Use index.toString() as a safe fallback — Alert has no id field.
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderItem}
          onRefresh={load}
          refreshing={loading}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.center}>
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  {t.alerts.empty.message}
                </Text>
                <Text style={[styles.emptyHint, { color: mutedTextColor }]}>
                  {t.alerts.empty.subMessage}
                </Text>
              </View>
            ) : null
          }
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: colors.text + "1a" }]} />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  countHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    opacity: 0.7,
    fontWeight: "500",
  },
  inlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  inlineBannerText: {
    flex: 1,
    fontSize: 13,
  },
  inlineRetry: {
    fontSize: 13,
    fontWeight: "600",
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    fontSize: 16,
    fontWeight: "500",
  },
  rowMeta: {
    fontSize: 13,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  emptyHint: {
    fontSize: 14,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
