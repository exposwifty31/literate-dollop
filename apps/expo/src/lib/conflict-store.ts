import type { PendingSync, PendingSyncConflictPayload } from "@vettrack/contracts";
import {
  getConflictRows,
  getPendingSyncById,
  updatePendingSync,
} from "@/lib/offline/pending-sync-queue";

/**
 * In-memory mirror of unresolved sync conflicts, hydrated from the SQLite
 * `pending_sync` rows that carry a `conflictPayload`. Ported from the web
 * `conflict-store.ts`; the Dexie reads/writes are swapped for the
 * `PendingSyncStore` and the React `useConflicts` hook is deferred to the
 * hooks layer (kept this module free of React so the sync engine stays
 * node-testable).
 */
export type ConflictItem = {
  id: number;
  endpoint: string;
  method: string;
  serverData: unknown;
  localData: unknown;
};

let conflicts: ConflictItem[] = [];
const listeners: Set<() => void> = new Set();
let hydratePromise: Promise<void> | null = null;

export function subscribeConflicts(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getConflicts(): ConflictItem[] {
  return conflicts;
}

function notify() {
  listeners.forEach((fn) => fn());
}

function rowToConflictItem(row: PendingSync): ConflictItem | null {
  if (row.id === undefined || !row.conflictPayload) return null;
  return {
    id: row.id,
    endpoint: row.endpoint,
    method: row.method,
    serverData: row.conflictPayload.serverData,
    localData: row.conflictPayload.localData,
  };
}

/** Load persisted conflicts from SQLite (survives a full app restart). */
export async function hydrateConflictsFromStore(): Promise<void> {
  const rows = await getConflictRows();
  conflicts = rows
    .map((row) => rowToConflictItem(row))
    .filter((item): item is ConflictItem => item !== null);
  notify();
}

export function ensureConflictsHydrated(): Promise<void> {
  if (!hydratePromise) {
    hydratePromise = hydrateConflictsFromStore().catch(() => {
      hydratePromise = null;
    });
  }
  return hydratePromise;
}

export function addConflict(item: ConflictItem) {
  const existing = conflicts.some((c) => c.id === item.id);
  conflicts = existing
    ? conflicts.map((c) => (c.id === item.id ? item : c))
    : [...conflicts, item];
  notify();
}

export async function removeConflict(id: number): Promise<void> {
  conflicts = conflicts.filter((c) => c.id !== id);
  notify();
  try {
    await updatePendingSync(id, { conflictPayload: null });
  } catch {
    // Row may already be deleted via discard.
  }
}

export async function persistConflictPayload(
  id: number,
  payload: PendingSyncConflictPayload,
): Promise<void> {
  await updatePendingSync(id, {
    status: "conflict",
    conflictPayload: payload,
  });
  const row = await getPendingSyncById(id);
  if (!row) return;
  const item = rowToConflictItem(row);
  if (item) addConflict(item);
}

/** Test hook — reset the in-memory mirror between cases. */
export function resetConflictsForTests(): void {
  conflicts = [];
  hydratePromise = null;
}
