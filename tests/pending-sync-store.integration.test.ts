import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  addPendingSync,
  resetPendingSyncStoreForTests,
  setPendingSyncStoreForTests,
} from "@/lib/offline/pending-sync-queue";
import { PendingSyncStore } from "@/lib/offline/pending-sync-store";
import { createTestSqlExecutor } from "./helpers/test-sql-executor";

describe("PendingSyncStore integration", () => {
  let store: PendingSyncStore;

  beforeEach(async () => {
    resetPendingSyncStoreForTests();
    store = new PendingSyncStore(createTestSqlExecutor());
    await store.init();
    await setPendingSyncStoreForTests(store);
  });

  afterEach(() => {
    resetPendingSyncStoreForTests();
  });

  it("enqueue → recover processing → mark synced → startup cleanup", async () => {
    const id = await addPendingSync({
      type: "scan",
      endpoint: "/api/equipment/eq-1/scan",
      method: "POST",
      body: '{"status":"available"}',
      createdAt: new Date(),
      retries: 0,
      status: "pending",
      clientTimestamp: Date.now(),
    });

    const pending = await store.getPendingSync(id);
    expect(pending?.status).toBe("pending");

    await store.updatePendingSync(id, { status: "processing" });
    expect((await store.getPendingSync(id))?.status).toBe("processing");

    const recovered = await store.recoverProcessingPendingSync();
    expect(recovered).toBe(1);
    expect((await store.getPendingSync(id))?.status).toBe("pending");

    await store.updatePendingSync(id, { status: "synced" });
    await store.runStartupCleanup();

    expect(await store.getAllPendingSync()).toEqual([]);
  });

  it("replay queue returns FIFO pending rows", async () => {
    const first = await addPendingSync({
      type: "seen",
      endpoint: "/api/equipment/eq-1/seen",
      method: "POST",
      body: "{}",
      createdAt: new Date(),
      retries: 0,
      status: "pending",
      clientTimestamp: 100,
    });
    const second = await addPendingSync({
      type: "seen",
      endpoint: "/api/equipment/eq-2/seen",
      method: "POST",
      body: "{}",
      createdAt: new Date(),
      retries: 0,
      status: "pending",
      clientTimestamp: 200,
    });

    const queue = await store.getPendingQueue();
    expect(queue.map((row) => row.id)).toEqual([first, second]);
  });
});
