import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addPendingSync,
  getPendingQueue,
  resetPendingSyncStoreForTests,
  setPendingSyncStoreForTests,
} from "@/lib/offline/pending-sync-queue";
import { PendingSyncStore } from "@/lib/offline/pending-sync-store";
import { createTestSqlExecutor } from "./helpers/test-sql-executor";

describe("sync-engine integration", () => {
  beforeEach(async () => {
    resetPendingSyncStoreForTests();
    const store = new PendingSyncStore(createTestSqlExecutor());
    await store.init();
    await setPendingSyncStoreForTests(store);
  });

  afterEach(() => {
    resetPendingSyncStoreForTests();
    vi.unstubAllGlobals();
  });

  it("enqueue scan → processQueue → row removed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 200 })),
    );
    const { setAuthStateRef, processQueue } = await import("@/lib/sync-engine");
    const { setAuthHeaderProvider } = await import("@/lib/auth/get-auth-headers");
    const netinfo = await import("@react-native-community/netinfo");
    const { setForcedOfflineForTests, primeNetworkState } = await import("@/lib/network");

    setAuthHeaderProvider(async () => ({ Authorization: "Bearer t" }));
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
      clientTimestamp: Date.now(),
    });

    await processQueue();
    const rows = await getPendingQueue();
    expect(rows).toHaveLength(0);
  });
});
