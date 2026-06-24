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

export async function updatePendingSync(id: number, patch: Partial<PendingSync>): Promise<void> {
  const store = await getPendingSyncStore();
  await store.updatePendingSync(id, patch);
}

export async function removePendingSync(id: number): Promise<void> {
  const store = await getPendingSyncStore();
  await store.removePendingSync(id);
}

export async function getPendingQueue() {
  const store = await getPendingSyncStore();
  return store.getPendingQueue();
}

/** ADR 001 startup guard — recover stuck rows and prune synced/dead entries. */
export async function initializePendingSyncOnStartup(): Promise<void> {
  const store = await getPendingSyncStore();
  await store.recoverProcessingPendingSync();
  await store.runStartupCleanup();
}
