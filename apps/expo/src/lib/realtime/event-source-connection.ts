/**
 * Default `RealtimeConnectionFactory` backed by a global `EventSource`-style
 * constructor (ADR-005). This is the thin native transport seam — not unit
 * tested, mirroring the platform-adapter doctrine (ADR-004).
 *
 * Standard browser `EventSource` cannot send custom headers, so for headered
 * auth on native the production swap is `react-native-sse` (its constructor
 * accepts an options object with `headers`); we feature-detect that signature.
 * When no transport is available (e.g. Node tests, Expo Go without the lib) the
 * factory yields a no-op connection rather than throwing.
 */
import { resolveRealtimeStreamUrl } from "@/lib/realtime/realtime-config";
import type {
  RealtimeConnection,
  RealtimeConnectionCallbacks,
  RealtimeConnectionFactory,
  RealtimeConnectionRequest,
} from "@/lib/realtime/sse-client";

interface EventSourceLike {
  addEventListener(type: string, listener: (event: unknown) => void): void;
  close(): void;
}

type EventSourceCtor = new (
  url: string,
  init?: { headers?: Record<string, string>; withCredentials?: boolean },
) => EventSourceLike;

/** Safely read a string field off an unknown DOM/EventSource event object. */
function readField(event: unknown, field: string): string | undefined {
  if (event && typeof event === "object" && field in event) {
    const value = (event as Record<string, unknown>)[field];
    if (typeof value === "string") return value;
  }
  return undefined;
}

const NOOP_CONNECTION: RealtimeConnection = { close() {} };

export const eventSourceConnectionFactory: RealtimeConnectionFactory = (
  request: RealtimeConnectionRequest,
  callbacks: RealtimeConnectionCallbacks,
): RealtimeConnection => {
  const Ctor = (globalThis as { EventSource?: EventSourceCtor }).EventSource;
  if (!Ctor) {
    // No transport in this runtime; report once so the client can back off.
    callbacks.onError(new Error("EventSource transport unavailable"));
    return NOOP_CONNECTION;
  }

  const url = resolveRealtimeStreamUrl(request.url, request.lastEventId);
  const source = new Ctor(url, { headers: request.headers, withCredentials: false });

  source.addEventListener("open", () => callbacks.onOpen?.());
  source.addEventListener("error", (event) => callbacks.onError(event));
  source.addEventListener("message", (event) => {
    callbacks.onFrame({ id: readField(event, "lastEventId"), data: readField(event, "data") ?? "" });
  });

  return {
    close() {
      source.close();
    },
  };
};
