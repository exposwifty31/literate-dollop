import {
  PENDING_SYNC_MAX_RETRIES,
  type PendingSync,
  type PendingSyncConflictPayload,
} from "@vettrack/contracts";
import { resolveApiUrl } from "@/lib/api-origin";
import { getAuthHeaders } from "@/lib/auth-store";
import {
  getPendingQueue,
  recoverProcessingPendingSync,
  removePendingSync,
  runStartupCleanup,
  updatePendingSync,
} from "@/lib/offline/pending-sync-queue";
import {
  addConflict,
  ensureConflictsHydrated,
  persistConflictPayload,
} from "@/lib/conflict-store";
import { isOnline } from "@/lib/network";

/**
 * Offline replay engine — ported from the web `src/lib/sync-engine.ts`.
 *
 * The FIFO queue, retry budget, circuit breaker, burst windowing and crash
 * recovery are preserved byte-for-byte in spirit. The web-only surfaces are
 * swapped per ADR 001 and the Expo doctrine:
 *
 *   - Dexie (`offline-db`)        → `PendingSyncStore` (expo-sqlite)
 *   - `sonner` toast + i18n `t`   → injected `SyncNotifier` seam
 *   - `@sentry/react`             → injected `SyncReporter` seam
 *   - `@tanstack/react-query`     → injected cache-invalidation seam
 *   - `navigator.locks`           → dropped (RN JS is single-threaded; the
 *                                    `syncing` guard is sufficient)
 *   - `window` `online` listener  → injected `subscribeOnline` seam (NetInfo)
 *   - Phase 9 post-sync reconcile → dropped (realtime-adjacent; no SSE in
 *                                    Expo until Phase 6)
 */

const MAX_RETRIES = PENDING_SYNC_MAX_RETRIES;
const RETRY_DELAYS_MS = [2000, 5000, 10000];
const BURST_LIMIT = 50;
const BURST_DELAY_MS = 500;
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_COOLDOWN_MS = 20_000;
const ITEM_TIMEOUT_MS = 30_000;

// --- Seams (injected by the app via initSyncEngine) -----------------------

export interface SyncFailureInfo {
  endpoint: string;
  method: string;
  itemType: string;
  retries?: number;
  errorMessage?: string;
}

/** User-facing notifications. The app implementation wires toast + i18n `t`. */
export interface SyncNotifier {
  circuitOpened(cooldownMs: number): void;
  circuitResumed(): void;
  permanentFailure(): void;
  sessionExpired(): void;
}

/** Telemetry / error reporting. The app implementation wires Sentry + counters. */
export interface SyncReporter {
  circuitOpen(circuitOpenUntil: number): void;
  circuitReset(): void;
  permanentFailure(info: SyncFailureInfo): void;
  permissionDenied(info: SyncFailureInfo): void;
  exception(error: unknown, info: SyncFailureInfo): void;
  itemSuccess(): void;
  itemConflict(): void;
  itemDead(): void;
}

export interface SyncEngineConfig {
  notifier?: Partial<SyncNotifier>;
  reporter?: Partial<SyncReporter>;
  /** Invalidate the given query keys after a replay burst (react-query seam). */
  invalidateQueries?: (keys: string[][]) => void;
  /** Drop all cached queries (called on 401, replaces `queryClient.clear()`). */
  clearQueries?: () => void;
  /** App-side cleanup on auth halt (e.g. clear the offline session). */
  onAuthHalt?: () => void;
  /** Subscribe to connectivity-restored events (NetInfo). Returns unsubscribe. */
  subscribeOnline?: (handler: () => void) => () => void;
}

const noopNotifier: SyncNotifier = {
  circuitOpened: () => {},
  circuitResumed: () => {},
  permanentFailure: () => {},
  sessionExpired: () => {},
};

const noopReporter: SyncReporter = {
  circuitOpen: () => {},
  circuitReset: () => {},
  permanentFailure: () => {},
  permissionDenied: () => {},
  exception: () => {},
  itemSuccess: () => {},
  itemConflict: () => {},
  itemDead: () => {},
};

let notifier: SyncNotifier = noopNotifier;
let reporter: SyncReporter = noopReporter;
let invalidateQueries: ((keys: string[][]) => void) | null = null;
let clearQueries: (() => void) | null = null;
let onAuthHalt: (() => void) | null = null;

// --- Listeners -------------------------------------------------------------

type SyncListener = () => void;
const listeners: Set<SyncListener> = new Set();

export function onSyncStateChange(fn: SyncListener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

// --- Engine state ----------------------------------------------------------

let syncing = false;
let haltQueue = false;

let consecutiveFailures = 0;
let circuitOpenUntil = 0;
let circuitResetTimerId: ReturnType<typeof setTimeout> | null = null;

let batchCurrent = 0;
let batchTotal = 0;
let runTotal = 0;
let isInRun = false;

type AuthStateGetter = () => { isSignedIn: boolean; isOfflineSession: boolean } | null;
let authStateGetter: AuthStateGetter | null = null;

export function setAuthStateRef(getter: AuthStateGetter) {
  authStateGetter = getter;
}

export function clearHaltQueue() {
  haltQueue = false;
}

export function getSyncProgress() {
  return {
    isSyncing: syncing,
    batchCurrent,
    batchTotal,
    isCircuitOpen: Date.now() < circuitOpenUntil,
    circuitResetsAt: circuitOpenUntil,
  };
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function jitteredDelay(base: number): number {
  return Math.round(base * (1 + Math.random() * 0.5));
}

function openCircuit() {
  consecutiveFailures = 0;
  circuitOpenUntil = Date.now() + CIRCUIT_COOLDOWN_MS;
  notifyListeners();

  notifier.circuitOpened(CIRCUIT_COOLDOWN_MS);
  reporter.circuitOpen(circuitOpenUntil);

  if (circuitResetTimerId) clearTimeout(circuitResetTimerId);
  circuitResetTimerId = setTimeout(() => {
    circuitResetTimerId = null;
    reporter.circuitReset();
    notifyListeners();
    notifier.circuitResumed();
    if (isOnline() && !haltQueue) processQueue().catch(() => {});
  }, CIRCUIT_COOLDOWN_MS);
}

async function processQueueBody(): Promise<void> {
  if (syncing || !isOnline()) return;

  if (Date.now() < circuitOpenUntil) {
    notifyListeners();
    return;
  }

  if (haltQueue) return;

  if (!authStateGetter) return;
  const authSnap = authStateGetter();
  if (!authSnap?.isSignedIn || authSnap.isOfflineSession) return;
  const authHeaders = getAuthHeaders();
  if (!authHeaders.Authorization) return;

  syncing = true;
  notifyListeners();

  try {
    const allPending = await getPendingQueue();
    if (allPending.length === 0) {
      isInRun = false;
      runTotal = 0;
      return;
    }

    if (!isInRun) {
      isInRun = true;
      runTotal = allPending.length;
    }

    batchTotal = runTotal;
    batchCurrent = Math.max(0, runTotal - allPending.length);

    const burst = allPending.slice(0, BURST_LIMIT);
    const hasMore = allPending.length > BURST_LIMIT;

    for (const item of burst) {
      if (haltQueue) break;
      if (Date.now() < circuitOpenUntil) break;

      const result = await processSingleItemWithRetry(item);

      if (result === "success") {
        consecutiveFailures = 0;
        reporter.itemSuccess();
      } else if (result === "conflict") {
        consecutiveFailures = 0;
        reporter.itemConflict();
      } else if (result === "auth_halt") {
        reporter.itemDead();
        break;
      } else if (result === "permission_error" || result === "client_error") {
        consecutiveFailures = 0;
        reporter.itemDead();
      } else if (result === "transient_failure") {
        consecutiveFailures++;
        if (consecutiveFailures >= CIRCUIT_THRESHOLD) {
          openCircuit();
          break;
        }
      }

      batchCurrent++;
      notifyListeners();
    }

    if (hasMore && !haltQueue && Date.now() >= circuitOpenUntil) {
      setTimeout(() => {
        processQueue().catch(() => {});
      }, BURST_DELAY_MS);
    } else {
      isInRun = false;
      runTotal = 0;
    }

    if (invalidateQueries && !haltQueue) {
      const baseKeys: string[][] = [
        ["/api/equipment"],
        ["/api/equipment/my"],
        ["/api/equipment/paginated"],
      ];
      const processedIds = burst
        .map((item) => extractEquipmentId(item.endpoint))
        .filter((id): id is string => !!id);
      const uniqueIds = [...new Set(processedIds)];
      for (const id of uniqueIds) {
        baseKeys.push([`/api/equipment/${id}`]);
        baseKeys.push([`/api/equipment/${id}/logs`]);
      }
      invalidateQueries(baseKeys);
    }
  } finally {
    syncing = false;
    if (!isInRun) {
      batchCurrent = 0;
      batchTotal = 0;
    }
    notifyListeners();
  }
}

export async function processQueue(): Promise<void> {
  // RN JS is single-threaded; the `syncing` guard inside `processQueueBody`
  // is the equivalent of the web `navigator.locks` exclusive lock.
  await processQueueBody();
}

function extractEquipmentId(endpoint: string): string | null {
  const match = endpoint.match(/\/api\/equipment\/([^/]+)/);
  return match ? match[1] : null;
}

type ItemResult =
  | "success"
  | "conflict"
  | "auth_halt"
  | "permission_error"
  | "client_error"
  | "transient_failure";

async function processSingleItemWithRetry(item: PendingSync): Promise<ItemResult> {
  if (!item.id) return "transient_failure";

  let currentRetries = item.retries || 0;
  let lastResult: ItemResult = "transient_failure";

  while (currentRetries < MAX_RETRIES && isOnline() && !haltQueue) {
    const result = await attemptSync(item);
    lastResult = result;

    if (result === "success") {
      try {
        await updatePendingSync(item.id, { status: "synced" });
      } catch {}
      setTimeout(() => removePendingSync(item.id!), 3000);
      return "success";
    }

    if (
      result === "conflict" ||
      result === "auth_halt" ||
      result === "client_error" ||
      result === "permission_error"
    ) {
      return result;
    }

    currentRetries++;
    try {
      await updatePendingSync(item.id, {
        status: "pending",
        retries: currentRetries,
      });
    } catch {}
    notifyListeners();

    if (currentRetries >= MAX_RETRIES) {
      try {
        await updatePendingSync(item.id, {
          status: "dead",
          retries: currentRetries,
          errorMessage: `Failed after ${MAX_RETRIES} attempts`,
        });
      } catch {}
      reporter.itemDead();
      // S4 — permanent sync failures feed the 7-day failure-rate metric.
      reporter.permanentFailure({
        endpoint: item.endpoint,
        method: item.method,
        itemType: item.type,
        retries: currentRetries,
        errorMessage: `Failed after ${MAX_RETRIES} attempts`,
      });
      // Surface the permanent failure to the operator — otherwise an action
      // is dropped with no feedback.
      notifier.permanentFailure();
      return "transient_failure";
    }

    if (isOnline()) {
      const base =
        RETRY_DELAYS_MS[currentRetries - 1] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
      await sleep(jitteredDelay(base));
    } else {
      return "transient_failure";
    }
  }

  return lastResult;
}

async function attemptSync(item: PendingSync): Promise<ItemResult> {
  if (!item.id) return "transient_failure";

  try {
    await updatePendingSync(item.id, { status: "processing" });
  } catch {}

  const liveHeaders = getAuthHeaders();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...liveHeaders,
  };
  if (item.clientTimestamp) headers["X-Client-Timestamp"] = String(item.clientTimestamp);
  const idempotencyKey = item.idempotencyKey?.trim();
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  const clientMutationId = item.clientMutationId?.trim();
  if (clientMutationId) headers["X-Client-Mutation-Id"] = clientMutationId;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ITEM_TIMEOUT_MS);
    let res: Response;
    try {
      // Intentional raw fetch: replays the exact queued endpoint/method.
      // Routing through `request()` would re-enter the offline queue.
      res = await fetch(resolveApiUrl(item.endpoint), {
        method: item.method,
        headers,
        body: item.body || undefined,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (res.ok) {
      return "success";
    }

    if (res.status === 409) {
      const serverData = await res.json().catch(() => ({}));
      const localData = JSON.parse(item.body || "{}");
      const conflictPayload: PendingSyncConflictPayload = {
        serverData,
        localData,
        capturedAt: Date.now(),
      };
      const errorMessage =
        (serverData as Record<string, string>).error ||
        "Conflict: another change was made to this item";

      try {
        await persistConflictPayload(item.id, conflictPayload);
        await updatePendingSync(item.id, { errorMessage });
        addConflict({
          id: item.id,
          endpoint: item.endpoint,
          method: item.method,
          serverData,
          localData,
        });
      } catch {}

      return "conflict";
    }

    if (res.status === 401) {
      haltQueue = true;
      onAuthHalt?.();
      clearQueries?.();
      // Non-retryable client error — terminal `dead` (operator must re-auth).
      await updatePendingSync(item.id, {
        status: "dead",
        errorMessage: "Auth error — please sign in again",
      });
      notifier.sessionExpired();
      return "auth_halt";
    }

    if (res.status === 403) {
      const errData = await res.json().catch(() => ({}));
      const errMsg = errData.error || `Permission denied: ${res.status}`;
      reporter.permissionDenied({
        endpoint: item.endpoint,
        method: item.method,
        itemType: item.type,
        errorMessage: errMsg,
      });
      // Non-retryable 4xx — terminal `dead` (not `failed`; `failed` is retryable-only).
      await updatePendingSync(item.id, {
        status: "dead",
        errorMessage: errMsg,
      });
      return "permission_error";
    }

    if (res.status >= 400 && res.status < 500) {
      const errData = await res.json().catch(() => ({}));
      const errMsg = errData.error || `Request failed: ${res.status}`;
      await updatePendingSync(item.id, {
        status: "dead",
        errorMessage: errMsg,
      });
      return "client_error";
    }

    return "transient_failure";
  } catch (err) {
    const isAbort = err instanceof DOMException && err.name === "AbortError";
    if (!isAbort) {
      reporter.exception(err, {
        endpoint: item.endpoint,
        method: item.method,
        itemType: item.type,
      });
    }
    return "transient_failure";
  }
}

export function initSyncEngine(config: SyncEngineConfig = {}): () => void {
  notifier = { ...noopNotifier, ...config.notifier };
  reporter = { ...noopReporter, ...config.reporter };
  invalidateQueries = config.invalidateQueries ?? null;
  clearQueries = config.clearQueries ?? null;
  onAuthHalt = config.onAuthHalt ?? null;

  const handleOnline = () => {
    processQueue().catch(() => {});
  };
  const unsubscribeOnline = config.subscribeOnline?.(handleOnline);

  // Order: recover in-flight claims → hydrate conflicts → cleanup → first replay.
  // Do not call processQueue() before recovery completes — getPendingQueue()
  // only sees `pending` rows; recovered claims would be missed on the first pass.
  void recoverProcessingPendingSync()
    .then(() => ensureConflictsHydrated())
    .then(() => runStartupCleanup())
    .then(() => {
      if (isOnline()) processQueue().catch(() => {});
    })
    .catch(() => {});

  return () => {
    unsubscribeOnline?.();
    if (circuitResetTimerId) clearTimeout(circuitResetTimerId);
  };
}

/** Test hook — reset module-level engine state between cases. */
export function resetSyncEngineForTests(): void {
  syncing = false;
  haltQueue = false;
  consecutiveFailures = 0;
  circuitOpenUntil = 0;
  if (circuitResetTimerId) clearTimeout(circuitResetTimerId);
  circuitResetTimerId = null;
  batchCurrent = 0;
  batchTotal = 0;
  runTotal = 0;
  isInRun = false;
  authStateGetter = null;
  listeners.clear();
  notifier = noopNotifier;
  reporter = noopReporter;
  invalidateQueries = null;
  clearQueries = null;
  onAuthHalt = null;
}
