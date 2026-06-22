# TASKS.md

> Agents: read this to find your task. Update status when you finish.
> Humans: add tasks here before starting an agent session.
>
> One task = one logical change. If a task takes more than one session, split it.

---

## In Progress

_(None — H4 and H6 merged; H7 awaits Gate C.)_

---

## Ready to Start (gated — see PLAN.md sign-off gates)

_(None — H1–H7 Expo-side delivered. Remaining H7 steps are external handoffs;
see below.)_

---

## Handoffs (outside this repo — required to fully complete H7)

Per `docs/mobile/capacitor-kill-switch.md` §5:
- **Store ops:** EAS/App Store/Play publish of the Expo build; retire the
  Capacitor (`uk.vettrack.app`) listing.
- **Release owner:** flip `EXPO_PUBLIC_CAPACITOR_RETIRED=true` after the store
  cutover is live.
- **vettrack maintainer (P3-7):** remove Capacitor `ios/`/`android/` paths after
  the cutover (separate repo).

---

## Blocked

_(See gated tasks above — TASK-H4 / H6 / H7 await their sign-off gates.)_

---

## Completed

### TASK-H7: Capacitor kill-switch retirement (H7, Expo-side) ✅ 2026-06-22
Reversible `EXPO_PUBLIC_CAPACITOR_RETIRED` kill-switch + retired banner variant +
`docs/mobile/capacitor-kill-switch.md` + ADR-006. Product go/no-go = GO. External
store + vettrack steps handed off (see Handoffs). Gate C cleared.

### TASK-H6: Cutover / coexistence banner (H6) ✅ 2026-06-22
Flag-gated, dismissible Expo-primary banner (`components/CutoverBanner.tsx` +
`src/lib/cutover/*`), en/he copy via `t.cutoverBanner.*`, RTL-aware, mounted in
`app/(app)/_layout.tsx`. Deep-link coexistence locked by regression tests. PR per
loop. Gate B cleared.

### TASK-H4: SSE realtime + native push (H4) ✅ 2026-06-22
SSE client + flag-gated native push (`src/lib/realtime/*`, `src/lib/push/*`),
ADR-005. Code-Blue inbound safety test-enforced; live push flag-off until vettrack
P3-5. Gate A cleared.

### TASK-0: Doc reconciliation (Reach Horizon 7 — Step 0) ✅ 2026-06-22
Reconciled PLAN/TASKS/CLAUDE + parity matrix to true horizon status (PR #18).

### Phase 3 — NFC equipment scan vertical slice (H3) ✅ 2026-06
Delivered per `docs/porting-status.md` §Phase 3 (75 tests, `tsc` clean). Covered
the former TASK-1..5: NFC platform adapter (`apps/expo/src/lib/nfc-platform.ts`),
scan screen (`apps/expo/app/(app)/scan.tsx`), equipment-scan API
(`apps/expo/src/lib/api/equipment-scan.ts`), thin `sync-engine` + `use-sync`, and
the offline scan→queue→replay flow. Code Blue online-only enforced.

### Phase 4–5 — RN parity waves 1–4 (H5) ✅ 2026-06
Equipment list/detail, actions (status/checkout/return/new), shift (home card +
handoff), rooms, alerts. See `docs/mobile/rn-parity-matrix.md` + porting-status
§Phase 4/5.

---

## Backlog

Tasks spotted but out of scope for this sprint. Agents add here when they notice something.

- TASK: Mark `patients.ts` / `billing.ts` types as LEGACY (E-P2-1)
- TASK: Add PR template checkbox for emergency/offline surface changes (E-P1-2)
- TASK: Phase 3b — equipment/rooms cache tables in `PendingSyncStore`
- TASK: Verify emergency-block telemetry parity with vettrack `api.ts` bounded enums before H4 (E-P2-4)

---

## Task Template

```markdown
### TASK-[N]: [Title]
**Status:** `ready`
**Priority:** `high` / `medium` / `low`
**Linked plan step:** [PLAN.md Step N, or standalone]

**What to do:**
[2–4 sentences]

**Acceptance criteria:**
- [ ]
- [ ] Build/type-check passes
- [ ] Tests pass
- [ ] No TODOs in delivered code

**Files in scope:**
-

**Files NOT in scope:**
-

**Notes:**
```
