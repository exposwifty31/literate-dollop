import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRealtimeClient, type RealtimeConnectionFactory } from "@/lib/realtime/sse-client";
import {
  getAllPendingSync,
  resetPendingSyncStoreForTests,
  setPendingSyncStoreForTests,
} from "@/lib/offline/pending-sync-queue";
import { PendingSyncStore } from "@/lib/offline/pending-sync-store";
import { createTestSqlExecutor } from "./helpers/test-sql-executor";

/**
 * Code Blue safety for H4 realtime: the SSE client is inbound-only and must
 * never write to PendingSyncStore — not even when a CODE_BLUE_STATUS_CHANGED
 * event arrives. This is the realtime counterpart to tests/code-blue-offline.ts.
 */
describe("realtime client never enqueues (Code Blue inbound safety)", () => {
  let store: PendingSyncStore;

  beforeEach(async () => {
    vi.useFakeTimers();
    resetPendingSyncStoreForTests();
    store = new PendingSyncStore(createTestSqlExecutor());
    await store.init();
    await setPendingSyncStoreForTests(store);
  });

  afterEach(() => {
    resetPendingSyncStoreForTests();
    vi.useRealTimers();
  });

  it("does not write to the queue when handling realtime events, including Code Blue", async () => {
    const received: string[] = [];
    let capture: ((frame: { id?: string; data: string }) => void) | null = null;
    const factory: RealtimeConnectionFactory = (_req, callbacks) => {
      capture = callbacks.onFrame;
      return { close() {} };
    };

    const client = createRealtimeClient({
      url: "/api/realtime/stream",
      getHeaders: async () => ({}),
      factory,
      onEvent: (e) => received.push(e.type),
    });
    await client.start();

    capture?.({
      id: "1",
      data: JSON.stringify({
        type: "CODE_BLUE_STATUS_CHANGED",
        payload: { sessionId: "sess-1", active: true },
        timestamp: "t",
      }),
    });
    capture?.({
      id: "2",
      data: JSON.stringify({ type: "EQUIPMENT_STAGED", payload: {}, timestamp: "t" }),
    });

    expect(received).toEqual(["CODE_BLUE_STATUS_CHANGED", "EQUIPMENT_STAGED"]);
    expect(await getAllPendingSync()).toEqual([]);
    client.stop();
  });
});
