/**
 * H4 realtime/push feature flags + endpoints.
 *
 * Per ADR-005: SSE realtime is approved at H4; native push ships dark behind a
 * flag (default off) until the monolith endpoint `POST /api/push-subscriptions/native`
 * (vettrack P3-5) is confirmed. Env is read here once so business logic never
 * touches `process.env` directly (CLAUDE.md). Test overrides via
 * `setRealtimeFlagsForTests`.
 */

export interface RealtimeFlags {
  /** SSE realtime transport enabled. Default on (approved at H4, ADR-005). */
  realtimeEnabled: boolean;
  /** Native push registration enabled. Default off until vettrack P3-5 lands. */
  nativePushEnabled: boolean;
  /** SSE stream URL (absolute or path relative to EXPO_PUBLIC_API_URL). */
  realtimeStreamPath: string;
}

const REALTIME_STREAM_PATH = "/api/realtime/stream";
/** Monolith native push subscription endpoint (vettrack P3-5). */
export const NATIVE_PUSH_SUBSCRIPTION_ENDPOINT = "/api/push-subscriptions/native";

function envFlag(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === "") return fallback;
  return value === "true" || value === "1";
}

function readEnvFlags(): RealtimeFlags {
  return {
    realtimeEnabled: envFlag(process.env.EXPO_PUBLIC_REALTIME_ENABLED, true),
    nativePushEnabled: envFlag(process.env.EXPO_PUBLIC_NATIVE_PUSH_ENABLED, false),
    realtimeStreamPath: process.env.EXPO_PUBLIC_REALTIME_STREAM_PATH || REALTIME_STREAM_PATH,
  };
}

let testOverrides: Partial<RealtimeFlags> | null = null;

/** Test hook — override flags without mutating env. Pass `null` to clear. */
export function setRealtimeFlagsForTests(overrides: Partial<RealtimeFlags> | null): void {
  testOverrides = overrides;
}

export function getRealtimeFlags(): RealtimeFlags {
  const base = readEnvFlags();
  return testOverrides ? { ...base, ...testOverrides } : base;
}

export function isRealtimeEnabled(): boolean {
  return getRealtimeFlags().realtimeEnabled;
}

export function isNativePushEnabled(): boolean {
  return getRealtimeFlags().nativePushEnabled;
}

/**
 * Resolve an SSE stream path against `EXPO_PUBLIC_API_URL`, appending the
 * resume token as a `lastEventId` query param. Env access is centralized here
 * (CLAUDE.md: no `process.env` in business logic).
 */
export function resolveRealtimeStreamUrl(path: string, lastEventId?: string): string {
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
  const isAbsolute = path.startsWith("http://") || path.startsWith("https://");
  const url = isAbsolute ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;
  if (!lastEventId) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}lastEventId=${encodeURIComponent(lastEventId)}`;
}
