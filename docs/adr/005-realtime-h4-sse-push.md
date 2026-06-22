# ADR-005: Realtime (SSE) + native push at H4

**Date:** 2026-06-22
**Status:** `accepted`
**Deciders:** Dan (product), Reach-Horizon-7 climb

---

## Context

The Expo migration's horizon plan contained a **contradiction** about when
realtime arrives:

- The frozen doctrine (`CLAUDE.md`, `docs/plans/mobile-strategy-master.md`, and
  `docs/governance/expo-agent-brief-2026-06-19.md`) states *"No SSE before H6
  approval."*
- The governance horizon table in the same brief lists **SSE + native push as
  H4**, sequenced right after the H3 NFC slice.

This ambiguity blocked H4. Native push additionally depends on a monolith
endpoint (`POST /api/push-subscriptions/native`, vettrack **P3-5**) that is not
yet confirmed shipped.

## Decision

1. **SSE realtime is approved at H4.** This ADR is the explicit written approval
   the frozen doctrine required; the "No SSE before H6" wording is **superseded**
   by this decision. Realtime is **SSE only** — no WebSockets, matching the web
   monolith transport.
2. **Native push is built at H4 but ships dark.** The registration client and
   the expected endpoint contract land now, but **live registration is gated
   behind a feature flag (`EXPO_PUBLIC_NATIVE_PUSH_ENABLED`, default off)** until
   vettrack P3-5 (`POST /api/push-subscriptions/native`) is confirmed.
3. **Transport is dependency-injected.** The SSE core (`sse-client.ts`) and push
   core (`push-registration.ts`) take an injectable connection factory / token
   provider — matching the NFC platform-adapter doctrine (ADR-004). The native
   wiring (`react-native-sse` for headered SSE, `expo-notifications` for push
   tokens) is a thin seam added with app composition, not a unit-tested unit.
4. **Code Blue invariant is preserved.** Realtime is inbound-only and never
   writes to `PendingSyncStore`; no realtime/push path enqueues emergency
   mutations. `classifyEmergencyEndpoint` enforcement at `api.request()` is
   unchanged.

## Consequences

**Positive**
- H4 is unblocked with a tested, transport-agnostic core.
- Push cannot fire against a non-existent endpoint (flag default off).
- The doctrine contradiction is resolved in one authoritative place.

**Negative**
- `react-native-sse` and `expo-notifications` are deferred native dependencies;
  the default `EventSource` adapter is best-effort until they land.
- Realtime does not yet drive UI invalidation (QueryClient seam still deferred,
  per `docs/porting-status.md`).

## Alternatives Considered

| Alternative | Why rejected |
|-------------|-------------|
| Wait for H6 to add SSE | The horizon table sequences realtime at H4; waiting stalls the climb with no product benefit |
| Add `expo-notifications` + native token retrieval now | Requires a lockfile change and wires push before its monolith endpoint exists; flag-gated client is sufficient |
| WebSocket transport | Frozen doctrine — must match the web monolith's SSE transport |
