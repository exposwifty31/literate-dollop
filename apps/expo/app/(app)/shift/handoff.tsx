import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { t } from "@/lib/i18n";
import { fetchCurrentShift, submitShiftHandoff } from "@/lib/api/shift";
import type { ShiftHandoverSummary } from "@/types/equipment";

export default function ShiftHandoffScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [shift, setShift] = useState<ShiftHandoverSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

  const loadShift = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await fetchCurrentShift();
      if (result === null) {
        setLoadError(t.handoff.noShiftError);
      } else {
        setShift(result);
      }
    } catch {
      setLoadError(t.handoff.loadError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadShift();
  }, [loadShift]);

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  const handleConfirm = useCallback(async () => {
    if (!shift?.openShiftSession) {
      setSaveError(t.handoff.noShiftError);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await submitShiftHandoff(shift.openShiftSession.id);
      setSuccess(true);
      // Navigate back after a brief success state
      const id = setTimeout(() => {
        router.back();
      }, 1200);
      setTimeoutId(id);
    } catch (err: unknown) {
      if ((err as { status?: number }).status === 409) {
        setSaveError(t.handoff.alreadyEnded);
      } else {
        setSaveError(t.handoff.saveError);
      }
    } finally {
      setSaving(false);
    }
  }, [shift, router]);

  const unreturnedCount = shift ? shift.unreturned.length : 0;
  const firstFive = shift ? shift.unreturned.slice(0, 5) : [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.text }]}>{t.handoff.title}</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : loadError ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.text }]}>{loadError}</Text>
        </View>
      ) : success ? (
        <View style={styles.center}>
          <Text style={[styles.successText, { color: colors.tint }]}>{t.handoff.success}</Text>
        </View>
      ) : (
        <>
          <View style={[styles.summaryCard, { backgroundColor: colors.background }]}>
            {unreturnedCount === 0 ? (
              <Text style={[styles.noItemsText, { color: colors.text }]}>
                {t.handoff.noItemsOut}
              </Text>
            ) : (
              <>
                <Text style={[styles.warningText, { color: colors.text }]}>
                  {t.handoff.unreturnedWarning(unreturnedCount)}
                </Text>
                {firstFive.map((item) => (
                  <View key={item.id} style={styles.itemRow} testID={`handoff-item-${item.id}`}>
                    <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                      • {item.name}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </View>

          {saveError ? <Text style={styles.saveErrorText}>{saveError}</Text> : null}

          <Pressable
            accessibilityRole="button"
            onPress={handleConfirm}
            disabled={saving}
            style={({ pressed }) => [
              styles.confirmButton,
              { backgroundColor: colors.tint, opacity: saving || pressed ? 0.75 : 1 },
            ]}
            testID="handoff-confirm-button"
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.confirmButtonText}>{t.handoff.confirmCta}</Text>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.cancelButton, { opacity: pressed ? 0.75 : 1 }]}
            testID="handoff-cancel-button"
          >
            <Text style={[styles.cancelButtonText, { color: colors.tint }]}>
              {t.handoff.cancel}
            </Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  summaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
    gap: 8,
  },
  noItemsText: {
    fontSize: 16,
    fontWeight: "500",
  },
  warningText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  itemRow: {
    paddingVertical: 2,
  },
  itemName: {
    fontSize: 15,
    lineHeight: 22,
  },
  saveErrorText: {
    color: "#dc2626",
    fontSize: 14,
    textAlign: "center",
  },
  successText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
  confirmButton: {
    minHeight: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  cancelButton: {
    minHeight: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "500",
  },
});
