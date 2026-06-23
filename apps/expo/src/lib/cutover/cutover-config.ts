/**
 * H6 cutover / coexistence banner feature flag.
 *
 * Capacitor (`uk.vettrack.app`) and Expo (`uk.vettrack.expo`) coexist until the
 * H7 kill-switch. The banner messages Expo as the primary app and the legacy
 * Capacitor build as sunsetting. Enabled by default (product approved messaging
 * Expo-as-primary at Gate B); flag-controllable via env. Test overrides via
 * `setCutoverFlagsForTests`.
 */

export interface CutoverFlags {
  bannerEnabled: boolean;
  /**
   * H7 kill-switch. `true` once the Capacitor build (`uk.vettrack.app`) has been
   * retired and Expo (`uk.vettrack.expo`) is the sole store path. **Default
   * false** — product go/no-go authorizes the path, but this flag is flipped to
   * `true` only AFTER the external store cutover completes (see
   * `docs/mobile/capacitor-kill-switch.md`).
   */
  capacitorRetired: boolean;
}

/** Parse a boolean from an env string (`"true"`/`"1"` → true), else `fallback`. */
function envFlag(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === "") return fallback;
  return value === "true" || value === "1";
}

/** Read the cutover flags from `process.env` (the single env-read site). */
function readEnvFlags(): CutoverFlags {
  return {
    bannerEnabled: envFlag(process.env.EXPO_PUBLIC_CUTOVER_BANNER_ENABLED, true),
    capacitorRetired: envFlag(process.env.EXPO_PUBLIC_CAPACITOR_RETIRED, false),
  };
}

let testOverrides: Partial<CutoverFlags> | null = null;

/** Test hook — override flags without mutating env. Pass `null` to clear. */
export function setCutoverFlagsForTests(overrides: Partial<CutoverFlags> | null): void {
  testOverrides = overrides;
}

/** Resolve the effective cutover flags (env, with any test overrides applied). */
export function getCutoverFlags(): CutoverFlags {
  const base = readEnvFlags();
  return testOverrides ? { ...base, ...testOverrides } : base;
}

/** Whether the cutover/coexistence banner is enabled. */
export function isCutoverBannerEnabled(): boolean {
  return getCutoverFlags().bannerEnabled;
}

/** H7 kill-switch — Capacitor retired, Expo is the sole store path. */
export function isCapacitorRetired(): boolean {
  return getCutoverFlags().capacitorRetired;
}
