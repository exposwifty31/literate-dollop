/**
 * Push-token provider seam.
 *
 * The web `use-push-notifications` hook used the Web Push stack (Service Worker
 * + `PushManager` + VAPID), which does not exist in React Native. The RN
 * equivalent obtains a device push token from `expo-notifications`. To avoid
 * pinning that native module (and its exact SDK version) at the logic layer,
 * the hook talks to this seam; the app wires `expo-notifications` into it at
 * startup via `setPushProvider`.
 */
export type PushPermissionStatus = "granted" | "denied" | "undetermined";

export interface PushProvider {
  getPermissionStatus(): Promise<PushPermissionStatus>;
  requestPermission(): Promise<PushPermissionStatus>;
  /** Returns the device push token (e.g. Expo push token), or null if unavailable. */
  getPushToken(): Promise<string | null>;
}

const unconfiguredProvider: PushProvider = {
  getPermissionStatus: async () => "undetermined",
  requestPermission: async () => "denied",
  getPushToken: async () => null,
};

let provider: PushProvider = unconfiguredProvider;
let configured = false;

export function setPushProvider(next: PushProvider): void {
  provider = next;
  configured = true;
}

export function isPushProviderConfigured(): boolean {
  return configured;
}

export function getPushProvider(): PushProvider {
  return provider;
}
