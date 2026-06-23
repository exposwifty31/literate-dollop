/**
 * Transport-agnostic SSE realtime client (H4, ADR-005).
 *
 * Inbound-only: this client NEVER writes to PendingSyncStore and never enqueues
 * mutations — it only dispatches parsed `RealtimeEvent`s to a handler. That is
 * the Code Blue safety property for realtime (see tests/realtime-safety.test.ts).
 *
 * The actual network transport is injected via a `RealtimeConnectionFactory`
 * (matching the NFC platform-adapter doctrine, ADR-004), so the reconnect /
 * resume / backoff logic is unit-testable without a real EventSource.
 */
import type { RealtimeEvent } from "@/types/realtime-events";

/** A single SSE frame as delivered by a transport. */
export interface RawSseFrame {
  /** SSE `id:` field — used as Last-Event-ID on resume. */
  id?: string;
  /** SSE `data:` field — JSON-encoded `RealtimeEvent`. */
  data: string;
}

export interface RealtimeConnectionCallbacks {
  onFrame: (frame: RawSseFrame) => void;
  onError: (err: unknown) => void;
  onOpen?: () => void;
}

export interface RealtimeConnectionRequest {
  url: string;
  headers: Record<string, string>;
  /** Resume token: highest `id` seen so far, sent as `Last-Event-ID`. */
  lastEventId?: string;
}

export interface RealtimeConnection {
  close(): void;
}

export type RealtimeConnectionFactory = (
  request: RealtimeConnectionRequest,
  callbacks: RealtimeConnectionCallbacks,
) => RealtimeConnection;

export interface BackoffOptions {
  /** First reconnect delay in ms. Default 1000. */
  baseMs?: number;
  /** Maximum reconnect delay in ms. Default 30000. */
  maxMs?: number;
  /** Multiply jitter ∈ [0,1) × baseMs onto each delay. Default false (deterministic). */
  jitter?: boolean;
}

export interface RealtimeClientOptions {
  url: string;
  getHeaders: () => Promise<Record<string, string>>;
  factory: RealtimeConnectionFactory;
  onEvent: (event: RealtimeEvent) => void;
  /** Called for transport errors and malformed frames (best-effort observability). */
  onError?: (err: unknown) => void;
  backoff?: BackoffOptions;
}

export interface RealtimeClient {
  start(): Promise<void>;
  stop(): void;
  /** Highest event id observed (resume token). Exposed for tests/diagnostics. */
  getLastEventId(): string | undefined;
}

/** Exponential reconnect delay for `attempt` (1-based), capped at `maxMs`, optional jitter. */
function computeBackoff(attempt: number, opts: Required<BackoffOptions>): number {
  const exp = Math.min(opts.maxMs, opts.baseMs * 2 ** Math.max(0, attempt - 1));
  if (!opts.jitter) return exp;
  return exp + Math.floor(Math.random() * opts.baseMs);
}

/**
 * Update the resume token only when the incoming id is numerically greater
 * (monotonic). Non-numeric ids replace any non-numeric current token but never
 * regress past a numeric one.
 */
function nextLastEventId(current: string | undefined, incoming: string | undefined): string | undefined {
  if (incoming === undefined || incoming === "") return current;
  if (current === undefined) return incoming;
  const a = Number(current);
  const b = Number(incoming);
  if (Number.isFinite(a) && Number.isFinite(b)) return b > a ? incoming : current;
  return incoming;
}

/**
 * Create an SSE realtime client over an injected connection factory. Manages
 * connect/reconnect (exponential backoff), monotonic `Last-Event-ID` resume,
 * and JSON frame dispatch. Call `start()` to connect and `stop()` to tear down.
 */
export function createRealtimeClient(options: RealtimeClientOptions): RealtimeClient {
  const backoff: Required<BackoffOptions> = {
    baseMs: options.backoff?.baseMs ?? 1000,
    maxMs: options.backoff?.maxMs ?? 30000,
    jitter: options.backoff?.jitter ?? false,
  };

  let connection: RealtimeConnection | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let attempt = 0;
  let stopped = true;
  let lastEventId: string | undefined;

  /** Cancel any pending reconnect timer. */
  function clearReconnectTimer(): void {
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  /** Advance the resume token and dispatch a parsed frame (malformed → onError). */
  function handleFrame(frame: RawSseFrame): void {
    lastEventId = nextLastEventId(lastEventId, frame.id);
    if (!frame.data) return;
    let parsed: RealtimeEvent;
    try {
      parsed = JSON.parse(frame.data) as RealtimeEvent;
    } catch (err) {
      options.onError?.(err);
      return;
    }
    options.onEvent(parsed);
  }

  /** Schedule the next reconnect attempt with exponential backoff. */
  function scheduleReconnect(): void {
    if (stopped) return;
    clearReconnectTimer();
    attempt += 1;
    const delay = computeBackoff(attempt, backoff);
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      void connect();
    }, delay);
  }

  /** Open a connection (resolving fresh auth headers); reconnect on failure. */
  async function connect(): Promise<void> {
    if (stopped) return;
    let headers: Record<string, string>;
    try {
      headers = await options.getHeaders();
    } catch (err) {
      options.onError?.(err);
      scheduleReconnect();
      return;
    }
    if (stopped) return;

    connection = options.factory(
      { url: options.url, headers, lastEventId },
      {
        onOpen: () => {
          attempt = 0;
        },
        onFrame: handleFrame,
        onError: (err) => {
          options.onError?.(err);
          if (connection) {
            connection.close();
            connection = null;
          }
          scheduleReconnect();
        },
      },
    );
  }

  return {
    /** Open the stream and begin dispatching events (no-op if already started). */
    async start(): Promise<void> {
      if (!stopped) return;
      stopped = false;
      attempt = 0;
      await connect();
    },
    /** Close the stream and cancel any pending reconnect. */
    stop(): void {
      stopped = true;
      clearReconnectTimer();
      if (connection) {
        connection.close();
        connection = null;
      }
    },
    /** Highest event id observed so far (the resume token). */
    getLastEventId(): string | undefined {
      return lastEventId;
    },
  };
}
