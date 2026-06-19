import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { fetchRoomsList } from "@/lib/api/rooms";
import { t } from "@/lib/i18n";
import type { Room } from "@/types/equipment";

function RoomRow({
  item,
  onPress,
  textColor,
  badgeBackgroundColor,
  badgeTextColor,
}: {
  item: Room;
  onPress: () => void;
  textColor: string;
  badgeBackgroundColor: string;
  badgeTextColor: string;
}) {
  const total = item.totalEquipment ?? 0;
  const available = item.availableCount ?? 0;
  const inUse = item.inUseCount ?? 0;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.75 : 1 }]}
      testID={`rooms-row-${item.id}`}
    >
      <View style={styles.rowContent}>
        <Text style={[styles.rowName, { color: textColor }]} numberOfLines={1}>
          {item.name}
        </Text>
        {item.floor ? (
          <Text style={styles.rowMeta} numberOfLines={1}>
            {item.floor}
          </Text>
        ) : null}
      </View>
      <View style={[styles.badge, { backgroundColor: badgeBackgroundColor }]}>
        <Text style={[styles.badgeText, { color: badgeTextColor }]}>
          {t.rooms.list.equipment(total, available, inUse)}
        </Text>
      </View>
    </Pressable>
  );
}

export default function RoomsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [items, setItems] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchRoomsList();
      setItems(result);
    } catch {
      setError(t.rooms.list.errors.loadFailed);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
            <RoomRow
              item={item}
              textColor={colors.text}
              badgeBackgroundColor={colors.text + "1a"}
              badgeTextColor={colors.text}
              onPress={() => router.push(`/rooms/${item.id}`)}
            />
          )}
          onRefresh={load}
          refreshing={loading}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.center}>
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  {t.rooms.list.empty.message}
                </Text>
                <Text style={styles.emptyHint}>{t.rooms.list.empty.subMessage}</Text>
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
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
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
