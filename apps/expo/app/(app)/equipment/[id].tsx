import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { STATUS_HEX_COLORS, statusLabel } from "@/constants/statusColors";
import { fetchEquipmentById } from "@/lib/api/equipment-list";
import { checkoutEquipment, returnEquipment } from "@/lib/api/equipment-actions";
import { t } from "@/lib/i18n";
import type { Equipment } from "@/types/equipment";

function DetailRow({
  label,
  value,
  textColor,
}: {
  label: string;
  value?: string | null;
  textColor: string;
}) {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, { color: textColor }]} selectable>
        {value}
      </Text>
    </View>
  );
}

export default function EquipmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchEquipmentById(id);
      setEquipment(result);
    } catch {
      setError(t.equipmentDetail.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAction = async (action: "checkout" | "return") => {
    if (!id || actionLoading) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const result = await (action === "checkout" ? checkoutEquipment : returnEquipment)(id);
      setEquipment(result.equipment);
    } catch {
      setActionError(
        action === "checkout"
          ? t.equipmentDetail.toast.checkoutFailed("")
          : t.equipmentDetail.toast.returnFailed(""),
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (error || !equipment) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          {error ?? t.equipmentDetail.notFound}
        </Text>
        <Pressable
          onPress={error ? load : () => router.back()}
          style={[styles.button, { backgroundColor: colors.tint }]}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>
            {error ? t.common.tryAgain : t.equipmentDetail.backToList}
          </Text>
        </Pressable>
      </View>
    );
  }

  const statusColor = STATUS_HEX_COLORS[equipment.status] ?? "#687076";

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(insets.bottom, 24) },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.name, { color: colors.text }]}>{equipment.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusBadgeText}>{statusLabel(equipment.status)}</Text>
        </View>
      </View>

      {equipment.checkedOutByEmail ? (
        <View style={styles.checkedOutBanner}>
          <Text style={styles.checkedOutText}>
            {t.equipmentDetail.checkedOutBy(equipment.checkedOutByEmail)}
          </Text>
        </View>
      ) : null}

      <View style={[styles.section, { borderColor: colors.text + "22" }]}>
        <DetailRow
          label={t.equipmentDetail.serialNumber}
          value={equipment.serialNumber}
          textColor={colors.text}
        />
        <DetailRow
          label={t.equipmentDetail.model}
          value={equipment.model}
          textColor={colors.text}
        />
        <DetailRow
          label={t.equipmentDetail.manufacturer}
          value={equipment.manufacturer}
          textColor={colors.text}
        />
        <DetailRow
          label={t.equipmentDetail.location}
          value={equipment.roomName ?? equipment.location}
          textColor={colors.text}
        />
        {equipment.lastMaintenanceDate ? (
          <DetailRow
            label={t.equipmentDetail.lastMaintenance}
            value={new Date(equipment.lastMaintenanceDate).toLocaleDateString()}
            textColor={colors.text}
          />
        ) : null}
        {equipment.lastSterilizationDate ? (
          <DetailRow
            label={t.equipmentDetail.lastSterilization}
            value={new Date(equipment.lastSterilizationDate).toLocaleDateString()}
            textColor={colors.text}
          />
        ) : null}
      </View>

      {actionError ? (
        <Text style={styles.actionErrorText}>{actionError}</Text>
      ) : null}

      <View style={styles.actionsRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/scan")}
          style={({ pressed }) => [
            styles.secondaryButton,
            { borderColor: colors.tint, opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.tint }]}>
            {t.nav.equipmentScan}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/equipment/${id}/update-status`)}
          style={({ pressed }) => [
            styles.secondaryButton,
            { borderColor: colors.tint, opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.tint }]}>
            {t.equipmentDetail.updateStatusTitle}
          </Text>
        </Pressable>
      </View>

      {equipment.checkedOutById ? (
        <Pressable
          accessibilityRole="button"
          disabled={actionLoading}
          onPress={() => { void handleAction("return"); }}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: "#0891b2", opacity: actionLoading || pressed ? 0.7 : 1 },
          ]}
        >
          {actionLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t.equipmentList.quickAction.return}</Text>
          )}
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          disabled={actionLoading}
          onPress={() => { void handleAction("checkout"); }}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: "#16a34a", opacity: actionLoading || pressed ? 0.7 : 1 },
          ]}
        >
          {actionLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t.equipmentList.quickAction.checkout}</Text>
          )}
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  name: {
    flex: 1,
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  statusBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  checkedOutBanner: {
    backgroundColor: "#fef3c7",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  checkedOutText: {
    color: "#92400e",
    fontSize: 14,
    fontWeight: "500",
  },
  section: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  detailLabel: {
    width: 120,
    fontSize: 14,
    color: "#687076",
    fontWeight: "500",
    flexShrink: 0,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
  },
  button: {
    minHeight: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionErrorText: {
    color: "#dc2626",
    fontSize: 14,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
});
