# PLAN.md

> Single source of truth for what is being built right now.
> Agents read this before writing any code.
> Update when the plan changes. Do not let it drift from reality.
> Archive completed plans to `docs/plans/YYYY-MM-DD-[feature].md`

---

## Metadata

| | |
|-|-|
| **Feature / Sprint** | Phase 3 — NFC Equipment Scan vertical slice |
| **Author** | Dan |
| **Created** | 2026-06-17 |
| **Last updated** | 2026-06-20 |
| **Status** | `in-progress` |
| **Branch** | `claude/inspiring-hamilton-9fn4iw` |
| **Tasks** | See TASKS.md |
| **Spec** | `docs/superpowers/specs/2026-06-17-phase3-nfc-equipment-scan-design.md` |

---

## Problem

Phase 1 exit criteria are met (contracts, PendingSyncStore, Clerk Expo). The app has no clinically useful screens yet. A vet tech should be able to scan an NFC tag on equipment, view the record, and queue an offline sync — all without network connectivity. No such workflow exists in the Expo app today.

---

## Goal

Deliver one end-to-end offline-capable NFC equipment scan workflow: scan tag → load equipment record → queue offline mutation if needed → replay on reconnect.

---

## Out of Scope

- Full `api.ts` port (~1042 LOC) — only scan-specific endpoints.
- SSE / push notifications (H4).
- `equipment/board` ward kiosk view (web-only).
- ER/patient/hospitalization screens (June 2026 scope cut).
- VetTrackControl plugin landing on `main` (H2 track — separate branch).
- Phase 3b cache tables for equipment/rooms in PendingSyncStore.

---

## Constraints

- Code Blue mutations must never reach the queue — enforcement at `api.request()` is non-negotiable.
- No new packages without noting them in the task response.
- NFC adapter must be platform-agnostic (expo-nfc wrapper pattern, not direct native call in feature code).
- All copy through `t()` — no inline strings.
- `packages/contracts` changes require a companion vettrack dep bump.

---

## Approach

Build a thin vertical slice following the spec in `docs/superpowers/specs/2026-06-17-phase3-nfc-equipment-scan-design.md`. The slice has four layers:

1. **NFC adapter** (`src/lib/nfc-platform.ts`) — platform-agnostic interface over `expo-nfc`; returns tag ID.
2. **Scan screen** (`app/(tabs)/scan.tsx`) — prompts user to hold device to tag; calls NFC adapter; navigates to equipment detail.
3. **Equipment API** (thin slice of `api.ts`) — `GET /equipment/:tagId`; uses offline-first pattern: hit cache → fallback to network → queue on failure.
4. **Sync replay** — existing `PendingSyncStore` enqueue/replay path extended with equipment mutation type.

Each layer is independently testable. Tests run before the next layer starts.

---

## Steps

### Step 1: NFC platform adapter

**Goal:** Isolate `expo-nfc` behind a platform-agnostic interface so feature code does not import the native module directly.

**Files to change:**
- `apps/expo/src/lib/nfc-platform.ts` — create adapter with `startScan(): Promise<string>` and `stopScan(): Promise<void>`
- `tests/nfc-platform.test.ts` — unit tests with mocked native module

**Exit criteria:**
- [ ] Adapter compiles with no TS errors
- [ ] Mock-based unit tests pass for success and permission-denied paths
- [ ] No `expo-nfc` import outside `nfc-platform.ts`

**Status:** `not started`

---

### Step 2: Scan screen

**Goal:** A screen that initiates an NFC scan and navigates to equipment detail on tag read.

**Files to change:**
- `apps/expo/app/(tabs)/scan.tsx` — scan screen using NFC adapter
- `locales/en.json`, `locales/he.json` — add scan copy keys
- `tests/scan-screen.test.tsx` — render + interaction tests

**Exit criteria:**
- [ ] Screen renders prompt copy via `t()` — no inline strings
- [ ] On tag read, navigates to detail route with tag ID param
- [ ] On error / permission denied, shows localised error message
- [ ] Tests cover: initial render, tag read success, permission denied, stop scan on unmount

**Status:** `not started`

---

### Step 3: Equipment API (scan-only slice)

**Goal:** Fetch equipment record by tag ID with offline fallback.

**Files to change:**
- `apps/expo/src/lib/api.ts` (or `src/features/equipment/api.ts`) — `getEquipmentByTagId(tagId)` only; no full api.ts port
- `tests/equipment-api.test.ts` — online success, offline cache hit, offline cache miss (queue mutation)

**Exit criteria:**
- [ ] `classifyEmergencyEndpoint` called before any queue write (existing Code Blue enforcement)
- [ ] Returns cached record when offline and cache is warm
- [ ] Queues sync mutation when offline and cache is cold
- [ ] Tests cover all three paths

**Status:** `not started`

---

### Step 4: Equipment detail screen

**Goal:** Display equipment record from API; allow queuing an offline update.

**Files to change:**
- `apps/expo/app/equipment/[tagId].tsx` — detail screen
- `locales/en.json`, `locales/he.json` — add equipment detail copy keys
- `tests/equipment-detail.test.tsx` — render + mutation tests

**Exit criteria:**
- [ ] Displays equipment name, status, last-scan timestamp
- [ ] "Log scan" action queues a mutation via existing `PendingSyncStore`
- [ ] Offline banner visible when device is offline
- [ ] All copy through `t()`

**Status:** `not started`

---

### Step 5: Integration test — full scan→queue→replay flow

**Goal:** Verify the end-to-end slice in a single test without network.

**Files to change:**
- `tests/integration/nfc-scan-offline-replay.test.ts` — airplane-mode scan → enqueue → replay

**Exit criteria:**
- [ ] Test passes with network mocked as offline
- [ ] Asserts Code Blue mutation is blocked (never reaches queue)
- [ ] Asserts normal equipment mutation queues and replays successfully
- [ ] `pnpm test` green

**Status:** `not started`

---

## Testing Plan

- Unit tests per layer (Steps 1–4).
- Integration test for full offline flow (Step 5).
- Manual QA: uninstall Capacitor app → install Expo dev build → scan physical NFC tag → put device in airplane mode → observe queue → restore network → observe replay.

---

## Rollback Plan

All work is on feature branch `claude/inspiring-hamilton-9fn4iw`. If merged and broken: revert the merge commit. No schema migration involved — `PendingSyncStore` already exists. No contract change needed unless equipment mutation type is new (flag in task notes if so).

---

## Open Questions

| Question | Owner | Status |
|----------|-------|--------|
| Does the equipment mutation type already exist in `@vettrack/contracts`? | Dan | `open` |
| Is `expo-nfc` already in `apps/expo/package.json`? | Agent | `open` — check before Step 1 |

---

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Thin API slice instead of full `api.ts` port | Avoids premature surface area; parity matrix not yet authored (E-P2-3) |
| NFC behind platform adapter | Keeps feature code testable without native hardware |
