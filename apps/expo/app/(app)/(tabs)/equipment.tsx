import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { fetchEquipmentList, type EquipmentListResponse } from "@/lib/api/equipment-list";
import { t } from "@/lib/i18n";
import type { Equipment, EquipmentStatus } from "@/types/equipment";

const PAGE_SIZE = 25;
const DEBOUNCE_MS = 400;

const STATUS_FILTERS: Array<{ key: string; label: string }> = [
  { key: "all", label: t.status.all },
  { key: "ok", label: t.status.ok },
  { key: "issue", label: t.status.issue },
  { key: "maintenance", label: t.status.maintenance },
];

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

function EquipmentRow({
  item,
  onPress,
  textColor,
}: {
  item: Equipment;
  onPress: () => void;
  textColor: string;
}) {
  const pillColor = STATUS_PILL_COLORS[item.status] ?? "#687076";
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.75 : 1 }]}
      testID={`equipment-row-${item.id}`}
    >
      <View style={styles.rowContent}>
        <Text style={[styles.rowName, { color: textColor }]} numberOfLines={1}>
          {item.name}
        </Text>
        {item.location || item.roomName ? (
          <Text style={styles.rowMeta} numberOfLines={1}>
            {item.roomName ?? item.location}
          </Text>
        ) : null}
      </View>
      <View style={[styles.statusPill, { backgroundColor: pillColor }]}>
        <Text style={styles.statusPillText}>{statusLabel(item.status)}</Text>
      </View>
    </Pressable>
  );
}

export default function EquipmentScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [data, setData] = useState<EquipmentListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (q: string, status: string, page: number, append: boolean) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
    }
    try {
      const result = await fetchEquipmentList({ q, status, page, limit: PAGE_SIZE });
      if (append) {
        setData((prev) => (prev ? { ...result, items: [...prev.items, ...result.items] } : result));
      } else {
        setData(result);
      }
    } catch {
      if (!append) setError(t.equipmentList.errors.loadFailed);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void load(query, statusFilter, 1, false);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, statusFilter, load]);

  const handleLoadMore = useCallback(() => {
    if (!data?.hasMore || loadingMore) return;
    void load(query, statusFilter, data.page + 1, true);
  }, [data, loadingMore, query, statusFilter, load]);

  const handleRefresh = useCallback(() => {
    void load(query, statusFilter, 1, false);
  }, [query, statusFilter, load]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TextInput
        style={[styles.searchInput, { color: colors.text, borderColor: colors.text + "33" }]}
        value={query}
        onChangeText={setQuery}
        placeholder={t.equipmentList.search.placeholder}
        placeholderTextColor={colors.text + "66"}
        returnKeyType="search"
        clearButtonMode="while-editing"
        accessibilityLabel={t.equipmentList.search.placeholder}
        testID="equipment-search-input"
      />

      <View style={styles.filterRow}>
        {STATUS_FILTERS.map(({ key, label }) => (
          <Pressable
            key={key}
            onPress={() => setStatusFilter(key)}
            style={({ pressed }) => [
              styles.filterChip,
              statusFilter === key && { backgroundColor: colors.tint },
              { opacity: pressed ? 0.75 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: statusFilter === key }}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === key ? styles.filterChipTextActive : { color: colors.text },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <Pressable
            onPress={handleRefresh}
            style={[styles.retryButton, { backgroundColor: colors.tint }]}
            accessibilityRole="button"
          >
            <Text style={styles.retryButtonText}>{t.common.tryAgain}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={data?.items ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EquipmentRow
              item={item}
              textColor={colors.text}
              onPress={() => router.push(`/equipment/${item.id}`)}
            />
          )}
          onRefresh={handleRefresh}
          refreshing={loading}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            data !== null ? (
              <View style={styles.center}>
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  {t.equipmentList.empty.message}
                </Text>
                {query || statusFilter !== "all" ? (
                  <Text style={styles.emptyHint}>{t.equipmentList.empty.filteredHint}</Text>
                ) : (
                  <Text style={styles.emptyHint}>{t.equipmentList.empty.emptyHint}</Text>
                )}
              </View>
            ) : null
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator size="small" color={colors.tint} style={styles.footerSpinner} />
            ) : data?.total !== undefined ? (
              <Text style={styles.paginationText}>
                {t.equipmentList.paginationCount(
                  Math.min((data.items ?? []).length, data.total),
                  data.total,
                )}
              </Text>
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
  searchInput: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#e5e7eb",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: "#fff",
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
  footerSpinner: {
    paddingVertical: 12,
  },
  paginationText: {
    textAlign: "center",
    color: "#687076",
    fontSize: 13,
    paddingVertical: 12,
  },
});
