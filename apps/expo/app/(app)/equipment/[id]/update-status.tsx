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
import { fetchEquipmentById } from "@/lib/api/equipment-list";
import { patchEquipmentStatus } from "@/lib/api/equipment-actions";
import { t } from "@/lib/i18n";
import type { Equipment, EquipmentStatus } from "@/types/equipment";

const STATUSES: EquipmentStatus[] = [
  "ok",
  "issue",
  "maintenance",
  "sterilized",
  "critical",
  "needs_attention",
];

const STATUS_COLORS: Record<EquipmentStatus, string> = {
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
      return t.status.critical;
    case "needs_attention":
      return t.status.needs_attention;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export default function UpdateStatusScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<EquipmentStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    try {
      const eq = await fetchEquipmentById(id);
      setEquipment(eq);
      setSelected(eq.status);
    } catch {
      setLoadError(t.equipmentDetail.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    if (!id || !equipment || !selected || saving) return;
    if (selected === equipment.status) {
      router.back();
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await patchEquipmentStatus(id, selected, equipment.version);
      router.back();
    } catch (err: unknown) {
      const statusCode = (err as { status?: number }).status;
      if (statusCode === 409) {
        setSaveError(t.operationalState.versionConflict);
      } else {
        setSaveError(t.common.toast.unexpectedError);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (loadError || !equipment) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          {loadError ?? t.equipmentDetail.notFound}
        </Text>
        <Pressable
          onPress={load}
          style={[styles.primaryBtn, { backgroundColor: colors.tint }]}
          accessibilityRole="button"
        >
          <Text style={styles.primaryBtnText}>{t.common.tryAgain}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.equipmentName, { color: colors.text }]}>{equipment.name}</Text>
        <Text style={[styles.sectionLabel, { color: "#687076" }]}>
          {t.equipmentDetail.statusLabel}
        </Text>

        {STATUSES.map((status) => {
          const isSelected = selected === status;
          const color = STATUS_COLORS[status];
          return (
            <Pressable
              key={status}
              onPress={() => setSelected(status)}
              style={({ pressed }) => [
                styles.statusRow,
                {
                  borderColor: isSelected ? color : colors.text + "22",
                  backgroundColor: isSelected ? color + "18" : "transparent",
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
            >
              <View
                style={[
                  styles.radioOuter,
                  { borderColor: isSelected ? color : "#9ca3af" },
                ]}
              >
                {isSelected && (
                  <View style={[styles.radioInner, { backgroundColor: color }]} />
                )}
              </View>
              <View style={[styles.statusDot, { backgroundColor: color }]} />
              <Text style={[styles.statusLabelText, { color: isSelected ? color : colors.text }]}>
                {statusLabel(status)}
              </Text>
            </Pressable>
          );
        })}

        {saveError ? (
          <Text style={styles.saveError}>{saveError}</Text>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 16), borderTopColor: colors.text + "18" },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={[styles.secondaryBtn, { borderColor: colors.text + "33" }]}
          accessibilityRole="button"
        >
          <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
            {t.common.cancel}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => { void handleSave(); }}
          disabled={saving || !selected}
          style={({ pressed }) => [
            styles.primaryBtn,
            styles.footerPrimary,
            {
              backgroundColor: colors.tint,
              opacity: saving || pressed ? 0.7 : 1,
            },
          ]}
          accessibilityRole="button"
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>{t.common.save}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  equipmentName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderRadius: 12,
    minHeight: 52,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusLabelText: {
    fontSize: 15,
    fontWeight: "500",
  },
  saveError: {
    color: "#dc2626",
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  secondaryBtn: {
    minHeight: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    borderWidth: 1.5,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
  primaryBtn: {
    minHeight: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footerPrimary: {
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
});
