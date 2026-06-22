# TASKS.md

> Agents: read this to find your task. Update status when you finish.
> Humans: add tasks here before starting an agent session.
>
> One task = one logical change. If a task takes more than one session, split it.

---

## In Progress

### TASK-0: Doc reconciliation (Reach Horizon 7 — Step 0)
**Priority:** `high`
**Linked plan step:** PLAN.md Step 0

**What to do:**
Align `PLAN.md`, `TASKS.md`, and `CLAUDE.md` with the true horizon status
(`docs/porting-status.md` + `docs/mobile/rn-parity-matrix.md`): H1–H3 + H5
complete, H2 plugin landed, H4/H6/H7 remaining. Mark H5 exit in the parity
matrix. Docs-only — validates the per-horizon delivery pipeline.

**Acceptance criteria:**
- [ ] PLAN.md describes the Reach Horizon 7 climb (not stale Phase 3)
- [ ] TASKS.md Phase-3 NFC tasks moved to Completed; H4/H6/H7 seeded
- [ ] CLAUDE.md Current Work + VetTrackControl trap corrected
- [ ] `pnpm test` + tsc green (pipeline check)

---

## Ready to Start (gated — see PLAN.md sign-off gates)

### TASK-H4: SSE realtime + native push  *(blocked: Gate A)*
**Priority:** `high`
**Linked plan step:** PLAN.md Step 1

**What to do:**
SSE client transport in `apps/expo/src/lib/realtime/` consuming
`apps/expo/src/types/realtime-events.ts`; `expo-notifications` rewrite of push;
register against the monolith push endpoint. Code Blue stays online-only.

**Blocked by (Gate A):**
- Written SSE approval (Decision Record) resolving "No SSE before H6" vs "SSE at H4"
- Monolith `POST /api/push-subscriptions/native` (vettrack P3-5) exists

**Acceptance criteria:**
- [ ] No emergency mutation reaches `PendingSyncStore` from any realtime/push path
- [ ] SSE reconnect/resume (monotonic `id`/`outboxId`) + backoff tested
- [ ] Push registration tested; `expo-notifications` noted as new package in PR
- [ ] `/security-review` run; full gates green

---

### TASK-H6: Cutover / coexistence banner  *(blocked: Gate B)*
**Priority:** `medium`
**Linked plan step:** PLAN.md Step 2

**What to do:**
In-app Expo-primary / Capacitor-sunset banner; all copy via `t()` in
`apps/expo/locales/{en,he}.json`. Reinforce `vettrack://` deep-link collision
handling (`apps/expo/src/lib/linking/deep-link-return.ts`). No Capacitor deletion.

**Blocked by (Gate B):** product decision to message Expo as primary now.

**Acceptance criteria:**
- [ ] Banner renders with en/he copy (no inline strings); RTL respected
- [ ] Deep-link collision handling test
- [ ] Full gates green

---

### TASK-H7: Capacitor kill-switch retirement  *(blocked: Gate C — terminal)*
**Priority:** `medium`
**Linked plan step:** PLAN.md Step 3

**What to do:**
Author `docs/mobile/capacitor-kill-switch.md` (criteria, rollback, cross-repo
sequencing with vettrack P3-7); execute cutover per Phase 6 go/no-go
(`uk.vettrack.app` → `uk.vettrack.expo`); coordinate companion vettrack PR to
remove Capacitor refs only after the written kill-switch.

**Blocked by (Gate C):** written kill-switch doc + product go/no-go.

**Acceptance criteria:**
- [ ] `docs/mobile/capacitor-kill-switch.md` authored and reviewed
- [ ] Cutover executed per go/no-go; rollback path documented
- [ ] `/security-review` run; full gates green

---

## Blocked

_(See gated tasks above — TASK-H4 / H6 / H7 await their sign-off gates.)_

---

## Completed

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
