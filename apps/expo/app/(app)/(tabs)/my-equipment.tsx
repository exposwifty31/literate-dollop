import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { fetchMyEquipment } from "@/lib/api/equipment-list";
import { t } from "@/lib/i18n";
import type { Equipment, EquipmentStatus } from "@/types/equipment";

const STATUS_PILL_COLORS: Record<string, string> = {
  ok: "#16a34a",
  issue: "#dc2626",
  maintenance: "#d97706",
  sterilized: "#0891b2",
  critical: "#b91c1c",
  needs_attention: "#c2410c",
};

function statusLabel(status: EquipmentStatus): string {
  switch (status) {
    case "ok":
      return t.status.ok;
    case "issue":
      return t.status.issue;
    case "maintenance":
      return t.status.maintenance;
    case "sterilized":
      return t.status.sterilized;
    case "critical":
    case "needs_attention":
      return t.status.info;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function MyEquipmentRow({
  item,
  onPress,
  textColor,
}: {
  item: Equipment;
  onPress: () => void;
  textColor: string;
}) {
  const pillColor = STATUS_PILL_COLORS[item.status] ?? "#687076";
  const checkedOutAt = item.checkedOutAt
    ? new Date(item.checkedOutAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.75 : 1 }]}
      testID={`my-equipment-row-${item.id}`}
    >
      <View style={styles.rowContent}>
        <Text style={[styles.rowName, { color: textColor }]} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.rowMetaRow}>
          {item.checkedOutLocation || item.location ? (
            <Text style={styles.rowMeta} numberOfLines={1}>
              {item.checkedOutLocation ?? item.location}
            </Text>
          ) : null}
          {checkedOutAt ? <Text style={styles.rowMeta}>{checkedOutAt}</Text> : null}
        </View>
      </View>
      <View style={[styles.statusPill, { backgroundColor: pillColor }]}>
        <Text style={styles.statusPillText}>{statusLabel(item.status)}</Text>
      </View>
    </Pressable>
  );
}

export default function MyEquipmentScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [items, setItems] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMyEquipment();
      setItems(result);
    } catch {
      setError(t.myEquipment.errors.loadFailed);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const count = items.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {count > 0 ? (
        <Text style={[styles.countHeader, { color: colors.text }]}>
          {t.myEquipment.checkedOutCount(count)}
        </Text>
      ) : null}

      {loading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : error ? (
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
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MyEquipmentRow
              item={item}
              textColor={colors.text}
              onPress={() => router.push(`/equipment/${item.id}`)}
            />
          )}
          onRefresh={load}
          refreshing={loading}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.center}>
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  {t.myEquipment.empty.message}
                </Text>
                <Text style={styles.emptyHint}>{t.myEquipment.empty.subMessage}</Text>
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
  rowMetaRow: {
    flexDirection: "row",
    gap: 8,
  },
  rowMeta: {
    fontSize: 13,
    color: "#687076",
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  statusPillText: {
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
    color: "#687076",
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
