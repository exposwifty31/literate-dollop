# Implementation Roadmap — VetTrack Expo Testing & Specs

**Plan period:** 2026-06-25 → 2026-08-15 (8 weeks)  
**Track:** Component testing + accessibility + design spec implementation

---

## Roadmap at a Glance

```
Week 1–2: Testing infrastructure setup + Wave 0 tests
Week 3–4: Wave 1–4 component tests
Week 5–6: Accessibility audit + fixes (WCAG 2.1 AA)
Week 7–8: E2E + offline sync tests + design token rollout
```

---

## Phase 1: Infrastructure & Setup (Week 1–2)

### TASK-TEST-001: Testing Framework Setup
**Status:** `ready`  
**Priority:** P0  
**Effort:** 2d

**What to do:**
Set up test infrastructure (jest-axe, mocking, fixtures). Create reusable test utilities and baseline test suites. Install dependencies, configure vitest for RN testing.

**Acceptance criteria:**
- [ ] `pnpm test` runs 59 existing tests + passes
- [ ] jest-axe integrated + accessibility tests can run
- [ ] MSW mock service set up for API fixtures
- [ ] Test fixtures file created (equipment, shifts, users)
- [ ] No TODOs in test infrastructure code

**Files:**
- `vitest.config.ts` (update)
- `tests/fixtures/equipment.ts` (create)
- `tests/fixtures/users.ts` (create)
- `tests/mocks/handlers.ts` (update)
- `tests/setup.ts` (create)

**Dependencies:** None (blocking for all test tasks)

---

### TASK-TEST-002: Design Tokens & Theme System
**Status:** `ready`  
**Priority:** P0  
**Effort:** 2d

**What to do:**
Implement design tokens (colors, typography, spacing, components) per DESIGN_HANDOFF_SPECS. Create reusable theme provider and style utilities.

**Acceptance criteria:**
- [ ] `apps/expo/src/theme/colors.ts` created with all tokens
- [ ] `apps/expo/src/theme/typography.ts` created
- [ ] `apps/expo/src/theme/spacing.ts` created
- [ ] All components use tokens (no hardcoded colors)
- [ ] RTL-aware spacing (margin-left → marginStart, etc.)
- [ ] Hebrew typography (Heebo font, increased lineHeight)
- [ ] TypeScript strict mode passes

**Files:**
- `apps/expo/src/theme/colors.ts` (create)
- `apps/expo/src/theme/typography.ts` (create)
- `apps/expo/src/theme/spacing.ts` (create)
- `apps/expo/src/theme/index.ts` (export all)
- `apps/expo/src/providers/ThemeProvider.tsx` (create)

**Dependencies:** TASK-TEST-001

---

## Phase 2: Wave 0–1 Component Tests (Week 2–3)

### TASK-TEST-003: Sign In Screen Tests
**Status:** `ready`  
**Priority:** P0  
**Effort:** 1d

**What to do:**
Write component + interaction tests for sign-in flow. Cover form rendering, validation, navigation, and error handling.

**Acceptance criteria:**
- [ ] 12 tests written (4 component, 4 interaction, 4 edge case)
- [ ] Clerk form rendering verified
- [ ] i18n: English + Hebrew locales tested
- [ ] Error handling tested (network, auth failure)
- [ ] RTL input handling verified
- [ ] All tests pass, no TODOs

**Test file:** `tests/screens/sign-in.test.ts`  
**Files to modify:** `app/(auth)/sign-in.tsx`, `src/providers/auth.tsx`

**Dependencies:** TASK-TEST-001, TASK-TEST-002

---

### TASK-TEST-004: Home Screen Tests
**Status:** `ready`  
**Priority:** P0  
**Effort:** 2d

**What to do:**
Write tests for home/dashboard. Cover shift card rendering, offline state, cutover banner, and navigation.

**Acceptance criteria:**
- [ ] 16 tests written (6 component, 5 interaction, 5 edge cases)
- [ ] Shift card states tested (active, ended, none)
- [ ] Offline data badge tested
- [ ] Cutover banner flag-gating tested
- [ ] i18n text loading verified
- [ ] Pull-to-refresh interaction tested
- [ ] All tests pass

**Test file:** `tests/screens/home.test.ts`  
**Files to modify:** `app/(app)/(tabs)/index.tsx`, `src/features/shift/use-active-shift.ts`

**Dependencies:** TASK-TEST-001, TASK-TEST-002

---

### TASK-TEST-005: Account Screen Tests
**Status:** `ready`  
**Priority:** P1  
**Effort:** 1d

**What to do:**
Write tests for account/auth debug screen. Cover logout, token display, and org context.

**Acceptance criteria:**
- [ ] 8 tests written (3 component, 3 interaction, 2 edge case)
- [ ] User info displayed correctly
- [ ] Sign out clears session
- [ ] Token expiry shown
- [ ] Dev-only panel hidden in prod
- [ ] All tests pass

**Test file:** `tests/screens/account.test.ts`  
**Files to modify:** `app/(app)/(tabs)/auth.tsx`

**Dependencies:** TASK-TEST-001

---

### TASK-TEST-006: NFC Scan Screen Tests (Audit + Extend)
**Status:** `ready`  
**Priority:** P0  
**Effort:** 2d

**What to do:**
Audit existing 75 tests for scan screen. Identify gaps, add tests for offline queueing and Code Blue safety.

**Acceptance criteria:**
- [ ] Audit complete: 75 tests reviewed, gaps identified
- [ ] 8 new tests added (offline queueing, Code Blue blocking, retry logic)
- [ ] Code Blue mutation never reaches queue (test enforces)
- [ ] Offline → online sync replay tested
- [ ] PendingSyncStore interaction verified
- [ ] All 83 tests pass

**Test file:** `tests/screens/scan.test.ts` (extend)  
**Files to modify:** `app/(app)/scan.tsx`, `src/lib/nfc-platform.ts`

**Dependencies:** TASK-TEST-001

---

### TASK-TEST-007: Equipment List Tests
**Status:** `ready`  
**Priority:** P0  
**Effort:** 2d

**What to do:**
Write tests for equipment list screen. Cover pagination, filtering, search, and offline caching.

**Acceptance criteria:**
- [ ] 18 tests written (6 component, 6 interaction, 6 edge case)
- [ ] List rendering + pagination verified
- [ ] Search + filter logic tested
- [ ] Offline fallback to cache tested
- [ ] Error handling (API timeout) tested
- [ ] Stale data badge shown when offline
- [ ] All tests pass

**Test file:** `tests/screens/equipment-list.test.ts`  
**Files to modify:** `app/(app)/(tabs)/equipment.tsx`, `src/features/equipment/use-equipment.ts`

**Dependencies:** TASK-TEST-001, TASK-TEST-002

---

### TASK-TEST-008: My Equipment + Equipment Detail Tests
**Status:** `ready`  
**Priority:** P0  
**Effort:** 2d

**What to do:**
Write tests for my-equipment list and equipment detail views. Cover checkout, return, and offline mutations.

**Acceptance criteria:**
- [ ] 20 tests written (8 component, 8 interaction, 4 edge case)
- [ ] My equipment: checkout items displayed, return button tested
- [ ] Detail: all fields + actions rendered
- [ ] Checkout offline → queued in PendingSyncStore
- [ ] Status conflicts handled (optimistic concurrency)
- [ ] Error states shown (permission denied, already checked out)
- [ ] All tests pass

**Test files:** `tests/screens/my-equipment.test.ts`, `tests/screens/equipment-detail.test.ts` (extend)  
**Files to modify:** `app/(app)/(tabs)/my-equipment.tsx`, `app/(app)/equipment/[id].tsx`, `src/features/equipment/use-equipment-detail.ts`

**Dependencies:** TASK-TEST-001, TASK-TEST-002

---

## Phase 3: Wave 2–4 + Core Tests (Week 3–4)

### TASK-TEST-009: Equipment Actions Tests
**Status:** `ready`  
**Priority:** P1  
**Effort:** 2d

**What to do:**
Write tests for update-status sheet, checkout/return buttons, and new equipment form.

**Acceptance criteria:**
- [ ] 18 tests written (6 component, 8 interaction, 4 edge case)
- [ ] Status picker tested (enum options, selection)
- [ ] Notes field optional handling verified
- [ ] PATCH API call with version (optimistic concurrency) tested
- [ ] Offline update → queued tested
- [ ] Form validation timing (blur/submit, not change) enforced
- [ ] Error modal shown on conflict
- [ ] All tests pass

**Test files:** `tests/screens/update-status.test.ts`, `tests/screens/checkout-return.test.ts`, `tests/screens/new-equipment.test.ts`

**Dependencies:** TASK-TEST-001, TASK-TEST-002

---

### TASK-TEST-010: Shift Handoff Tests
**Status:** `ready`  
**Priority:** P1  
**Effort:** 2d

**What to do:**
Write tests for shift handoff flow. Cover form validation, technician selection, and sign-off.

**Acceptance criteria:**
- [ ] 14 tests written (4 component, 6 interaction, 4 edge case)
- [ ] Shift details displayed (read-only)
- [ ] Notes field: multi-line, character limit
- [ ] Technician autocomplete: keyboard nav, selection
- [ ] Agreement checkbox required to enable submit
- [ ] Handoff API called on submit
- [ ] Error handling (no technicians available)
- [ ] Navigation after success
- [ ] All tests pass

**Test file:** `tests/screens/shift-handoff.test.ts`  
**Files to modify:** `app/(app)/shift/handoff.tsx`, `src/features/shift/use-shift-handoff.ts`

**Dependencies:** TASK-TEST-001, TASK-TEST-002

---

### TASK-TEST-011: Rooms + Alerts Tests
**Status:** `ready`  
**Priority:** P1  
**Effort:** 1.5d

**What to do:**
Write tests for rooms list and alerts screens. Cover rendering, filtering, and offline state.

**Acceptance criteria:**
- [ ] 14 tests written (6 component, 5 interaction, 3 edge case)
- [ ] Rooms list: items displayed, click navigates
- [ ] Room: equipment count shown
- [ ] Alerts: type badge + text (not color alone)
- [ ] Filter chips: toggleable, updates list
- [ ] Empty state: "No alerts" message
- [ ] Offline: cached data shown
- [ ] All tests pass

**Test files:** `tests/screens/rooms-list.test.ts`, `tests/screens/alerts.test.ts`

**Dependencies:** TASK-TEST-001, TASK-TEST-002

---

### TASK-TEST-012: Navigation & Layout Tests
**Status:** `ready`  
**Priority:** P1  
**Effort:** 1d

**What to do:**
Write tests for core layouts (root, auth, app, tabs). Cover navigation stacks, deep-links, and coexistence.

**Acceptance criteria:**
- [ ] 10 tests written (4 navigation, 4 deep-link, 2 flag-gating)
- [ ] Auth stack shows when not logged in
- [ ] App stack shows when logged in
- [ ] Tabs navigation works (5 tabs, active state)
- [ ] Back button behavior per stack
- [ ] Cutover banner flag-gating tested
- [ ] Deep-link routing verified
- [ ] All tests pass

**Test files:** `tests/navigation/*.test.ts`  
**Files to modify:** `app/_layout.tsx`, `app/(auth)/_layout.tsx`, `app/(app)/_layout.tsx`, `app/(app)/(tabs)/_layout.tsx`

**Dependencies:** TASK-TEST-001, TASK-TEST-002

---

## Phase 4: Accessibility Audit & Fixes (Week 5–6)

### TASK-A11Y-001: Contrast & Visual Tests
**Status:** `ready`  
**Priority:** P0  
**Effort:** 2d

**What to do:**
Implement jest-axe tests for contrast ratios and color usage. Audit all screens, fix violations.

**Acceptance criteria:**
- [ ] jest-axe tests created: `tests/a11y/contrast.test.ts`
- [ ] All screens tested for WCAG 1.4.3 (4.5:1 text, 3:1 UI)
- [ ] Status badges verified (color + text label)
- [ ] Contrast violations fixed (if any)
- [ ] Design tokens updated with ratios
- [ ] All a11y tests pass

**Test file:** `tests/a11y/contrast.test.ts`  
**Files to modify:** Design tokens, color usage in components

**Dependencies:** TASK-TEST-002

---

### TASK-A11Y-002: Keyboard Navigation Tests
**Status:** `ready`  
**Priority:** P0  
**Effort:** 2d

**What to do:**
Write keyboard navigation tests. Verify Tab order, focus visibility, form interaction.

**Acceptance criteria:**
- [ ] Keyboard nav tests: `tests/a11y/keyboard-nav.test.ts`
- [ ] Tab order verified on 10 screens (sign-in, home, equipment list, etc.)
- [ ] Focus ring visible (2px green outline)
- [ ] No keyboard traps
- [ ] All form fields keyboard-accessible
- [ ] Escape key closes modals
- [ ] All tests pass

**Test file:** `tests/a11y/keyboard-nav.test.ts`  
**Files to modify:** Focus styling in components

**Dependencies:** TASK-TEST-001, TASK-TEST-002

---

### TASK-A11Y-003: Touch Target Audit
**Status:** `ready`  
**Priority:** P0  
**Effort:** 1d

**What to do:**
Audit touch targets (44px minimum). Create device test plan for manual verification.

**Acceptance criteria:**
- [ ] All interactive elements ≥ 44px × 44px
- [ ] Button padding standardized (44px minimum height)
- [ ] List items: 56px height (44px target + padding)
- [ ] Manual QA checklist created for device testing
- [ ] No violations in component library

**Files to modify:** Component spacing/sizing, Button.tsx, ListItem.tsx, etc.

**Dependencies:** TASK-TEST-002

---

### TASK-A11Y-004: Form & Error Handling
**Status:** `ready`  
**Priority:** P0  
**Effort:** 2d

**What to do:**
Audit form labels, error associations, required field marking. Implement aria-labelledby, aria-describedby.

**Acceptance criteria:**
- [ ] Form tests: `tests/a11y/form-fields.test.ts`
- [ ] All inputs have associated labels (aria-labelledby or htmlFor)
- [ ] Error messages linked to fields (aria-describedby)
- [ ] Required fields marked (aria-required)
- [ ] Validation timing enforced (blur/submit, not change)
- [ ] Error role="alert" announced
- [ ] All tests pass

**Test file:** `tests/a11y/form-fields.test.ts`  
**Files to modify:** FormField.tsx, form screens (sign-in, new-equipment, shift-handoff)

**Dependencies:** TASK-TEST-001

---

### TASK-A11Y-005: RTL & Localization
**Status:** `ready`  
**Priority:** P0  
**Effort:** 2d

**What to do:**
Test RTL layout, text direction, bidirectional text. Verify Hebrew rendering + non-mirroring of directional icons.

**Acceptance criteria:**
- [ ] RTL tests: `tests/a11y/rtl.test.ts`
- [ ] Hebrew locale: all text renders correctly
- [ ] Dir attribute set correctly (dir="rtl" when he)
- [ ] Text alignment uses `textAlign: 'start'` (not left/right)
- [ ] Icons: directional arrows NOT mirrored, others not mirrored
- [ ] Numbers wrapped in `<bdi>` or bidirectional markup
- [ ] Font switched to Heebo for Hebrew
- [ ] Line height adjusted (1.6) for Hebrew legibility
- [ ] All tests pass

**Test file:** `tests/a11y/rtl.test.ts`  
**Files to modify:** i18n system, component text alignment, locale provider

**Dependencies:** TASK-TEST-001, TASK-TEST-002

---

### TASK-A11Y-006: Screen Reader & Semantic HTML
**Status:** `ready`  
**Priority:** P1  
**Effort:** 2d

**What to do:**
Add semantic HTML (roles, landmarks, headings). Test with VoiceOver + TalkBack.

**Acceptance criteria:**
- [ ] Heading hierarchy correct on all screens (h1 → h2 → h3 no jumps)
- [ ] Landmark roles added (main, navigation, contentinfo)
- [ ] Interactive elements have proper roles (button, link, tab)
- [ ] Live regions for status updates (aria-live, aria-busy)
- [ ] List structure: role="list" + role="listitem"
- [ ] Tested on iOS (VoiceOver) + Android (TalkBack)
- [ ] Findings documented in ACCESSIBILITY_AUDIT.md

**Test file:** `tests/a11y/semantic.test.ts`  
**Files to modify:** Screen components, layout shells

**Dependencies:** TASK-TEST-001

---

## Phase 5: E2E + Offline Tests (Week 7)

### TASK-TEST-013: Offline Sync Integration Tests
**Status:** `ready`  
**Priority:** P1  
**Effort:** 2d

**What to do:**
Write integration tests for offline queueing, reconnect, and sync replay. Test PendingSyncStore flow.

**Acceptance criteria:**
- [ ] 12 tests written (offline mutations, reconnect, replay)
- [ ] Create offline → queued in PendingSyncStore
- [ ] Update offline → queued with version
- [ ] Reconnect → queue processes
- [ ] Conflict handling (version mismatch)
- [ ] Code Blue mutation: blocked offline (safety)
- [ ] UI updates on sync success/failure
- [ ] All tests pass

**Test file:** `tests/integration/offline-sync.test.ts`  
**Files to modify:** `src/lib/sync-engine.ts`, `src/lib/pending-sync-store.ts`

**Dependencies:** TASK-TEST-001, TASK-TEST-006

---

### TASK-TEST-014: Deep-link & Coexistence Tests
**Status:** `ready`  
**Priority:** P1  
**Effort:** 1d

**What to do:**
Write tests for deep-link handling and Expo/Capacitor coexistence (regression test).

**Acceptance criteria:**
- [ ] Deep-links tested: `/scan`, `/equipment/:id`, `/shift/handoff`
- [ ] Post-auth redirect to deep-link works
- [ ] Capacitor `vettrack://` scheme doesn't collide with Expo
- [ ] Cutover banner shown only in Expo
- [ ] Capacitor kill-switch verified (can't run both)
- [ ] All tests pass

**Test file:** `tests/deep-link-return.test.ts` (extend)  
**Files to modify:** Navigation config, cutover banner

**Dependencies:** TASK-TEST-001

---

## Phase 6: Design System Rollout (Week 8)

### TASK-DESIGN-001: Component Library Implementation
**Status:** `ready`  
**Priority:** P1  
**Effort:** 2d

**What to do:**
Implement reusable component library per DESIGN_HANDOFF_SPECS. Create Button, Card, FormField, ListItem, etc.

**Acceptance criteria:**
- [ ] Button.tsx: 4 variants (primary, secondary, tertiary, danger), 3 sizes
- [ ] Card.tsx: 4 variants (default, elevated, outlined, critical)
- [ ] FormField.tsx: all input types, error/required states
- [ ] ListItem.tsx: title + description + badge layout
- [ ] Chip.tsx: selected/unselected states
- [ ] Sheet.tsx (bottom modal): handle bar, close button
- [ ] All components use design tokens (colors, spacing, typography)
- [ ] All components exported from `src/components/index.ts`
- [ ] TypeScript strict mode passes

**Files to create:**
- `apps/expo/src/components/Button.tsx`
- `apps/expo/src/components/Card.tsx`
- `apps/expo/src/components/FormField.tsx`
- `apps/expo/src/components/ListItem.tsx`
- `apps/expo/src/components/Chip.tsx`
- `apps/expo/src/components/Badge.tsx`
- `apps/expo/src/components/Sheet.tsx`
- `apps/expo/src/components/index.ts`

**Dependencies:** TASK-TEST-002

---

### TASK-DESIGN-002: Screen Components Refactor
**Status:** `ready`  
**Priority:** P1  
**Effort:** 2d

**What to do:**
Refactor existing screens to use component library and design tokens. Ensure consistency across all 18 screens.

**Acceptance criteria:**
- [ ] All 18 screens updated to use component library
- [ ] No hardcoded colors or spacing (all from tokens)
- [ ] Design system applied consistently
- [ ] Screens match DESIGN_HANDOFF_SPECS visually
- [ ] Tests still pass after refactor
- [ ] No TODOs in refactored code

**Files to modify:** All screen components (Wave 0–4 + core)

**Dependencies:** TASK-DESIGN-001, TASK-TEST-007–012

---

## Rollout Timeline

| Week | Phase | Focus | # Tests | Blockers |
|------|-------|-------|---------|----------|
| 1–2 | Setup | Infrastructure, design tokens | +15 | None |
| 2–3 | Wave 0–1 | Sign-in, home, equipment list | +46 | Phase 1 |
| 3–4 | Wave 2–4 + Core | Actions, shift, rooms, alerts, nav | +56 | Phase 2 |
| 5–6 | Accessibility | A11y audit + fixes | +25 | Phase 3 |
| 7 | E2E + Offline | Integration + deep-link tests | +12 | Phase 4 |
| 8 | Design System | Component library + refactor | — | Phases 1–7 |

**Total:** 59 (baseline) + 154 new tests = **213 tests** at completion  
**Total effort:** ~28 days of development (4–5 weeks, 1 dev)

---

## Dependencies Map

```
TASK-TEST-001 (Infrastructure)
├── TASK-TEST-002 (Design tokens) ✓
│   ├── TASK-TEST-003 to 012 (Component tests)
│   └── TASK-A11Y-002, 003, 005 (A11y tests)
├── TASK-TEST-003 to 005 (Wave 0)
│   └── TASK-TEST-006 (NFC)
│       └── TASK-TEST-013 (Offline sync)
├── TASK-TEST-007 to 012 (Waves 1–4 + Core)
│   └── TASK-A11Y-001 to 006 (Full a11y audit)
├── TASK-TEST-014 (Deep-link)
└── TASK-DESIGN-001 (Component library)
    └── TASK-DESIGN-002 (Screen refactor)
```

---

## Verification Checklist

Before considering each phase complete:

### Phase 1
- [ ] `pnpm test` runs and passes
- [ ] jest-axe installed and working
- [ ] Design tokens file creates without errors
- [ ] All theme files export correctly

### Phase 2–3
- [ ] All component tests pass: `pnpm test tests/screens`
- [ ] No TODOs in test files
- [ ] Code coverage ≥ 70% for screen components
- [ ] i18n: English + Hebrew tested

### Phase 4
- [ ] All a11y tests pass: `pnpm test tests/a11y`
- [ ] Contrast audit complete
- [ ] Manual QA on device: 5 screens with VoiceOver/TalkBack
- [ ] RTL layout spot-checked (3 screens in Hebrew)

### Phase 5
- [ ] Offline sync tests pass
- [ ] Deep-link tests pass
- [ ] No regressions in existing tests

### Phase 6
- [ ] All components exported + documented
- [ ] All screens refactored to use library
- [ ] Visual consistency audit passed
- [ ] `pnpm test` passes all 213 tests
- [ ] `tsc --noEmit` passes

---

## Success Metrics

- ✅ **213 tests** passing (59 baseline + 154 new)
- ✅ **WCAG 2.1 AA** compliance: 100% of critical categories (contrast, keyboard, forms, RTL)
- ✅ **Design system** implemented: 7 components, all screens refactored
- ✅ **Coverage** ≥ 70% on screens (from 40% baseline)
- ✅ **Zero TODOs** in delivered code
- ✅ **i18n parity** verified: English + Hebrew on all screens
- ✅ **CI/CD green** on all phases

