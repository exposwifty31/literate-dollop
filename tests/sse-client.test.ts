import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createRealtimeClient,
  type RealtimeConnection,
  type RealtimeConnectionCallbacks,
  type RealtimeConnectionFactory,
  type RealtimeConnectionRequest,
} from "@/lib/realtime/sse-client";
import type { RealtimeEvent } from "@/types/realtime-events";

interface FakeConnection extends RealtimeConnection {
  request: RealtimeConnectionRequest;
  callbacks: RealtimeConnectionCallbacks;
  closed: boolean;
}

function makeFakeFactory() {
  const connections: FakeConnection[] = [];
  const factory: RealtimeConnectionFactory = (request, callbacks) => {
    const conn: FakeConnection = {
      request,
      callbacks,
      closed: false,
      close() {
        this.closed = true;
      },
    };
    connections.push(conn);
    return conn;
  };
  return { factory, connections };
}

function frame(id: string | undefined, event: Partial<RealtimeEvent>): { id?: string; data: string } {
  return {
    id,
    data: JSON.stringify({ type: "EQUIPMENT_STAGED", payload: {}, timestamp: "t", ...event }),
  };
}

describe("createRealtimeClient", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("dispatches parsed events to the handler", async () => {
    const { factory, connections } = makeFakeFactory();
    const received: RealtimeEvent[] = [];
    const client = createRealtimeClient({
      url: "/api/realtime/stream",
      getHeaders: async () => ({ Authorization: "Bearer t" }),
      factory,
      onEvent: (e) => received.push(e),
    });

    await client.start();
    connections[0].callbacks.onFrame(frame("1", { type: "EQUIPMENT_STAGED" }));

    expect(received).toHaveLength(1);
    expect(received[0].type).toBe("EQUIPMENT_STAGED");
    expect(connections[0].request.headers).toEqual({ Authorization: "Bearer t" });
    client.stop();
  });

  it("tracks the resume token monotonically", async () => {
    const { factory, connections } = makeFakeFactory();
    const client = createRealtimeClient({
      url: "/s",
      getHeaders: async () => ({}),
      factory,
      onEvent: () => {},
    });
    await client.start();

    connections[0].callbacks.onFrame(frame("5", {}));
    connections[0].callbacks.onFrame(frame("7", {}));
    connections[0].callbacks.onFrame(frame("4", {})); // out of order — ignored

    expect(client.getLastEventId()).toBe("7");
    client.stop();
  });

  it("reconnects with exponential backoff and resumes from Last-Event-ID", async () => {
    const { factory, connections } = makeFakeFactory();
    const client = createRealtimeClient({
      url: "/s",
      getHeaders: async () => ({}),
      factory,
      onEvent: () => {},
      onError: () => {},
      backoff: { baseMs: 1000, maxMs: 30000 },
    });
    await client.start();
    expect(connections).toHaveLength(1);

    connections[0].callbacks.onFrame(frame("10", {}));
    connections[0].callbacks.onError(new Error("drop"));
    expect(connections[0].closed).toBe(true);

    await vi.advanceTimersByTimeAsync(999);
    expect(connections).toHaveLength(1); // not yet
    await vi.advanceTimersByTimeAsync(1);
    expect(connections).toHaveLength(2);
    expect(connections[1].request.lastEventId).toBe("10"); // resumed

    // Second failure backs off to baseMs * 2 = 2000ms.
    connections[1].callbacks.onError(new Error("drop"));
    await vi.advanceTimersByTimeAsync(1999);
    expect(connections).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(connections).toHaveLength(3);

    client.stop();
  });

  it("resets backoff after a successful open", async () => {
    const { factory, connections } = makeFakeFactory();
    const client = createRealtimeClient({
      url: "/s",
      getHeaders: async () => ({}),
      factory,
      onEvent: () => {},
      onError: () => {},
      backoff: { baseMs: 1000, maxMs: 30000 },
    });
    await client.start();

    connections[0].callbacks.onError(new Error("drop"));
    await vi.advanceTimersByTimeAsync(1000);
    expect(connections).toHaveLength(2);

    connections[1].callbacks.onOpen?.(); // healthy again → attempt resets
    connections[1].callbacks.onError(new Error("drop"));
    await vi.advanceTimersByTimeAsync(1000); // back to baseMs, not 2000
    expect(connections).toHaveLength(3);

    client.stop();
  });

  it("stop() closes the connection and prevents reconnect", async () => {
    const { factory, connections } = makeFakeFactory();
    const client = createRealtimeClient({
      url: "/s",
      getHeaders: async () => ({}),
      factory,
      onEvent: () => {},
      onError: () => {},
    });
    await client.start();

    connections[0].callbacks.onError(new Error("drop")); // schedules a reconnect
    client.stop();
    await vi.advanceTimersByTimeAsync(60000);

    expect(connections).toHaveLength(1);
    expect(connections[0].closed).toBe(true);
  });

  it("reports malformed frames without dispatching or throwing", async () => {
    const { factory, connections } = makeFakeFactory();
    const received: RealtimeEvent[] = [];
    const errors: unknown[] = [];
    const client = createRealtimeClient({
      url: "/s",
      getHeaders: async () => ({}),
      factory,
      onEvent: (e) => received.push(e),
      onError: (e) => errors.push(e),
    });
    await client.start();

    connections[0].callbacks.onFrame({ id: "1", data: "not-json" });

    expect(received).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(client.getLastEventId()).toBe("1"); // id still advances
    client.stop();
  });
});
