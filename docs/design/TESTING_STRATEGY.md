# Testing Strategy for VetTrack Expo (18 Screens)

**Prepared:** 2026-06-25  
**Scope:** Wave 0–4 + core layout shells  
**Test pyramid target:** Unit (60%) + Integration (30%) + E2E (10%)  
**Current baseline:** 59 tests (vitest), 23 in `/tests/`

---

## 1. Test Plan by Screen

### Wave 0 — Foundation (4 screens)

#### Sign In `/(auth)/sign-in`
- **Component tests**
  - [ ] Clerk-provided form renders
  - [ ] Loading state shows spinner, disables form
  - [ ] Error banner displays on failed auth
  - [ ] i18n: English + Hebrew copy loads correctly
- **Interaction tests**
  - [ ] Form submission calls Clerk API
  - [ ] Successful login navigates to home
  - [ ] Deep-link post-auth restores intended route
- **Edge cases**
  - [ ] Network error → retry banner shown
  - [ ] Expired session → silent re-auth
  - [ ] RTL input handling (Hebrew email field)
- **Accessibility (WCAG 2.1 AA)**
  - [ ] Form labels associated with inputs (aria-labelledby)
  - [ ] Error messages linked to fields (aria-describedby)
  - [ ] Tab order: email → password → sign-in button
  - [ ] Contrast: text 4.5:1 on all states (normal, hover, error)
  - [ ] Touch target: 44px × 44px minimum
  - [ ] RTL: text direction respected, icons NOT mirrored

**Test file:** `tests/screens/sign-in.test.ts`  
**Files to test:** `app/(auth)/sign-in.tsx`, `src/providers/auth.tsx`

---

#### Home / Dashboard `/(app)/(tabs)/index`
- **Component tests**
  - [ ] Active shift card displays clinic name, hours, technician count
  - [ ] "Start Shift" CTA visible when no active shift
  - [ ] "Handoff" button visible when shift active
  - [ ] Empty state message when offline + no cached shift
  - [ ] Offline banner shows network status
  - [ ] Cutover banner appears when flag enabled
  - [ ] i18n: Both locales load from `t.home.*`
- **Interaction tests**
  - [ ] Clicking "Handoff" navigates to handoff screen
  - [ ] Pull-to-refresh triggers shift sync
  - [ ] Shift badge updates on sync
- **Edge cases**
  - [ ] No active shift (new user)
  - [ ] Shift ended (expired)
  - [ ] Offline data aged > 1 hour (stale warning)
- **Accessibility**
  - [ ] Main content area has role="main"
  - [ ] Shift card is button or link (keyboard nav)
  - [ ] Color not the only cue: status also shown in text

**Test file:** `tests/screens/home.test.ts`  
**Files to test:** `app/(app)/(tabs)/index.tsx`, `src/features/shift/use-active-shift.ts`

---

#### Account / Auth Debug `/(app)/(tabs)/auth`
- **Component tests**
  - [ ] User email and organization display
  - [ ] "Sign Out" button present
  - [ ] Dev-only debug panel hidden in production
  - [ ] Token expiry countdown shown
- **Interaction tests**
  - [ ] Sign Out clears SecureStore, navigates to sign-in
  - [ ] Refresh token button calls Clerk API
- **Edge cases**
  - [ ] Clerk session expired mid-session
  - [ ] No org assigned (edge case)
- **Accessibility**
  - [ ] Button labels clear (not just icon)
  - [ ] Sign Out button highlighted as destructive action

**Test file:** `tests/screens/account.test.ts`  
**Files to test:** `app/(app)/(tabs)/auth.tsx`

---

#### NFC Equipment Scan `/(app)/scan`
- **Component tests** *(75 existing tests — audit for gaps)*
  - [ ] NFC listener started on mount
  - [ ] Scan results list shows queued + synced items
  - [ ] Status badge: "pending", "synced", "failed"
  - [ ] Failed row shows Retry button
  - [ ] Empty state when no scans
  - [ ] Offline state: items queue to PendingSyncStore
- **Interaction tests**
  - [ ] NFC tag tap → adds item to queue
  - [ ] Retry failed sync → calls `processQueue()`
  - [ ] Clear list removes all scans
  - [ ] Code Blue mutation blocked offline (safety)
- **Edge cases**
  - [ ] Duplicate tag tap (debounce)
  - [ ] Offline → online sync replay
  - [ ] Emergency endpoint + offline → throws before queue
- **Accessibility**
  - [ ] Scan results table has column headers
  - [ ] Status changes announced via aria-live
  - [ ] Retry button accessible via keyboard

**Test file:** `tests/screens/scan.test.ts` (extend existing)  
**Files to test:** `app/(app)/scan.tsx`, `src/lib/nfc-platform.ts`

---

### Wave 1 — Equipment Core (3 screens)

#### Equipment List `/(app)/(tabs)/equipment`
- **Component tests**
  - [ ] List renders with pagination controls
  - [ ] Filter chips: status, search query
  - [ ] Empty state when no results
  - [ ] Offline: cached list shown with stale badge
  - [ ] Search input filters by name/ID
- **Interaction tests**
  - [ ] Clicking item navigates to detail
  - [ ] Filter selection triggers API fetch
  - [ ] Load more / pagination works
  - [ ] Pull-to-refresh updates list
- **Edge cases**
  - [ ] Search returns no results
  - [ ] API timeout → error banner with retry
  - [ ] Offline first load (no cache)
  - [ ] Large list (100+ items, pagination)
- **Accessibility**
  - [ ] List items are buttons/links
  - [ ] Filter buttons clearly labeled
  - [ ] Search input label associated
  - [ ] Loading state announced (aria-busy)
  - [ ] RTL: list still readable, sort order preserved

**Test file:** `tests/screens/equipment-list.test.ts`  
**Files to test:** `app/(app)/(tabs)/equipment.tsx`, `src/features/equipment/use-equipment.ts`

---

#### My Equipment `/(app)/(tabs)/my-equipment`
- **Component tests**
  - [ ] Shows only user's checked-out items
  - [ ] Empty state: "No checked-out equipment"
  - [ ] Item cards show name, status, duration (time since checkout)
  - [ ] "Return" button visible on each item
- **Interaction tests**
  - [ ] Click Return → confirmation modal → calls return API
  - [ ] List updates on return
- **Edge cases**
  - [ ] User has never checked out
  - [ ] Checkout expired (overdue)
  - [ ] Return fails → error shown, item still in list
- **Accessibility**
  - [ ] Return button clearly labeled (not just icon)
  - [ ] Item cards have sufficient contrast
  - [ ] Touch targets 44px+

**Test file:** `tests/screens/my-equipment.test.ts`  
**Files to test:** `app/(app)/(tabs)/my-equipment.tsx`

---

#### Equipment Detail `/(app)/equipment/[id]`
- **Component tests**
  - [ ] Equipment details (name, status, location, last user)
  - [ ] Status badge color matches design system
  - [ ] Action buttons: Checkout, Return, Update Status, Edit
  - [ ] Empty state if equipment not found
  - [ ] Offline: cached detail shown
- **Interaction tests**
  - [ ] Checkout button opens confirmation → calls API
  - [ ] Update Status button opens sheet modal
  - [ ] Edit navigates to new equipment form
  - [ ] Back button works
- **Edge cases**
  - [ ] Equipment deleted while viewing
  - [ ] Checkout fails (already checked out by another user)
  - [ ] Offline checkout → queued
- **Accessibility**
  - [ ] Action buttons clearly labeled
  - [ ] Status color not the only cue (text label present)
  - [ ] Touch targets 44px+
  - [ ] RTL: layout flips but icons don't mirror

**Test file:** `tests/screens/equipment-detail.test.ts` (extend existing)  
**Files to test:** `app/(app)/equipment/[id].tsx`, `src/features/equipment/use-equipment-detail.ts`

---

### Wave 2 — Equipment Actions (3 screens)

#### Update Status `/(app)/equipment/[id]/update-status`
- **Component tests**
  - [ ] Status picker shows all valid statuses (enum)
  - [ ] Current status pre-selected
  - [ ] Notes field (optional)
  - [ ] Submit button disabled until valid
  - [ ] Cancel dismisses modal
- **Interaction tests**
  - [ ] Select new status → enable submit
  - [ ] Submit calls PATCH API with version (optimistic concurrency)
  - [ ] Success: modal closes, parent refreshes
  - [ ] Error: toast shown, modal stays open
- **Edge cases**
  - [ ] Concurrent update (version conflict) → show error
  - [ ] Offline status change → queued
  - [ ] No permission to update → error
- **Accessibility**
  - [ ] Status options labeled clearly
  - [ ] Form labels associated with inputs
  - [ ] Error messages linked to fields
  - [ ] Escape key closes modal

**Test file:** `tests/screens/update-status.test.ts`  
**Files to test:** `app/(app)/equipment/[id]/update-status.tsx`, `src/features/equipment/use-equipment-update.ts`

---

#### Checkout / Return (Inline)
- **Component tests**
  - [ ] Quick action buttons in detail view
  - [ ] Confirmation modal before action
  - [ ] Loading state on button
- **Interaction tests**
  - [ ] Checkout → API call → modal closes, detail updates
  - [ ] Return → same flow
  - [ ] Undo after accidental action (if supported)
- **Edge cases**
  - [ ] Equipment already checked out (by you / someone else)
  - [ ] Action fails → error toast
  - [ ] Offline action → queued
- **Accessibility**
  - [ ] Button labels: "Checkout" / "Return" (not ambiguous)
  - [ ] Confirmation modal has clear CTA labels

**Test file:** `tests/screens/checkout-return.test.ts`  
**Files to test:** `app/(app)/equipment/[id].tsx` (inline actions)

---

#### New Equipment `/(app)/equipment/new`
- **Component tests**
  - [ ] Form fields: name, type, location, serial (required)
  - [ ] Optional fields: notes, image
  - [ ] Form validation (name required, etc.)
  - [ ] Cancel button
  - [ ] Submit button disabled until valid
- **Interaction tests**
  - [ ] Fill form → submit calls POST API
  - [ ] Success: navigate to detail of new equipment
  - [ ] Error: validation errors shown inline
- **Edge cases**
  - [ ] Name already exists (API validation)
  - [ ] Offline creation → queued (no POST offline)
  - [ ] Image upload fails (network error)
- **Accessibility**
  - [ ] All form fields have associated labels
  - [ ] Required indicator clear
  - [ ] Validation errors announced
  - [ ] Touch targets 44px+

**Test file:** `tests/screens/new-equipment.test.ts`  
**Files to test:** `app/(app)/equipment/new.tsx`, `src/features/equipment/use-equipment-create.ts`

---

### Wave 3 — Shift (1 screen)

#### Shift Handoff `/(app)/shift/handoff`
- **Component tests**
  - [ ] Current shift details displayed
  - [ ] Handoff notes text area
  - [ ] Next technician selector (autocomplete)
  - [ ] Sign-off checkbox (agreement to handoff)
  - [ ] Submit button
- **Interaction tests**
  - [ ] Type notes → form becomes dirty
  - [ ] Select technician → populates
  - [ ] Check agreement → enable submit
  - [ ] Submit calls POST API
  - [ ] Success: navigate to home, show confirmation toast
- **Edge cases**
  - [ ] No next technician available (error)
  - [ ] Notes too long (truncate / warn)
  - [ ] Offline handoff → cannot complete
  - [ ] Handoff fails (API error)
- **Accessibility**
  - [ ] All form fields labeled
  - [ ] Technician selector keyboard navigable (autocomplete)
  - [ ] Agreement checkbox labeled
  - [ ] Success message announced

**Test file:** `tests/screens/shift-handoff.test.ts`  
**Files to test:** `app/(app)/shift/handoff.tsx`, `src/features/shift/use-shift-handoff.ts`

---

### Wave 4 — Rooms & Alerts (2 screens)

#### Rooms List `/(app)/(tabs)/rooms`
- **Component tests**
  - [ ] List of rooms displayed
  - [ ] Each room shows equipment count
  - [ ] Empty state if no rooms
  - [ ] Offline: cached rooms shown
- **Interaction tests**
  - [ ] Click room → navigate to detail
  - [ ] Pull-to-refresh
  - [ ] Search/filter rooms
- **Edge cases**
  - [ ] No rooms in clinic
  - [ ] Room has no equipment
- **Accessibility**
  - [ ] Room items are buttons/links
  - [ ] Equipment count announced
  - [ ] Touch targets 44px+

**Test file:** `tests/screens/rooms-list.test.ts`  
**Files to test:** `app/(app)/(tabs)/rooms.tsx`

---

#### Alerts `/(app)/(tabs)/alerts`
- **Component tests**
  - [ ] List of critical + overdue alerts
  - [ ] Alert priority badge (color)
  - [ ] Equipment/item context shown
  - [ ] Empty state: "No active alerts"
  - [ ] Filter by type (critical, overdue)
- **Interaction tests**
  - [ ] Click alert → navigate to relevant equipment
  - [ ] Dismiss alert (if supported)
  - [ ] Pull-to-refresh
- **Edge cases**
  - [ ] No alerts
  - [ ] Alert item deleted while viewing
  - [ ] Permission to see alerts checked
- **Accessibility**
  - [ ] Alert type indicated by text + color (not color alone)
  - [ ] Alert list has role="list"
  - [ ] Items have role="listitem"
  - [ ] Touch targets 44px+

**Test file:** `tests/screens/alerts.test.ts`  
**Files to test:** `app/(app)/(tabs)/alerts.tsx`

---

### Core Screens (4 screens)

#### Root `/_layout`, Auth Layout `/(auth)/_layout`, App Layout `/(app)/_layout`
- **Component tests**
  - [ ] Auth stack shown when not authenticated
  - [ ] App stack shown when authenticated
  - [ ] Cutover banner conditionally rendered (flag-gated)
  - [ ] Deep-link handling works
- **Interaction tests**
  - [ ] Navigation between stacks works
  - [ ] Back button behavior correct per stack
- **Edge cases**
  - [ ] Flag flip mid-session (cutover banner appears/disappears)
  - [ ] Race condition: auth state changes during navigation
- **Accessibility**
  - [ ] Main navigation structure navigable via keyboard

**Test files:** `tests/navigation/*.test.ts`  
**Files to test:** `app/_layout.tsx`, `app/(auth)/_layout.tsx`, `app/(app)/_layout.tsx`

---

#### Tabs Layout `/(app)/(tabs)/_layout`
- **Component tests**
  - [ ] All 5 tabs visible (Equipment, My Equipment, Rooms, Alerts, Account)
  - [ ] Correct icons + labels per locale
  - [ ] Active tab highlighted
- **Interaction tests**
  - [ ] Tab switching works
  - [ ] Back button behavior in tab context
- **Accessibility**
  - [ ] Tab bar has role="tablist"
  - [ ] Each tab has role="tab"
  - [ ] Keyboard: arrow keys switch tabs
  - [ ] Touch targets 44px+ (tab hit area)
  - [ ] Active tab indicated visually + aria-selected

**Test file:** `tests/navigation/tabs.test.ts`  
**Files to test:** `app/(app)/(tabs)/_layout.tsx`

---

#### Not Found
- **Component tests**
  - [ ] 404 page renders on invalid route
  - [ ] "Go Home" button works
- **Accessibility**
  - [ ] Error message clear
  - [ ] Navigation back to home available

---

## 2. Test Coverage Matrix

| Category | Target | Current | Gap |
|----------|--------|---------|-----|
| Unit tests (component logic) | 40 | 35 | +5 |
| Integration tests (API + sync) | 15 | 20 | ✅ |
| E2E / interaction tests | 10 | 4 | +6 |
| Accessibility tests (a11y) | 15 | 0 | +15 |
| **Total** | **80** | **59** | **+21** |

---

## 3. Testing Checklist by Type

### Component Tests
- [ ] Props passed correctly
- [ ] i18n: both locales render (spot check Hebrew)
- [ ] Loading states render (skeleton / spinner)
- [ ] Empty states render
- [ ] Error states render with message
- [ ] Offline mode: cached data shown with badge
- [ ] Dark mode (if applicable)

### Interaction Tests
- [ ] Button clicks trigger expected action
- [ ] Form submission calls API
- [ ] Error handling: toast / modal shown
- [ ] Navigation to next screen works
- [ ] Deep-link works after successful action

### Accessibility Tests (WCAG 2.1 AA)
- [ ] Contrast ratio ≥ 4.5:1 (normal text), ≥ 3:1 (UI components)
- [ ] Touch targets ≥ 44px × 44px
- [ ] Form labels associated (aria-labelledby / aria-describedby)
- [ ] Error messages linked to fields
- [ ] Loading announced (aria-busy, role="status")
- [ ] Interactive elements reachable via keyboard (Tab order logical)
- [ ] Screen reader compatible (roles, landmarks)
- [ ] RTL layout: text direction respected, icons not mirrored (except directional)

### Offline / Sync Tests
- [ ] Create operation offline → queued to PendingSyncStore
- [ ] Update operation offline → queued with version
- [ ] Delete operation offline → queued
- [ ] Code Blue mutation → blocked before queue (online-only)
- [ ] Reconnect → queue replays, UI updates
- [ ] Conflict (version mismatch) → error shown, user can retry/discard

---

## 4. Test Infrastructure

### Tools & Setup
- **Framework:** Vitest 3 (configured in `vitest.config.ts`)
- **Component rendering:** React Native Testing Library
- **Mocking:** MSW (Mock Service Worker) for API
- **Accessibility:** jest-axe (a11y assertion library)
- **Fixtures:** Shared test data in `tests/fixtures/`

### File Structure
```
tests/
  fixtures/          # Reusable test data (equipment, shifts, etc.)
  screens/           # Screen component tests (one per screen)
  integration/       # API + sync flow tests
  a11y/              # Accessibility tests
  deep-link-*.test   # Navigation + coexistence tests
```

### Running Tests
```bash
# All tests
pnpm test

# Watch mode
pnpm test --watch

# Single file
pnpm test tests/screens/equipment-list.test.ts

# With coverage
pnpm test --coverage
```

---

## 5. Accessibility Audit Specifics (WCAG 2.1 AA)

See companion document: `ACCESSIBILITY_AUDIT.md`

---

## 6. Rollout Plan

**Phase 1 (Week 1):** Unit + component tests for Wave 0–1 (10 screens)  
**Phase 2 (Week 2):** Unit + integration tests for Wave 2–4 + Core  
**Phase 3 (Week 3):** Accessibility tests across all 18 screens  
**Phase 4 (Week 4):** E2E / interaction tests + offline sync edge cases  

Verification: `pnpm test` → 80 tests passing, 0 TODO comments.

