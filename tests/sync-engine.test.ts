import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("sync-engine replay headers", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("attemptSync sends X-Client-Timestamp and Authorization", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { setAuthStateRef, processQueue } = await import("@/lib/sync-engine");
    const { addPendingSync, resetPendingSyncStoreForTests, setPendingSyncStoreForTests } =
      await import("@/lib/offline/pending-sync-queue");
    const { PendingSyncStore } = await import("@/lib/offline/pending-sync-store");
    const { createTestSqlExecutor } = await import("./helpers/test-sql-executor");
    const { setAuthHeaderProvider } = await import("@/lib/auth/get-auth-headers");
    const netinfo = await import("@react-native-community/netinfo");
    const { setForcedOfflineForTests, primeNetworkState } = await import("@/lib/network");

    resetPendingSyncStoreForTests();
    const store = new PendingSyncStore(createTestSqlExecutor());
    await store.init();
    await setPendingSyncStoreForTests(store);
    setAuthHeaderProvider(async () => ({ Authorization: "Bearer test-token" }));
    setAuthStateRef(() => ({ isSignedIn: true, isOfflineSession: false }));
    setForcedOfflineForTests(false);
    netinfo.__setNetInfoConnected(true);
    await primeNetworkState();

    await addPendingSync({
      type: "scan",
      endpoint: "/api/equipment/eq-1/scan",
      method: "POST",
      body: '{"status":"ok"}',
      createdAt: new Date(),
      retries: 0,
      status: "pending",
      clientTimestamp: 1_700_000_000_000,
    });

    await processQueue();

    expect(fetchMock).toHaveBeenCalled();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer test-token");
    expect(headers["X-Client-Timestamp"]).toBe("1700000000000");
  });
});
