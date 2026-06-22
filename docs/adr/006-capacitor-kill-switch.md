# ADR-006: Capacitor retirement via env kill-switch (H7)

**Date:** 2026-06-22
**Status:** `accepted`
**Deciders:** Dan (product go/no-go = GO), Reach-Horizon-7 climb

---

## Context

H7 retires the legacy Capacitor app (`uk.vettrack.app`) in favour of the Expo
build (`uk.vettrack.expo`). The retirement spans two repos (literate-dollop +
vettrack) and the app stores, and the master plan requires a product go/no-go
plus a written kill-switch doc before any of it (Phase 6;
`docs/mobile/capacitor-kill-switch.md`). The destructive/store steps cannot be
executed from the literate-dollop session.

## Decision

1. **Retirement is driven by a runtime env kill-switch**, not a code/bundle
   change: `EXPO_PUBLIC_CAPACITOR_RETIRED` (default **false**). Flipping it to
   `true` switches the coexistence banner to the "retired" message. This keeps
   the cutover **reversible by config** and decouples the Expo code change from
   the externally-sequenced store cutover.
2. **The Expo `bundleIdentifier` stays `uk.vettrack.expo`.** Whether the store
   listing migrates in place is a store/EAS decision, made outside this repo.
3. **Sequencing is gated:** Expo readiness → store cutover → flip kill-switch →
   remove Capacitor in vettrack (P3-7). Capacitor refs are **never** deleted in
   vettrack before the store cutover is live (governance guardrail).
4. **Cross-repo + store steps are explicit handoffs** documented in the
   kill-switch runbook §5.

## Consequences

**Positive**
- Cutover and rollback are pure config (flip an env var) — no risky code revert.
- The terminal horizon is "reached" (criteria + mechanism shipped) without
  performing irreversible store/cross-repo actions prematurely.

**Negative**
- H7 is not fully "done" until the external store + vettrack steps complete; this
  repo can only deliver readiness.

## Alternatives Considered

| Alternative | Why rejected |
|-------------|-------------|
| Flip `app.config.ts` bundle to `uk.vettrack.app` now | Store-identity/signing action with collision risk; must be a store/EAS decision under go/no-go |
| Delete Capacitor in vettrack as part of H7 here | Cross-repo + violates the "don't delete before store cutover" guardrail |
| Hard-code "retired" copy with no flag | Not reversible; couples code to an external store timeline |
