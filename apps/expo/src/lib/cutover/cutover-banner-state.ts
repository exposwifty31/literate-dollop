/**
 * Visibility logic for the H6 cutover/coexistence banner. Kept separate from the
 * `.tsx` component so the decision is unit-testable in the node test env.
 *
 * The banner shows while it is flag-enabled and the user has not dismissed it.
 * Dismissal persists across launches via AsyncStorage (same approach as the
 * locale store in `i18n.ts`).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isCapacitorRetired, isCutoverBannerEnabled } from "@/lib/cutover/cutover-config";

const DISMISS_KEY = "vt_cutover_banner_dismissed_v1";

/**
 * Which copy the banner shows:
 * - `coexistence` — Capacitor still live; "this is now the primary app".
 * - `retired` — H7 kill-switch on; "the previous app has been retired".
 */
export type CutoverBannerVariant = "coexistence" | "retired";

export function getCutoverBannerVariant(): CutoverBannerVariant {
  return isCapacitorRetired() ? "retired" : "coexistence";
}

/** Pure decision: visible when enabled and not dismissed. */
export function computeCutoverBannerVisible(opts: { enabled: boolean; dismissed: boolean }): boolean {
  return opts.enabled && !opts.dismissed;
}

export async function isCutoverBannerDismissed(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(DISMISS_KEY)) === "1";
  } catch {
    return false;
  }
}

export async function dismissCutoverBanner(): Promise<void> {
  try {
    await AsyncStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // Best-effort; a storage failure simply means the banner reappears next launch.
  }
}

/** Resolve the banner's initial visibility (flag + persisted dismissal). */
export async function resolveCutoverBannerVisible(): Promise<boolean> {
  if (!isCutoverBannerEnabled()) return false;
  const dismissed = await isCutoverBannerDismissed();
  return computeCutoverBannerVisible({ enabled: true, dismissed });
}
