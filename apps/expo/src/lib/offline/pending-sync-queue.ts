import type { PendingSync, PendingSyncCreateInput } from "@vettrack/contracts";
import { assertPendingSyncEnqueueAllowed } from "@/lib/offline-policy";
import { openPendingSyncStore } from "@/lib/offline/open-pending-sync-store";
import type { PendingSyncStore } from "@/lib/offline/pending-sync-store";

let storePromise: Promise<PendingSyncStore> | null = null;

/**
 * Queue-change notifier — replaces the web Dexie `liveQuery` reactivity.
 * `use-sync` subscribes here and re-reads `getAllPendingSync()` to refresh the
 * queue UI on enqueue / status transitions.
 */
const queueChangeListeners = new Set<() => void>();

export function subscribeQueueChange(listener: () => void): () => void {
  queueChangeListeners.add(listener);
  return () => {
    queueChangeListeners.delete(listener);
  };
}

function notifyQueueChange(): void {
  queueChangeListeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // a listener throwing must not break queue mutations
    }
  });
}

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
  const id = await store.addPendingSync(op);
  notifyQueueChange();
  return id;
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
  await store.updatePendingSync(id, patch);
  notifyQueueChange();
}

export async function removePendingSync(id: number): Promise<void> {
  const store = await getPendingSyncStore();
  await store.removePendingSync(id);
  notifyQueueChange();
}

export async function recoverProcessingPendingSync(): Promise<number> {
  const store = await getPendingSyncStore();
  const count = await store.recoverProcessingPendingSync();
  notifyQueueChange();
  return count;
}

export async function runStartupCleanup(): Promise<void> {
  const store = await getPendingSyncStore();
  return store.runStartupCleanup();
}

export async function getConflictRows(): Promise<PendingSync[]> {
  const store = await getPendingSyncStore();
  return store.getConflictRows();
}
