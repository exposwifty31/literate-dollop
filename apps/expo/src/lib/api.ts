import type { PendingSyncType } from "@vettrack/contracts";
import { getAuthHeaders } from "@/lib/auth/get-auth-headers";
import {
  classifyEmergencyEndpoint,
  recordEmergencyBlockLocally,
} from "@/lib/offline-emergency-block";
import { OfflineEmergencyMutationBlockedError } from "@/lib/offline-policy";
import { addPendingSync } from "@/lib/offline/pending-sync-queue";
import { isNetworkError, isOfflineResponse, isOnline, OfflineResponseError } from "@/lib/network";

const BASE_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
};

export interface OfflineRequestOptions {
  offlineType: PendingSyncType;
  optimisticResult?: unknown;
  clientTimestamp?: number;
  onEnqueued?: (id: number) => void;
}

class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

function resolveApiUrl(path: string): string {
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

async function buildRequestHeaders(init: RequestInit = {}): Promise<Record<string, string>> {
  const auth = await getAuthHeaders();
  return {
    ...BASE_HEADERS,
    ...auth,
    ...(init.headers as Record<string, string> | undefined),
  };
}

async function reportEmergencyBlockedSilently(
  endpointClass: "start" | "log" | "end" | "presence",
): Promise<void> {
  if (!isOnline()) return;
  try {
    await fetch(resolveApiUrl("/api/realtime/telemetry"), {
      method: "POST",
      headers: await buildRequestHeaders(),
      body: JSON.stringify({ offlineEmergencyMutationBlocked: endpointClass }),
    });
  } catch {
    // Best-effort telemetry only.
  }
}

export async function request<T>(
  url: string,
  init: RequestInit = {},
  offline?: OfflineRequestOptions,
): Promise<T> {
  const headers = await buildRequestHeaders(init);

  try {
    const res = await fetch(resolveApiUrl(url), { ...init, headers });
    if (!res.ok) {
      const error = (await res.json().catch(() => ({ error: "Request failed" }))) as {
        error?: string;
        code?: string;
        offline?: boolean;
      };
      if (isOfflineResponse(res.status, error)) {
        throw new OfflineResponseError();
      }
      throw new ApiError(
        res.status,
        error.error ?? `HTTP ${res.status}`,
        error.code ?? error.error,
      );
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } catch (err) {
    if (isNetworkError(err)) {
      const method = (init.method as string) || "GET";
      const emergencyClass = classifyEmergencyEndpoint(url, method);
      if (emergencyClass) {
        await recordEmergencyBlockLocally(emergencyClass);
        void reportEmergencyBlockedSilently(emergencyClass);
        throw new OfflineEmergencyMutationBlockedError(emergencyClass);
      }
    }

    if (isNetworkError(err) && offline) {
      const clientTimestamp = offline.clientTimestamp ?? Date.now();
      const pendingSyncId = await addPendingSync({
        type: offline.offlineType,
        endpoint: url,
        method: (init.method as string) || "GET",
        body: (init.body as string) || "",
        createdAt: new Date(),
        retries: 0,
        status: "pending",
        clientTimestamp,
        optimisticData: offline.optimisticResult
          ? JSON.stringify(offline.optimisticResult)
          : undefined,
      });
      offline.onEnqueued?.(pendingSyncId);

      if (offline.optimisticResult !== undefined) {
        return offline.optimisticResult as T;
      }
      throw new Error("Action queued for sync when back online");
    }

    throw err;
  }
}

export type UsersMeResponse = {
  id: string;
  email?: string;
  clinicId?: string;
};

export async function fetchUsersMe(): Promise<UsersMeResponse> {
  return request<UsersMeResponse>("/api/users/me");
}
