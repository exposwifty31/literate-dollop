import { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/auth-fetch";
import {
  safeStorageGetItem,
  safeStorageRemoveItem,
  safeStorageSetItem,
} from "@/lib/safe-storage";
import {
  getPushProvider,
  isPushProviderConfigured,
  type PushPermissionStatus,
} from "@/lib/push-provider";

/**
 * RN port of the web `usePushNotifications`.
 *
 * The web hook drove the Web Push stack (Service Worker registration,
 * `PushManager.subscribe`, VAPID keys). React Native has none of those; the
 * device push token comes from the `@/lib/push-provider` seam (backed by
 * `expo-notifications` in the app). The server-registration surface
 * (`/api/push/{subscribe,test}`) is preserved — the Expo push token is sent as
 * the subscription `endpoint`.
 */
const PUSH_ENDPOINT_KEY = "push_subscription_endpoint";

interface PushState {
  supported: boolean;
  permission: PushPermissionStatus | "unsupported";
  subscribed: boolean;
  loading: boolean;
  error: string | null;
}

interface NotificationOpts {
  soundEnabled?: boolean;
  alertsEnabled?: boolean;
  technicianReturnRemindersEnabled?: boolean;
  seniorOwnReturnRemindersEnabled?: boolean;
  seniorTeamOverdueAlertsEnabled?: boolean;
  adminHourlySummaryEnabled?: boolean;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushState>({
    supported: false,
    permission: "undetermined",
    subscribed: false,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!isPushProviderConfigured()) {
      setState((s) => ({ ...s, supported: false, permission: "unsupported" }));
      return;
    }

    let cancelled = false;
    const provider = getPushProvider();

    void provider
      .getPermissionStatus()
      .then((permission) => {
        if (cancelled) return;
        const storedEndpoint = safeStorageGetItem(PUSH_ENDPOINT_KEY);
        setState((s) => ({
          ...s,
          supported: true,
          permission,
          subscribed: !!storedEndpoint && permission === "granted",
        }));
      })
      .catch(() => {
        if (!cancelled) setState((s) => ({ ...s, supported: true, subscribed: false }));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const subscribe = useCallback(async (opts?: NotificationOpts): Promise<boolean> => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      if (!isPushProviderConfigured()) {
        throw new Error("Push not supported");
      }
      const provider = getPushProvider();

      const permission = await provider.requestPermission();
      setState((s) => ({ ...s, permission }));
      if (permission !== "granted") {
        setState((s) => ({ ...s, loading: false, error: "Permission denied" }));
        return false;
      }

      const token = await provider.getPushToken();
      if (!token) {
        throw new Error("Push token unavailable");
      }

      const res = await authFetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: token,
          expoPushToken: token,
          soundEnabled: opts?.soundEnabled !== false,
          alertsEnabled: opts?.alertsEnabled !== false,
          technicianReturnRemindersEnabled: opts?.technicianReturnRemindersEnabled !== false,
          seniorOwnReturnRemindersEnabled: opts?.seniorOwnReturnRemindersEnabled !== false,
          seniorTeamOverdueAlertsEnabled: opts?.seniorTeamOverdueAlertsEnabled !== false,
          adminHourlySummaryEnabled: opts?.adminHourlySummaryEnabled !== false,
        }),
      });

      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(errData.message || "Failed to save subscription");
      }

      safeStorageSetItem(PUSH_ENDPOINT_KEY, token);
      setState((s) => ({ ...s, subscribed: true, loading: false }));
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to subscribe";
      setState((s) => ({ ...s, loading: false, error: msg, subscribed: false }));
      return false;
    }
  }, []);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const endpoint = safeStorageGetItem(PUSH_ENDPOINT_KEY);
      if (endpoint) {
        await authFetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        }).catch(() => {});
      }
      safeStorageRemoveItem(PUSH_ENDPOINT_KEY);
      setState((s) => ({ ...s, subscribed: false, loading: false }));
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to unsubscribe";
      setState((s) => ({ ...s, loading: false, error: msg }));
      return false;
    }
  }, []);

  const updateSettings = useCallback(async (opts: NotificationOpts): Promise<boolean> => {
    try {
      const endpoint = safeStorageGetItem(PUSH_ENDPOINT_KEY);
      if (!endpoint) return false;
      const res = await authFetch("/api/push/subscribe", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint, ...opts }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const sendTestNotification = useCallback(async (): Promise<boolean> => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await authFetch("/api/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string; success?: boolean };
      if (!res.ok) {
        const msg =
          data.message ||
          (res.status === 503
            ? "Push not configured on server"
            : res.status === 409
              ? "No subscription on server — re-enable device notifications in Settings"
              : `Test failed (${res.status})`);
        throw new Error(msg);
      }
      setState((s) => ({ ...s, loading: false }));
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send test";
      setState((s) => ({ ...s, loading: false, error: msg }));
      return false;
    }
  }, []);

  return {
    ...state,
    subscribe,
    unsubscribe,
    updateSettings,
    sendTestNotification,
  };
}
