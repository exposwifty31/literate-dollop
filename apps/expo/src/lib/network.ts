import NetInfo from "@react-native-community/netinfo";

export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Request timed out after ${ms}ms`);
    this.name = "TimeoutError";
  }
}

export class OfflineResponseError extends Error {
  constructor() {
    super("Offline response received");
    this.name = "OfflineResponseError";
  }
}

let forcedOffline = false;
let cachedOnline = true;

/** Test hook — force offline classification without mutating NetInfo. */
export function setForcedOfflineForTests(value: boolean): void {
  forcedOffline = value;
}

function readOnline(isConnected: boolean | null, isInternetReachable: boolean | null): boolean {
  if (isConnected !== true) return false;
  if (isInternetReachable === false) return false;
  return true;
}

/** Call once at app startup (from use-sync or root layout). */
export async function primeNetworkState(): Promise<void> {
  const state = await NetInfo.fetch();
  cachedOnline = readOnline(state.isConnected, state.isInternetReachable);
}

export function isOnline(): boolean {
  if (forcedOffline) return false;
  return cachedOnline;
}

export function subscribeOnline(callback: (online: boolean) => void): () => void {
  return NetInfo.addEventListener((state) => {
    cachedOnline = readOnline(state.isConnected, state.isInternetReachable);
    callback(isOnline());
  });
}

// Keep cachedOnline in sync with NetInfo after primeNetworkState.
NetInfo.addEventListener((state) => {
  cachedOnline = readOnline(state.isConnected, state.isInternetReachable);
});

export function isNetworkError(err: unknown): boolean {
  if (err instanceof TimeoutError) return true;
  if (err instanceof OfflineResponseError) return true;
  if (!isOnline()) return true;
  if (err instanceof TypeError) return true;
  if (err instanceof Error && err.message.includes("Failed to fetch")) return true;
  return false;
}

export function isOfflineResponse(status: number, payload: unknown): boolean {
  if (status !== 503) return false;
  if (!payload || typeof payload !== "object") return false;
  const candidate = payload as { offline?: unknown; error?: unknown };
  if (candidate.offline === true) return true;
  return (
    typeof candidate.error === "string" &&
    candidate.error.toLowerCase().includes("network unavailable")
  );
}
