import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Synchronous-read storage shim backed by AsyncStorage.
 *
 * The web modules ported from vettrack (`offline-session`, `user-settings-storage`)
 * relied on the synchronous `localStorage` API exposed via `safe-browser`.
 * React Native has no synchronous persistent store, so this keeps an in-memory
 * cache that reads synchronously and writes through to AsyncStorage in the
 * background. Call `hydrateSafeStorage()` once at app startup (before the first
 * synchronous read) to populate the cache.
 */
const cache = new Map<string, string>();

/** Keys that must be available to synchronous readers after hydration. */
export const HYDRATED_STORAGE_KEYS = ["vt_session", "vettrack-settings"] as const;

export async function hydrateSafeStorage(
  keys: readonly string[] = HYDRATED_STORAGE_KEYS,
): Promise<void> {
  try {
    const pairs = await AsyncStorage.multiGet([...keys]);
    for (const [key, value] of pairs) {
      if (value != null) cache.set(key, value);
    }
  } catch {
    // best-effort hydration; readers fall back to defaults
  }
}

export function safeStorageGetItem(key: string): string | null {
  return cache.has(key) ? (cache.get(key) as string) : null;
}

export function safeStorageSetItem(key: string, value: string): boolean {
  cache.set(key, value);
  void AsyncStorage.setItem(key, value).catch(() => {});
  return true;
}

export function safeStorageRemoveItem(key: string): boolean {
  cache.delete(key);
  void AsyncStorage.removeItem(key).catch(() => {});
  return true;
}

/** Test hook — clear the in-memory cache between cases. */
export function resetSafeStorageForTests(): void {
  cache.clear();
}
