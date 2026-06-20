# TASKS.md

> Agents: read this to find your task. Update status when you finish.
> Humans: add tasks here before starting an agent session.
>
> One task = one logical change. If a task takes more than one session, split it.

---

## In Progress

_(No tasks currently assigned to an agent — pick from Ready to Start)_

---

## Ready to Start

### TASK-1: NFC platform adapter
**Priority:** `high`
**Linked plan step:** PLAN.md Step 1

**What to do:**
Create `apps/expo/src/lib/nfc-platform.ts` with a platform-agnostic interface over `expo-nfc`. Export `startScan(): Promise<string>` (returns tag ID) and `stopScan(): Promise<void>`. No `expo-nfc` import should appear outside this file. Add unit tests using a mocked native module.

**Acceptance criteria:**
- [ ] Adapter compiles with no TS errors
- [ ] Tests cover: success path, permission-denied error, stop-scan
- [ ] No `expo-nfc` import outside `nfc-platform.ts`
- [ ] Build/type-check passes with no new errors
- [ ] Tests pass (full suite)
- [ ] No TODO comments in delivered code

**Files in scope:**
- `apps/expo/src/lib/nfc-platform.ts`
- `tests/nfc-platform.test.ts`

**Files NOT in scope:**
- Any screen files — screens come in TASK-2
- `packages/contracts` — no contract change needed for the adapter layer

**Notes:**
Check `apps/expo/package.json` first — verify `expo-nfc` is listed as a dependency before writing the import. If it is missing, note it in your response and open a follow-up task for `apps/expo/package.json` rather than adding it within this task.

---

### TASK-2: Scan screen
**Priority:** `high`
**Linked plan step:** PLAN.md Step 2

**What to do:**
Create `apps/expo/app/(tabs)/scan.tsx`. The screen calls the NFC adapter from TASK-1 and navigates to the equipment detail route (`/equipment/[tagId]`) on a successful tag read. Add all copy to `locales/en.json` and `locales/he.json` using the `t()` accessor. Add render and interaction tests.

**Acceptance criteria:**
- [ ] Screen renders prompt copy via `t()` — no inline strings
- [ ] On tag read, navigates to `/equipment/[tagId]` with tag ID as param
- [ ] On permission denied, shows localised error message (does not crash)
- [ ] On unmount, calls `stopScan()`
- [ ] Tests pass (full suite)
- [ ] No TODO comments

**Files in scope:**
- `apps/expo/app/(tabs)/scan.tsx`
- `apps/expo/locales/en.json`
- `apps/expo/locales/he.json`
- `tests/scan-screen.test.tsx`

**Files NOT in scope:**
- `apps/expo/src/lib/nfc-platform.ts` — completed in TASK-1
- Equipment detail screen — TASK-4

**Notes:**
Hebrew locale is the default; ensure Hebrew strings are added alongside English. Consult `apps/expo/src/lib/i18n.ts` for the typed `t` accessor pattern.

---

### TASK-3: Equipment API — scan-only slice
**Priority:** `high`
**Linked plan step:** PLAN.md Step 3

**What to do:**
Add `getEquipmentByTagId(tagId: string)` to the API layer (`src/features/equipment/api.ts` or equivalent). Fetch from network; if offline, queue a sync mutation via `PendingSyncStore`. The Code Blue enforcement call chain must be preserved — `classifyEmergencyEndpoint` before any queue write. Cache tables are deferred to Phase 3b — do not implement caching here.

**Acceptance criteria:**
- [ ] `classifyEmergencyEndpoint` is called before any `PendingSyncStore` write
- [ ] Queues sync mutation when offline
- [ ] Tests cover both paths (online success, offline queue)
- [ ] `pnpm contracts:gate` passes (no contracts changed)
- [ ] Tests pass (full suite)

**Files in scope:**
- `apps/expo/src/features/equipment/api.ts` (create if not exists)
- `tests/equipment-api.test.ts`

**Files NOT in scope:**
- Full `api.ts` port — only the `getEquipmentByTagId` function

**Notes:**
Do not add new emergency surface endpoints. If you discover that the equipment mutation type is missing from `@vettrack/contracts`, stop and flag it — do not add it without noting the required vettrack companion PR.

---

### TASK-4: Equipment detail screen
**Priority:** `high`
**Linked plan step:** PLAN.md Step 4

**What to do:**
Create `apps/expo/app/equipment/[tagId].tsx`. Fetch the equipment record via the API from TASK-3. Display name, status, and last-scan timestamp. Provide a "Log scan" action that queues a mutation via `PendingSyncStore`. Show an offline banner when the device is offline. All copy through `t()`.

**Acceptance criteria:**
- [ ] Displays equipment name, status, last-scan timestamp
- [ ] "Log scan" action queues a mutation (does not directly call API when offline)
- [ ] Offline banner visible when device is offline
- [ ] All copy keys in `locales/en.json` and `locales/he.json`
- [ ] Tests cover: loaded state, offline state, log-scan action
- [ ] Tests pass (full suite)
- [ ] No TODO comments

**Files in scope:**
- `apps/expo/app/equipment/[tagId].tsx`
- `apps/expo/locales/en.json`
- `apps/expo/locales/he.json`
- `tests/equipment-detail.test.tsx`

**Files NOT in scope:**
- NFC adapter, scan screen, API layer — completed in earlier tasks

---

### TASK-5: Integration test — full scan → queue → replay flow
**Priority:** `high`
**Linked plan step:** PLAN.md Step 5

**What to do:**
Write `tests/integration/nfc-scan-offline-replay.test.ts` covering the end-to-end offline slice: NFC tag read → fetch equipment (cache miss) → queue mutation in `PendingSyncStore` → network restores → replay. Also assert that a Code Blue endpoint is blocked and never reaches the queue.

**Acceptance criteria:**
- [ ] Test covers offline queueing phase then network restoration for replay (offline-then-online flow)
- [ ] Asserts Code Blue mutation is blocked (never written to SQLite)
- [ ] Asserts normal equipment mutation queues successfully
- [ ] Asserts replay removes the item from the pending queue
- [ ] `pnpm test` green across the full suite
- [ ] No TODO comments

**Files in scope:**
- `tests/integration/nfc-scan-offline-replay.test.ts`

**Files NOT in scope:**
- Implementation files — all completed in TASK-1 through TASK-4

---

## Blocked

_(None)_

---

## Completed

_(None yet — tasks added 2026-06-20)_

---

## Backlog

Tasks spotted but out of scope for this sprint. Agents add here when they notice something.

- TASK: Land Phase 2 VetTrackControl plugin on `main` with passing `vettrack-control-plugin.test.ts` (E-P1-4)
- TASK: Mark `patients.ts` / `billing.ts` types as LEGACY (E-P2-1)
- TASK: Add PR template checkbox for emergency/offline surface changes (E-P1-2)
- TASK: Phase 3b — equipment/rooms cache tables in `PendingSyncStore`
- TASK: Request / co-author `docs/mobile/rn-parity-matrix.md` in vettrack repo (E-P2-3)
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
