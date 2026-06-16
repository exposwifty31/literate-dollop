import type { PendingSyncStore } from "@/lib/offline/pending-sync-store";

/** Node/vitest default — native and web builds use platform-specific modules. */
export async function openPendingSyncStore(): Promise<PendingSyncStore> {
  throw new Error(
    "openPendingSyncStore is unavailable in this runtime; use setPendingSyncStoreForTests in unit tests.",
  );
}
