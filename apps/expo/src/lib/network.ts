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
let nativeModuleWarned = false;

/**
 * The NetInfo native module (RNCNetInfo) is null until a fresh native build links it in.
 * Accessing it then throws. This module is imported transitively by the root layout, so an
 * uncaught throw here takes down the entire expo-router tree ("missing default export" on every
 * route + "Cannot read property 'ErrorBoundary' of undefined"). Guard every access: if the
 * native module is unavailable, warn once and degrade to "assume online" so the app still boots.
 * The real fix for a missing module is a native rebuild — see the build notes / pnpm ios.
 */
function withNetInfo<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch (err) {
    if (!nativeModuleWarned) {
      nativeModuleWarned = true;
      console.warn(
        "[network] NetInfo native module unavailable — connectivity assumed online. " +
          "Rebuild the native app (pnpm ios / pnpm android) to restore offline detection.",
        err,
      );
    }
    return fallback;
  }
}

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
  try {
    const state = await NetInfo.fetch();
    cachedOnline = readOnline(state.isConnected, state.isInternetReachable);
  } catch (err) {
    withNetInfo(() => {
      throw err;
    }, undefined);
  }
}

export function isOnline(): boolean {
  if (forcedOffline) return false;
  return cachedOnline;
}

export function subscribeOnline(callback: (online: boolean) => void): () => void {
  return withNetInfo(
    () =>
      NetInfo.addEventListener((state) => {
        cachedOnline = readOnline(state.isConnected, state.isInternetReachable);
        callback(isOnline());
      }),
    () => {},
  );
}

// Keep cachedOnline in sync with NetInfo after primeNetworkState.
withNetInfo(
  () =>
    NetInfo.addEventListener((state) => {
      cachedOnline = readOnline(state.isConnected, state.isInternetReachable);
    }),
  () => {},
);

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
