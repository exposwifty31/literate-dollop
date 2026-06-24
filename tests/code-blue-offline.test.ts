import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  _clearEmergencyBlockBufferForTests,
  classifyEmergencyEndpoint,
} from "@/lib/offline-emergency-block";
import { OfflineEmergencyMutationBlockedError } from "@/lib/offline-policy";
import {
  addPendingSync,
  getAllPendingSync,
  resetPendingSyncStoreForTests,
  setPendingSyncStoreForTests,
} from "@/lib/offline/pending-sync-queue";
import { PendingSyncStore } from "@/lib/offline/pending-sync-store";
import { setForcedOfflineForTests } from "@/lib/network";
import { createTestSqlExecutor } from "./helpers/test-sql-executor";
import { clearMockAsyncStorage } from "./mocks/async-storage";

const EMERGENCY_CASES = [
  {
    label: "POST /sessions (start)",
    url: "/api/code-blue/sessions",
    method: "POST",
    endpointClass: "start" as const,
  },
  {
    label: "POST /sessions/:id/logs (log)",
    url: "/api/code-blue/sessions/sess-1/logs",
    method: "POST",
    endpointClass: "log" as const,
  },
  {
    label: "PATCH /sessions/:id/end (end)",
    url: "/api/code-blue/sessions/sess-1/end",
    method: "PATCH",
    endpointClass: "end" as const,
  },
  {
    label: "PATCH /sessions/:id/presence (presence)",
    url: "/api/code-blue/sessions/sess-1/presence",
    method: "PATCH",
    endpointClass: "presence" as const,
  },
];

function pendingSyncOp(endpoint: string, method: string) {
  return {
    type: "scan" as const,
    endpoint,
    method,
    body: "{}",
    createdAt: new Date(),
    retries: 0,
    status: "pending" as const,
    clientTimestamp: Date.now(),
  };
}

describe("code-blue offline classifier", () => {
  it("allows GET /sessions/active (read-only)", () => {
    expect(classifyEmergencyEndpoint("/api/code-blue/sessions/active", "GET")).toBeNull();
  });

  it.each(EMERGENCY_CASES)("blocks $label", ({ url, method, endpointClass }) => {
    expect(classifyEmergencyEndpoint(url, method)).toBe(endpointClass);
  });
});

describe("code-blue never enqueued in pendingSync", () => {
  beforeEach(async () => {
    resetPendingSyncStoreForTests();
    const store = new PendingSyncStore(createTestSqlExecutor());
    await store.init();
    await setPendingSyncStoreForTests(store);
    await _clearEmergencyBlockBufferForTests();
    clearMockAsyncStorage();
  });

  afterEach(() => {
    resetPendingSyncStoreForTests();
  });

  it.each(EMERGENCY_CASES)("addPendingSync choke point rejects $label", async ({ url, method }) => {
    await expect(addPendingSync(pendingSyncOp(url, method))).rejects.toBeInstanceOf(
      OfflineEmergencyMutationBlockedError,
    );
    expect(await getAllPendingSync()).toEqual([]);
  });

  it.each(EMERGENCY_CASES)(
    "api.request() rejects $label on network error without enqueueing",
    async ({ url, method, endpointClass }) => {
      setForcedOfflineForTests(true);
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

      const { request } = await import("@/lib/api");

      await expect(
        request(url, { method, body: "{}" }, { offlineType: "scan", optimisticResult: {} }),
      ).rejects.toMatchObject({
        name: "OfflineEmergencyMutationBlockedError",
        endpointClass,
      });

      expect(await getAllPendingSync()).toEqual([]);
      setForcedOfflineForTests(false);
      vi.unstubAllGlobals();
    },
  );
});
