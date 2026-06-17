import type { PendingSync, PendingSyncCreateInput } from "@vettrack/contracts";
import { assertPendingSyncEnqueueAllowed } from "@/lib/offline-policy";
import { openPendingSyncStore } from "@/lib/offline/open-pending-sync-store";
import type { PendingSyncStore } from "@/lib/offline/pending-sync-store";

let storePromise: Promise<PendingSyncStore> | null = null;

async function getPendingSyncStore(): Promise<PendingSyncStore> {
  if (!storePromise) {
    storePromise = openPendingSyncStore();
  }
  return storePromise;
}

/** Test hook — reset singleton between cases. */
export function resetPendingSyncStoreForTests(): void {
  storePromise = null;
}

export async function setPendingSyncStoreForTests(store: PendingSyncStore): Promise<void> {
  storePromise = Promise.resolve(store);
}

export async function addPendingSync(op: PendingSyncCreateInput): Promise<number> {
  assertPendingSyncEnqueueAllowed({
    type: op.type,
    endpoint: op.endpoint,
    method: op.method,
  });
  const store = await getPendingSyncStore();
  return store.addPendingSync(op);
}

export async function getAllPendingSync() {
  const store = await getPendingSyncStore();
  return store.getAllPendingSync();
}

/** Replay-ordered queue (status `pending`, oldest client_timestamp first). */
export async function getPendingQueue(): Promise<PendingSync[]> {
  const store = await getPendingSyncStore();
  return store.getPendingQueue();
}

export async function getPendingSyncById(id: number): Promise<PendingSync | undefined> {
  const store = await getPendingSyncStore();
  return store.getPendingSync(id);
}

export async function updatePendingSync(id: number, patch: Partial<PendingSync>): Promise<void> {
  const store = await getPendingSyncStore();
  return store.updatePendingSync(id, patch);
}

export async function removePendingSync(id: number): Promise<void> {
  const store = await getPendingSyncStore();
  return store.removePendingSync(id);
}

export async function recoverProcessingPendingSync(): Promise<number> {
  const store = await getPendingSyncStore();
  return store.recoverProcessingPendingSync();
}

export async function runStartupCleanup(): Promise<void> {
  const store = await getPendingSyncStore();
  return store.runStartupCleanup();
}

export async function getConflictRows(): Promise<PendingSync[]> {
  const store = await getPendingSyncStore();
  return store.getConflictRows();
}
