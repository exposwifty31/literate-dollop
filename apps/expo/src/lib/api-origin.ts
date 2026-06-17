/**
 * Resolve a relative API path to an absolute URL.
 *
 * RN replacement for the web `api-origin.ts` (which keyed off Capacitor /
 * `import.meta.env.VITE_API_ORIGIN`). In Expo the host is configured via
 * `EXPO_PUBLIC_API_URL`; absolute URLs are passed through untouched.
 */
export function resolveApiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
