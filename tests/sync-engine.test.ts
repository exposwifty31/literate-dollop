import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addPendingSync,
  getPendingSyncById,
  resetPendingSyncStoreForTests,
  setPendingSyncStoreForTests,
} from "@/lib/offline/pending-sync-queue";
import { PendingSyncStore } from "@/lib/offline/pending-sync-store";
import { setAuthState } from "@/lib/auth-store";
import {
  getConflicts,
  resetConflictsForTests,
} from "@/lib/conflict-store";
import {
  initSyncEngine,
  processQueue,
  resetSyncEngineForTests,
  setAuthStateRef,
  type SyncEngineConfig,
} from "@/lib/sync-engine";
import { createTestSqlExecutor } from "./helpers/test-sql-executor";

const SIGNED_IN = () => ({ isSignedIn: true, isOfflineSession: false });

async function enqueueScan(endpoint = "/api/equipment/eq-1/scan"): Promise<number> {
  return addPendingSync({
    type: "scan",
    endpoint,
    method: "POST",
    body: '{"status":"available"}',
    createdAt: new Date(),
    retries: 0,
    status: "pending",
    clientTimestamp: Date.now(),
  });
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("sync-engine replay", () => {
  let store: PendingSyncStore;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    resetSyncEngineForTests();
    resetConflictsForTests();
    resetPendingSyncStoreForTests();
    store = new PendingSyncStore(createTestSqlExecutor());
    await store.init();
    await setPendingSyncStoreForTests(store);

    setAuthState({ userId: "u1", email: "u@x.io", name: "U", bearerToken: "aaa.bbb.ccc" });
    setAuthStateRef(SIGNED_IN);

    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    resetSyncEngineForTests();
  });

  it("replays a queued mutation and marks it synced on 2xx", async () => {
    const id = await enqueueScan();
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));

    await processQueue();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((await getPendingSyncById(id))?.status).toBe("synced");
  });

  it("does not replay when signed out", async () => {
    await enqueueScan();
    setAuthStateRef(() => ({ isSignedIn: false, isOfflineSession: false }));
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));

    await processQueue();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("records a conflict on 409 without retrying", async () => {
    const id = await enqueueScan();
    fetchMock.mockResolvedValue(jsonResponse(409, { error: "stale" }));

    await processQueue();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((await getPendingSyncById(id))?.status).toBe("conflict");
    expect(getConflicts().map((c) => c.id)).toContain(id);
  });

  it("marks the row dead on 403 and reports a permission denial", async () => {
    const id = await enqueueScan();
    const permissionDenied = vi.fn();
    initSyncEngine({ reporter: { permissionDenied } } satisfies SyncEngineConfig);
    fetchMock.mockResolvedValue(jsonResponse(403, { error: "forbidden" }));

    await processQueue();

    expect((await getPendingSyncById(id))?.status).toBe("dead");
    expect(permissionDenied).toHaveBeenCalledOnce();
  });

  it("halts the queue and signals session expiry on 401", async () => {
    const id = await enqueueScan();
    const sessionExpired = vi.fn();
    const onAuthHalt = vi.fn();
    initSyncEngine({ notifier: { sessionExpired }, onAuthHalt } satisfies SyncEngineConfig);
    fetchMock.mockResolvedValue(jsonResponse(401, { error: "expired" }));

    await processQueue();

    expect((await getPendingSyncById(id))?.status).toBe("dead");
    expect(sessionExpired).toHaveBeenCalledOnce();
    expect(onAuthHalt).toHaveBeenCalledOnce();
  });

  it("retries transient 5xx failures up to the budget then marks dead", async () => {
    vi.useFakeTimers();
    const id = await enqueueScan();
    const permanentFailure = vi.fn();
    initSyncEngine({ notifier: { permanentFailure } } satisfies SyncEngineConfig);
    fetchMock.mockResolvedValue(jsonResponse(500, { error: "boom" }));

    const run = processQueue();
    await vi.runAllTimersAsync();
    await run;

    expect(fetchMock.mock.calls.length).toBeGreaterThan(1);
    expect((await getPendingSyncById(id))?.status).toBe("dead");
    expect(permanentFailure).toHaveBeenCalledOnce();
  });
});
