# PLAN.md

> Single source of truth for what is being built right now.
> Agents read this before writing any code.
> Update when the plan changes. Do not let it drift from reality.
> Archive completed plans to `docs/plans/YYYY-MM-DD-[feature].md`

---

## Metadata

| | |
|-|-|
| **Feature / Sprint** | Reach Horizon 7 — orchestrated climb to Capacitor retirement |
| **Author** | Dan |
| **Created** | 2026-06-22 |
| **Last updated** | 2026-06-22 |
| **Status** | `in-progress` |
| **Branch** | `claude/reach-horizon-7-0vqq5o` (per-horizon child branches → PR → `main`) |
| **Tasks** | See TASKS.md |
| **Governance** | `docs/governance/expo-agent-brief-2026-06-19.md` |

> The completed Phase 3 NFC vertical slice plan is recorded in
> `docs/porting-status.md` §Phase 3 (75 tests, exit met). Its spec remains at
> `docs/superpowers/specs/2026-06-17-phase3-nfc-equipment-scan-design.md`.

---

## Problem

The remaining VetTrack Expo migration horizons (H4, H6, H7) must be delivered to
reach **H7 — Capacitor retirement / kill-switch cutover**. Planning docs had
drifted from reality (they claimed H3 was still in progress); this sprint
reconciles status and executes the remaining climb under a repeatable per-horizon
delivery loop, pausing at safety/product sign-off gates.

---

## Goal

Traverse `H4 → H6 → H7` via one-branch-per-horizon PRs that pass CI, honoring
frozen doctrine and the documented sign-off gates, ending at the real sign-off:
Capacitor retirement.

---

## True horizon status (source: `docs/porting-status.md` + `rn-parity-matrix.md`)

| Horizon | Status |
|---|---|
| H1 workspace / contracts / Clerk / PendingSyncStore | ✅ complete |
| H2 VetTrackControl config plugin | ✅ complete (4/4 tests) |
| H3 NFC equipment scan slice | ✅ complete (75 tests) |
| H5 RN parity waves 1–4 (equipment, actions, shift, rooms, alerts) | ✅ complete |
| **H4 SSE realtime + native push** | ⏸ not started — Gate A |
| **H6 cutover / coexistence banner** | ⏸ not started — Gate B |
| **H7 Capacitor kill-switch retirement** | ⏸ not started — Gate C (terminal) |

---

## Out of Scope

- Executing any frozen-doctrine item before its sign-off gate clears.
- Full `api.ts` port (~1042 LOC) — scan-only API until parity matrix defines waves.
- ER / patient / hospitalization screens (June 2026 scope cut).
- Ward kiosk (`/equipment/board`) — permanently web-only.
- Deleting Capacitor references in `vettrack` before the written H7 kill-switch.

---

## Constraints

- Code Blue mutations never reach the queue — `classifyEmergencyEndpoint` at
  `api.request()` is non-negotiable, including new realtime/push paths.
- No WebSockets; SSE only, and only after Gate A written approval.
- No Dexie / WatermelonDB — `PendingSyncStore` (expo-sqlite) only.
- All copy through `t()`; Hebrew default, RTL via `I18nManager`.
- `packages/contracts` changes require a companion vettrack `github:` dep bump.
- New npm packages noted explicitly in the PR response.

---

## Per-horizon delivery loop

For each horizon: cut `claude/horizon-<n>-<slug>` from fresh `main` → write code
→ `/code-review` (+ `/security-review` for H4/H7) → run local gates → commit &
push → open PR → subscribe + drive CI green → address review comments → merge →
update docs → next horizon. Stops only at a sign-off gate or H7 merge.

Local gates (mirror `.github/workflows/ci.yml`):

```bash
pnpm install --frozen-lockfile
pnpm contracts:gate                              # if contracts touched
pnpm --filter @vettrack/contracts exec tsc --noEmit
pnpm --filter vettrack-expo exec tsc --noEmit
pnpm test
```

---

## Sign-off gates

- **Gate A (before H4):** written SSE approval (Decision Record) resolving the
  "No SSE before H6" vs "SSE at H4" doc contradiction, **and** confirmation the
  monolith push endpoint (`POST /api/push-subscriptions/native`, vettrack P3-5)
  exists.
- **Gate B (before H6):** product decision that Expo may be messaged as primary
  and a coexistence/sunset banner is wanted now.
- **Gate C (before H7, the real sign-off):** a written Capacitor kill-switch
  criteria doc (`docs/mobile/capacitor-kill-switch.md`, E-P3-4 / vettrack P3-7)
  **and** a product go/no-go on bundle cutover.

---

## Steps

### Step 0 — Doc reconciliation (housekeeping) — `in-progress`

Align `PLAN.md`, `TASKS.md`, `CLAUDE.md` with the true horizon status above;
mark H5 exit in `docs/mobile/rn-parity-matrix.md`. Docs-only; validates the
delivery pipeline. No frozen-doctrine risk.

### Step 1 — H4: SSE realtime + native push — ✅ `done` (Gate A cleared, ADR-005)

Shipped in `apps/expo/src/lib/realtime/` + `src/lib/push/`. SSE client (backoff,
monotonic resume, inbound-only), flag-gated native push, Code-Blue inbound
safety test. Live push flag-off until vettrack P3-5. See
[ADR-005](docs/adr/005-realtime-h4-sse-push.md) + porting-status §H4.

### Step 2 — H6: cutover / coexistence banner — ✅ `done` (Gate B cleared)

Flag-gated, dismissible Expo-primary / Capacitor-sunset banner; copy in
`apps/expo/locales/{en,he}.json` via `t.cutoverBanner.*`; mounted in
`app/(app)/_layout.tsx`. Deep-link coexistence locked by regression tests in
`tests/deep-link-return.test.ts`. No Capacitor deletion (that is H7).

### Step 3 — H7: Capacitor kill-switch retirement — `blocked: Gate C`

Author `docs/mobile/capacitor-kill-switch.md` first; execute cutover per Phase 6
go/no-go (`uk.vettrack.app` → `uk.vettrack.expo`); coordinate companion vettrack
PR to remove Capacitor refs only after the written kill-switch. Terminal.

---

## Testing Plan

- Every horizon: full local gates green before push; CI green before merge.
- H4: SSE reconnect/resume + push registration tests; Code-Blue-never-queued
  assertion (`tests/code-blue-offline.test.ts` pattern); `/security-review`.
- H6: banner render + en/he i18n parity tests; deep-link collision test.
- H7: kill-switch doc review; contracts parity diff vs vettrack
  `node_modules/@vettrack/contracts`; manual store/bundle QA.

---

## Rollback Plan

Per-horizon PRs to `main`; revert the merge commit to roll back a horizon. H4/H6
add no schema migration. H7 cutover rollback path is defined in the kill-switch
doc (Gate C deliverable).

---

## Open Questions

| Question | Owner | Status |
|----------|-------|--------|
| Resolve "No SSE before H6" vs "SSE at H4" doctrine contradiction (Gate A) | Dan / product | `open` |
| Does monolith `POST /api/push-subscriptions/native` exist yet (vettrack P3-5)? | vettrack | `open` |
| Product go/no-go on Capacitor cutover (Gate C) | Product | `open` |

---

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| One branch + PR per horizon, looping to `main` | Operator-requested delivery cadence; isolates each horizon for review/rollback |
| Pause at sign-off gates rather than execute frozen doctrine | Honors safety doctrine + product/cross-repo dependencies |
| Reconcile docs first (Step 0) | Planning docs had drifted from `porting-status.md`; validates the pipeline before gated work |
