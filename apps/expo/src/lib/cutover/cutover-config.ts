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
}

function envFlag(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === "") return fallback;
  return value === "true" || value === "1";
}

function readEnvFlags(): CutoverFlags {
  return {
    bannerEnabled: envFlag(process.env.EXPO_PUBLIC_CUTOVER_BANNER_ENABLED, true),
  };
}

let testOverrides: Partial<CutoverFlags> | null = null;

/** Test hook — override flags without mutating env. Pass `null` to clear. */
export function setCutoverFlagsForTests(overrides: Partial<CutoverFlags> | null): void {
  testOverrides = overrides;
}

export function getCutoverFlags(): CutoverFlags {
  const base = readEnvFlags();
  return testOverrides ? { ...base, ...testOverrides } : base;
}

export function isCutoverBannerEnabled(): boolean {
  return getCutoverFlags().bannerEnabled;
}
