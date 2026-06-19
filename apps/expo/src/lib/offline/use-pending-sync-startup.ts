import { useEffect } from "react";
import { Platform } from "react-native";

import { initializePendingSyncOnStartup } from "@/lib/offline/pending-sync-queue";

/** Runs PendingSyncStore startup recovery once on native app launch. */
export function usePendingSyncStartup(): void {
  useEffect(() => {
    if (Platform.OS === "web") return;
    void initializePendingSyncOnStartup().catch((err: unknown) => {
      console.error("[PendingSync] startup init failed", err);
    });
  }, []);
}
