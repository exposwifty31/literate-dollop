/**
 * Native push registration client (H4, ADR-005).
 *
 * Ships dark: live registration is gated behind `isNativePushEnabled()`
 * (default off) until the monolith endpoint `POST /api/push-subscriptions/native`
 * (vettrack P3-5) is confirmed. The push token is obtained via an injected
 * `PushTokenProvider` — the `expo-notifications` wiring is a deferred native
 * seam, so this module has no native import and is fully unit-testable.
 *
 * Push registration is a normal authenticated POST; it does not touch
 * PendingSyncStore and is never queued offline.
 */
import { request } from "@/lib/api";
import {
  isNativePushEnabled,
  NATIVE_PUSH_SUBSCRIPTION_ENDPOINT,
} from "@/lib/realtime/realtime-config";

export interface NativePushRegistration {
  /** Opaque device push token from the platform (APNs/FCM via expo-notifications). */
  token: string;
  platform: "ios" | "android";
  /** Stable per-install identifier so the server can de-dupe subscriptions. */
  deviceId?: string;
}

export type PushTokenProvider = () => Promise<NativePushRegistration | null>;

export type RegisterPushResult =
  | { status: "registered"; subscriptionId?: string }
  | { status: "disabled" }
  | { status: "unavailable" }
  | { status: "error"; error: Error };

interface NativePushSubscriptionResponse {
  id?: string;
}

export interface RegisterNativePushOptions {
  getToken: PushTokenProvider;
}

export async function registerNativePush(
  options: RegisterNativePushOptions,
): Promise<RegisterPushResult> {
  if (!isNativePushEnabled()) return { status: "disabled" };

  let registration: NativePushRegistration | null;
  try {
    registration = await options.getToken();
  } catch (err) {
    return { status: "error", error: err instanceof Error ? err : new Error(String(err)) };
  }
  if (!registration) return { status: "unavailable" };

  try {
    const response = await request<NativePushSubscriptionResponse>(
      NATIVE_PUSH_SUBSCRIPTION_ENDPOINT,
      {
        method: "POST",
        body: JSON.stringify({
          token: registration.token,
          platform: registration.platform,
          deviceId: registration.deviceId,
        }),
      },
    );
    return { status: "registered", subscriptionId: response?.id };
  } catch (err) {
    return { status: "error", error: err instanceof Error ? err : new Error(String(err)) };
  }
}
