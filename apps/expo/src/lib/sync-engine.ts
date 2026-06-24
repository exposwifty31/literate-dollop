import type { PendingSync } from "@vettrack/contracts";
import { PENDING_SYNC_MAX_RETRIES } from "@vettrack/contracts";
import { getAuthHeaders } from "@/lib/auth/get-auth-headers";
import {
  getPendingQueue,
  removePendingSync,
  updatePendingSync,
} from "@/lib/offline/pending-sync-queue";
import { isOnline } from "@/lib/network";
import { notifySyncPaused, notifySyncPermanentFailure } from "@/lib/sync-ui-seam";

const MAX_RETRIES = PENDING_SYNC_MAX_RETRIES;
const RETRY_DELAYS_MS = [2000, 5000, 10000];
const BURST_LIMIT = 50;
const BURST_DELAY_MS = 500;
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_COOLDOWN_MS = 20_000;
const ITEM_TIMEOUT_MS = 30_000;

type SyncListener = () => void;
const listeners = new Set<SyncListener>();

export function onSyncStateChange(fn: SyncListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notifyListeners(): void {
  listeners.forEach((fn) => fn());
}

let syncing = false;
let haltQueue = false;
let consecutiveFailures = 0;
let circuitOpenUntil = 0;
let circuitResetTimerId: ReturnType<typeof setTimeout> | null = null;
let batchCurrent = 0;
let batchTotal = 0;
let runTotal = 0;
let isInRun = false;
let burstContinuationScheduled = false;

type AuthStateGetter = () => { isSignedIn: boolean; isOfflineSession: boolean } | null;
let authStateGetter: AuthStateGetter | null = null;

export function setAuthStateRef(getter: AuthStateGetter): void {
  authStateGetter = getter;
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

function resolveApiUrl(path: string): string {
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jitteredDelay(base: number): number {
  return Math.round(base * (1 + Math.random() * 0.5));
}

function openCircuit(): void {
  consecutiveFailures = 0;
  circuitOpenUntil = Date.now() + CIRCUIT_COOLDOWN_MS;
  notifyListeners();
  notifySyncPaused("Sync paused — too many errors", `Retry in ${CIRCUIT_COOLDOWN_MS / 1000}s`);

  if (circuitResetTimerId) clearTimeout(circuitResetTimerId);
  circuitResetTimerId = setTimeout(() => {
    circuitResetTimerId = null;
    notifyListeners();
    if (isOnline() && !haltQueue) void processQueue();
  }, CIRCUIT_COOLDOWN_MS);
}

type ItemResult =
  | "success"
  | "conflict"
  | "auth_halt"
  | "permission_error"
  | "client_error"
  | "transient_failure";

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
  const authHeaders = await getAuthHeaders();
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

      if (result === "success" || result === "conflict") {
        consecutiveFailures = 0;
      } else if (
        result === "auth_halt" ||
        result === "permission_error" ||
        result === "client_error"
      ) {
        consecutiveFailures = 0;
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
      burstContinuationScheduled = true;
      setTimeout(() => {
        burstContinuationScheduled = false;
        void processQueue();
      }, BURST_DELAY_MS);
    } else {
      isInRun = false;
      runTotal = 0;
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
      } catch {
        // Best-effort status update.
      }
      setTimeout(() => {
        void removePendingSync(item.id!);
      }, 3000);
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
    } catch {
      // Best-effort retry bookkeeping.
    }
    notifyListeners();

    if (currentRetries >= MAX_RETRIES) {
      try {
        await updatePendingSync(item.id, {
          status: "dead",
          retries: currentRetries,
          errorMessage: `Failed after ${MAX_RETRIES} attempts`,
        });
      } catch {
        // Best-effort terminal status.
      }
      notifySyncPermanentFailure(`Failed after ${MAX_RETRIES} attempts: ${item.endpoint}`);
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
  } catch {
    // Best-effort claim.
  }

  const liveHeaders = await getAuthHeaders();
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
      await updatePendingSync(item.id, {
        status: "failed",
        structuredError: { code: "conflict" },
      });
      return "conflict";
    }

    if (res.status === 401) {
      haltQueue = true;
      await updatePendingSync(item.id, {
        status: "dead",
        errorMessage: "Auth error — please sign in again",
      });
      return "auth_halt";
    }

    if (res.status === 403) {
      const errData = (await res.json().catch(() => ({}))) as { error?: string };
      await updatePendingSync(item.id, {
        status: "dead",
        errorMessage: errData.error ?? `Permission denied: ${res.status}`,
      });
      return "permission_error";
    }

    if (res.status >= 400 && res.status < 500) {
      const errData = (await res.json().catch(() => ({}))) as { error?: string };
      await updatePendingSync(item.id, {
        status: "dead",
        errorMessage: errData.error ?? `Request failed: ${res.status}`,
      });
      return "client_error";
    }

    return "transient_failure";
  } catch {
    return "transient_failure";
  }
}

export async function processQueue(): Promise<void> {
  await processQueueBody();
}
