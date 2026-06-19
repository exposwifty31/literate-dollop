import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  resetPendingSyncStoreForTests,
  setPendingSyncStoreForTests,
} from "@/lib/offline/pending-sync-queue";
import { PendingSyncStore } from "@/lib/offline/pending-sync-store";
import { setForcedOfflineForTests } from "@/lib/network";
import { createTestSqlExecutor } from "./helpers/test-sql-executor";

describe("equipment-scan api contract", () => {
  let store: PendingSyncStore;

  beforeEach(async () => {
    resetPendingSyncStoreForTests();
    store = new PendingSyncStore(createTestSqlExecutor());
    await store.init();
    await setPendingSyncStoreForTests(store);
    setForcedOfflineForTests(true);
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
  });

  afterEach(() => {
    resetPendingSyncStoreForTests();
    setForcedOfflineForTests(false);
    vi.unstubAllGlobals();
  });

  it("scanEquipment preserves clientTimestamp on enqueue", async () => {
    const ts = 1_700_000_000_000;
    const { scanEquipment } = await import("@/lib/api/equipment-scan");
    const result = await scanEquipment("eq-1", { status: "ok" }, ts);
    expect(result.kind).toBe("queued");
    const rows = await store.getAllPendingSync();
    expect(rows[0]?.clientTimestamp).toBe(ts);
  });
});
