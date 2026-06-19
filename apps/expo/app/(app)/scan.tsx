import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { scanEquipment } from "@/lib/api/equipment-scan";
import { extractEquipmentId } from "@/lib/equipment-id";
import { t } from "@/lib/i18n";
import { getAllPendingSync } from "@/lib/offline/pending-sync-queue";
import { isNfcSupportedSync, primeNfcSupportCache, readNfcOnce } from "@/lib/nfc-platform";
import { getSyncProgress, onSyncStateChange, processQueue } from "@/lib/sync-engine";

type ScanState =
  | "idle"
  | "scanning"
  | "resolved"
  | "submitting"
  | "success"
  | "queued"
  | "synced"
  | "failed"
  | "unsupported";

export default function ScanScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const abortRef = useRef<AbortController | null>(null);

  const [state, setState] = useState<ScanState>("idle");
  const [equipmentId, setEquipmentId] = useState<string | null>(null);
  const [equipmentName, setEquipmentName] = useState<string | null>(null);
  const [pendingSyncId, setPendingSyncId] = useState<number | null>(null);

  useEffect(() => {
    void primeNfcSupportCache().then(() => {
      if (!isNfcSupportedSync()) {
        setState("unsupported");
      }
    });
  }, []);

  useEffect(() => {
    if (state !== "queued" || pendingSyncId === null) return;
    return onSyncStateChange(() => {
      void (async () => {
        const rows = await getAllPendingSync();
        const row = rows.find((entry) => entry.id === pendingSyncId);
        if (!row || row.status === "synced") {
          setState("synced");
        } else if (row.status === "dead" || row.status === "failed") {
          setState("failed");
        } else if (!getSyncProgress().isSyncing && row.status === "pending") {
          // Still queued — wait for next sync tick.
        }
      })();
    });
  }, [state, pendingSyncId]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const resetToIdle = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setEquipmentId(null);
    setEquipmentName(null);
    setPendingSyncId(null);
    setState(isNfcSupportedSync() ? "idle" : "unsupported");
  }, []);

  const handleScan = useCallback(async () => {
    await primeNfcSupportCache();
    if (!isNfcSupportedSync()) {
      setState("unsupported");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState("scanning");

    try {
      const payload = await readNfcOnce({ signal: controller.signal });
      const raw = payload.url ?? payload.text ?? payload.tagId ?? "";
      const id = extractEquipmentId(raw);
      if (!id) {
        setState("idle");
        return;
      }
      setEquipmentId(id);
      setState("resolved");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setState(isNfcSupportedSync() ? "idle" : "unsupported");
    }
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!equipmentId) return;
    setState("submitting");
    try {
      const result = await scanEquipment(equipmentId, { status: "ok" });
      if (result.kind === "synced") {
        setEquipmentName(result.equipment.name ?? null);
        setState("success");
        return;
      }
      setPendingSyncId(result.pendingSyncId);
      setState("queued");
    } catch {
      setState("failed");
    }
  }, [equipmentId]);

  const handleRetrySync = useCallback(() => {
    void processQueue();
    setState("queued");
  }, []);

  const title = (() => {
    switch (state) {
      case "success":
        return t.scanScreen.successTitle;
      case "queued":
        return t.scanScreen.queuedTitle;
      case "synced":
        return t.scanScreen.syncedTitle;
      case "failed":
        return t.scanScreen.failedTitle;
      case "unsupported":
        return t.scanScreen.unsupported;
      case "idle":
      case "scanning":
      case "resolved":
      case "submitting":
        return t.scanScreen.title;
      default: {
        const _exhaustive: never = state;
        return _exhaustive;
      }
    }
  })();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 16) },
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

        {state === "resolved" && equipmentId ? (
          <View style={styles.resolvedBlock}>
            <Text style={[styles.label, { color: colors.text }]}>{t.scanScreen.resolvedLabel}</Text>
            <Text style={[styles.equipmentId, { color: colors.text }]} selectable>
              {equipmentId}
            </Text>
          </View>
        ) : null}

        {equipmentName ? (
          <Text style={[styles.subtitle, { color: colors.text }]}>{equipmentName}</Text>
        ) : null}

        {(state === "scanning" || state === "submitting") && (
          <ActivityIndicator size="large" style={styles.spinner} />
        )}

        {state === "scanning" ? (
          <Text style={[styles.hint, { color: colors.text }]}>{t.scanScreen.scanning}</Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        {(state === "idle" || state === "failed") && (
          <Pressable
            accessibilityRole="button"
            onPress={state === "failed" ? handleRetrySync : handleScan}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {state === "failed" ? t.scanScreen.retry : t.scanScreen.scanCta}
            </Text>
          </Pressable>
        )}

        {state === "resolved" && (
          <>
            <Pressable
              accessibilityRole="button"
              onPress={handleConfirm}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={styles.primaryButtonText}>{t.scanScreen.confirmCta}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={resetToIdle}
              style={({ pressed }) => [styles.secondaryButton, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                {t.scanScreen.cancel}
              </Text>
            </Pressable>
          </>
        )}

        {(state === "success" || state === "synced" || state === "queued") && (
          <Pressable
            accessibilityRole="button"
            onPress={resetToIdle}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.primaryButtonText}>{t.scanScreen.scanCta}</Text>
          </Pressable>
        )}

        {state === "unsupported" && (
          <Text style={[styles.hint, { color: colors.text }]}>{t.scanScreen.unsupported}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    opacity: 0.9,
  },
  label: {
    fontSize: 14,
    opacity: 0.7,
  },
  equipmentId: {
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
  },
  resolvedBlock: {
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  hint: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.85,
  },
  spinner: {
    marginTop: 8,
  },
  actions: {
    gap: 12,
    paddingTop: 16,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  secondaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
