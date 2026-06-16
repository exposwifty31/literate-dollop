import { PendingSyncStore } from "@/lib/offline/pending-sync-store";

export async function openPendingSyncStore(): Promise<PendingSyncStore> {
  throw new Error(
    "PendingSyncStore requires a native development build (iOS/Android). Web is not supported in Phase 1.",
  );
}
