# 01 — Design Brief: VetTrack Native Mobile Redesign

> **You are "Claude Design."** This brief is self-contained: everything you need to
> design the new native VetTrack mobile app is here. Read `00-capacitor-ui-audit.md`
> for the evidence behind these decisions, but you can execute from this document
> alone.
>
> **Mission.** Lead a **native-mobile redesign** of the VetTrack Expo app
> (`literate-dollop/apps/expo/`). This is an **evolution of an existing product** —
> the same veterinary-clinic equipment-tracking app, same users, same brand — leveled
> up to feel like a real iOS/Android app instead of a desktop dashboard in a WebView.
>
> **North star.** When a clinician who uses the old Capacitor build opens the new
> one, the reaction is: *"oh — this is so much better than the old one. good job
> guys."* Every decision serves that reaction.

---

## 0. Deliverable — staged, full-app, approval-gated

### Phase 1 — DESIGN (approval gate; **no production code**)
Produce, as design artifacts (the design system + mockups are built as **Design
Components**, the HTML `.dc.html` format — see §8 "How to produce the artifacts"):

**1a. A native mobile design system**, specified and shown:
- Color (brand + status + emergency + offline), type scale, spacing scale,
  elevation, radius, motion.
- A **component library** rendered as real, annotated specimens: buttons (variants/
  sizes/states), cards, **status pills**, **list rows**, **bottom sheets**, **tab
  bar + scan FAB**, **stack headers**, inputs/forms, segmented controls, skeletons,
  banners (offline/sync/cutover/emergency), empty & error states, toasts, badges.

**1b. Annotated mockups for EVERY screen** in `apps/expo/app/` (the enumerated list
in §6), each shown in **RTL/Hebrew as the primary** rendering with an LTR/English
note, and each with its **real states** drawn (loading / empty / error+retry /
offline / slow-network / checked-out / conflict / queued — whichever apply). Each
mockup annotated with: the i18n keys used, tap targets, gestures, safe-area
behavior, and platform (iOS/Android) deltas.

**→ APPROVAL GATE.** Dan reviews and approves the *look* before any RN code changes.
Do not write or modify app code in Phase 1.

### Phase 2 — IMPLEMENT (only after approval)
Implement the approved design in React Native / Expo across all screens in
`apps/expo/app/`, screen by screen, honoring every constraint in §1. (Phase 2 is a
separate engagement; this brief defines it but Phase 1 is the immediate task.)

---

## 1. Non-negotiable constraints (hard requirements)

These are pulled from the repos and are **not** open to redesign. Violating any one
fails the deliverable.

### 1.1 Evolution, not reinvention
- Keep the **equipment status taxonomy** and elevate it. The full union (from
  `apps/expo/constants/statusColors.ts` + the web tokens) is:
  `ok` `issue` `maintenance` `sterilized` `critical` `needs_attention`.
  Exact colors to evolve from — solid / soft-bg / soft-fg / soft-border:
  - **ok** `#16a34a` / `#f0faf2` / `#166534` / `#a7f3bd`
  - **issue** `#dc2626` / `#fff1f1` / `#7f1d1d` / `#fca5a5`
  - **maintenance** `#d97706` / `#fffbeb` / `#78350f` / `#fcd34d`
  - **sterilized** `#2563eb` / `#eff6ff` / `#1e40af` / `#93c5fd`
  - **critical** `#b91c1c` (treat as a heightened issue; never collapse to "info")
  - **needs_attention** `#c2410c` (never collapse to "info")
  > The current RN list screens wrongly map `critical`/`needs_attention` → "info".
  > The redesign restores them as first-class. One shared status module; no per-screen
  > re-declared color maps.
- Keep the **VetTrack brand DNA: deep forest green + ivory**. Exact tokens to evolve
  from (`vettrack/src/index.css`, light theme):
  - **Brand green** `--primary: hsl(130 42% 20%)` ≈ **`#1e4a25`**; green ramp
    `#1e4a25` / `#1e7a32` / selected-tint `#e9f4ea`; on-green text `#ffffff`.
  - **Ivory surfaces** page `#f6f7fb`, card/sheet `#ffffff`, border `#d8dce6`.
  - **Ink** primary `#111a12`, secondary `#2e394d`, muted `#5a6884`.
  - **Radius** 10 base (sm 6 · md 8 · xl 12 · 2xl 16 · pill ∞).
  - **Shadow** card `0 1px 3px rgb(15 23 42/.08)`.
  - **Type** Plus Jakarta Sans / Heebo / Noto Sans Hebrew (sans); **DM Mono for
    numbers/IDs** (`font-num`).
  - **Motion** instant 120 · quick 200 · enter 620 · celebrate 700 (ms); eases
    `enter cubic-bezier(.2,.8,.2,1)`, `reward cubic-bezier(.34,1.56,.64,1)`.
  Do **not** introduce an unrelated visual language, a new brand color, gradients-as-
  decoration, or a different typeface family.

### 1.2 RTL-first, Hebrew default
- **Hebrew (`he`) is the default locale; the app is RTL** (`I18nManager.isRTL`).
  Design **RTL-first**: every layout must mirror correctly (leading/trailing, not
  left/right; chevrons, back affordances, progress bars, swipe directions all
  flip). LTR/English is the secondary case. (See `apps/expo/src/lib/i18n.ts`:
  `INITIAL_LOCALE`, `getDirection`, `applyLocaleDirection`.)
- Show each mockup RTL/Hebrew first.

### 1.3 All copy via `t()` — zero hardcoded strings
- Every visible string comes from `apps/expo/locales/{he,en}.json` through `t()`.
  **No hardcoded English, no hardcoded Hebrew** in mockups or code. In mockups,
  **reference the i18n key** (e.g. `equipmentList.empty.message`,
  `myEquipment.returnAllConfirm`, `scanScreen.queuedTitle`) rather than inventing
  copy. If a needed string has no key, propose the key path; never inline literal
  text. (The current `auth.tsx` and `sign-in.tsx` hardcode English — that is a bug
  the redesign removes.)

### 1.4 Native feel on **both** iOS and Android
- Platform-correct navigation (native stack headers, expo-router), gestures
  (swipe-back on iOS, predictive back on Android), **haptics** on key transitions,
  and **safe areas via `react-native-safe-area-context`** (`useSafeAreaInsets`) on
  every screen — top, bottom, and notch/home-indicator. Specify per-platform deltas
  where they differ (icons via SF Symbols / Material as the tab bar already does).

### 1.5 Tap targets & one-handed use
- **Minimum 44–48px** tap targets everywhere. **Thumb-reach / one-handed** is
  first-class: primary actions sit in the bottom third; the scan FAB is the signature
  reachable gesture. Assume gloves, motion, a busy ward.

### 1.6 Emergency / Code Blue — frozen safety invariant
- **Make the emergency surface MORE prominent and unmissable — never buried.** On
  mobile this means a persistent, high-contrast emergency *entry/announcement*
  affordance using the dedicated `emergency` tokens (dark `#0c0c0c` / surface
  `#18181b` / accent red `#ef4444` / amber `#fbbf24` / light text `#f4f4f5`).
- **Emergency mutations are NEVER queued offline.** `classifyEmergencyEndpoint()`
  blocks them before any `expo-sqlite` write (`offline-policy.ts` →
  `OfflineEmergencyMutationBlockedError`). Therefore the design must show **honest
  "requires connection / blocked offline"** states for emergency actions — **never a
  fake "queued/will-sync" promise**. (Contrast with ordinary mutations, which *do*
  queue.)
- The full **Code Blue session console is web/kiosk-only** (June-2026 scope cut). Do
  **not** design a phone port of the dark CPR-timer console. Design the mobile
  *entry point*, *read-only status mirror*, and *honest blocked states*.

### 1.7 Engineering doctrine the design must respect
- **Named exports only** (except expo-router page components, which stay default).
- **No new screens out of scope:** no ER / patient / hospitalization / medication /
  billing / inventory / admin screens; no ward kiosk `/equipment/board`
  (permanently web-only). Scope is **equipment-first** (see
  `docs/mobile/rn-parity-matrix.md`).
- Offline storage is `PendingSyncStore` (expo-sqlite); transport is HTTPS REST.
  Design offline/sync UI around that model (queued → syncing → synced → failed/
  conflict), not around realtime push.
- Don't design features that require new npm packages without flagging them.

### 1.8 Real states — design what the app currently fakes with a spinner
For every data screen, design the full state set (the i18n keys mostly exist):
- **Loading → skeletons** (not a bare `ActivityIndicator`). Match the DS skeleton
  language (`SkeletonEquipmentCard`, `EquipmentListSkeleton`, `EquipmentDetailSkeleton`).
- **Empty** (`*.empty.message` + hint).
- **Error + retry** (`*.errors.loadFailed` + `common.tryAgain`), inline-banner when
  stale data exists vs full-screen when nothing loaded.
- **Offline** (amber `offline` tokens; `equipmentNfc.onlineRequired`).
- **Slow-network** (skeleton persists / subtle progress; never a frozen blank).
- **Checked-out** (custody banner: `equipmentDetail.checkedOutBy`).
- **Conflict** (409 → `operationalState.versionConflict` /
  `equipmentDetail.localStateConflict`).
- **Queued / synced / sync-failed** (`scanScreen.queuedTitle/syncedTitle/failedTitle`,
  `equipmentDetail.localStatePendingSync/localStateSyncFailed`).
- **Code-blue / blocked-offline** (emergency tokens; honest, per §1.6).

---

## 2. The native design system (Phase 1a — specify and render these)

Evolve from the brand tokens in §1.1. Express them as a mobile token set (the
implementation will live in a single shared module replacing
`apps/expo/constants/Colors.ts` + `statusColors.ts`).

### 2.1 Color
- **Brand:** `green/700 #1e4a25` (primary), `green/600 #1e7a32` (mid/pressed),
  `green/50 #e9f4ea` (selected tint), on-green `#ffffff`.
- **Surfaces:** `bg #f6f7fb`, `surface #ffffff`, `border #d8dce6`, `borderStrong
  #bcc2d4`.
- **Ink:** `text #111a12`, `text2 #2e394d`, `text3 #5a6884`.
- **Status:** the 6-status set in §1.1 (solid + soft trio each).
- **Emergency:** the dark namespace in §1.6.
- **Offline:** `bg #fef3c7`, `border #d97706`, `text #78350f`.
- Provide a **dark theme** mapping (the web app already defines a forest-dark theme:
  bg `#0d1f0e`, surface `#111e12`, green `#3a9650`, text `#ece9e0`). Specify it; iOS/
  Android dark mode is expected.

### 2.2 Type scale (mobile)
Define a scale and map to roles (RN never goes below ~13px for body; numbers use DM
Mono). Suggested: Display 28/34 · Title 22/28 · Headline 17/22 (semibold) · Body
15/22 · Subhead 13/18 · Caption 12/16 · Num (DM Mono) for stats/IDs/timers. Confirm
weights available across Heebo/Noto Sans Hebrew for RTL.

### 2.3 Spacing & layout
- 4px base grid; standard insets 16px screen padding; 12px inter-card gap.
- Use **flex/grid with `gap`**, leading/trailing logical spacing (RTL-safe).
- Single-column, vertically scrolling; lists are `FlatList`-friendly row/card specs.

### 2.4 Elevation & radius
- Cards `radius 12`, sheets `radius 16/20` (top corners), pills `∞`, inputs `12`.
- One resting shadow (`shadow-card`), a slightly stronger one for sheets/FAB. Keep it
  clinical — no heavy drop shadows.

### 2.5 Motion
- Use the brand curves/durations (§1.1). Specify: route enter (subtle translateY+fade
  220–300ms), sheet present (spring), status-change pulse, scan state transitions,
  pull-to-refresh, success "celebrate" (reward curve) for handover/return-all. Motion
  must **explain state**, never decorate.

### 2.6 Component library (render each as an annotated specimen, all states)
1. **Buttons** — primary (green), secondary (outline), destructive, ghost; sizes; +
   loading / disabled / pressed (with haptic note).
2. **Status pill / badge** — all 6 statuses, solid + soft; with optional dot + icon;
   recovery badges ("stale", "checked out 4h", "never confirmed").
3. **List row** — equipment row (name + status + location + relative last-scan +
   recovery), my-equipment row (held-since + return swipe), alert row (severity +
   claim), room row (availability bar + stale). Specify swipe actions + long-press.
4. **Card / stat strip** — KPI stat strip (attention / in-use / operational / total /
   uptime%) using `font-num`; tappable to filter.
5. **Bottom sheet** — the primary mutation surface: update-status, tools menu,
   confirm dialogs, return-all confirm, onboarding. Drag handle, safe-area bottom,
   ≥48px rows.
6. **Tab bar + scan FAB** — 6 tabs (Today, Equipment, My Equipment, Rooms, Alerts,
   Account) with a centered green **scan FAB**; active = brand green; SF Symbols/
   Material icons (current names in `(tabs)/_layout.tsx`). FAB is the signature
   gesture.
7. **Stack header** — native title + leading back (RTL-mirrored) + trailing actions;
   large-title option for iOS; collapsing on scroll for detail.
8. **Inputs / form** — text, search, select, native date picker, validation error;
   keyboard-aware; grouped sections.
9. **Banners** — offline (amber), sync (pending/failed → view queue), cutover
   (`CutoverBanner`, currently navy `#1e3a8a` — re-tone to brand), **emergency**
   (dark/red, prominent).
10. **Skeletons** — list, card, detail.
11. **Empty / error / retry** states (illustration-light, on-brand).
12. **Toast / snackbar** — success/undo (return undo), error.

---

## 3. What "so much better than the old one" concretely means

Design to these four, measurable, felt differences:

1. **Denser-yet-calmer information.** More useful facts per screen than the old
   *mobile* cards (which were over-spaced) — *and* more legible than the old *desktop
   table* (which was cramped). Equipment rows carry name + status + location +
   last-scan + recovery in a calm, scannable rhythm with generous line-height and one
   clear status accent per row. The KPI roll-up returns as a compact stat strip.
2. **Real visual hierarchy.** One unmistakable primary action per screen; brand-green
   reserved for primary/active; status color used only for status; muted ink for
   metadata. No flat stacks of same-weight elements (the current RN home/list
   problem).
3. **Motion that explains state.** Skeleton → content fade, status-change pulse,
   scan state machine, queued→synced transition, swipe-return with haptic + undo,
   handover success celebrate. The user always knows what the system is doing —
   especially offline.
4. **One cohesive brand.** Forest green + ivory + DM-Mono numerals everywhere;
   the Expo-starter blue is gone entirely. Opening the app, it is unmistakably
   VetTrack — and unmistakably newer.

---

## 4. Information architecture & navigation

- **Bottom tab bar** (already scaffolded in `(tabs)/_layout.tsx`): Today ·
  Equipment · My Equipment · Rooms · Alerts · Account, with a **centered scan FAB**.
  Keep 6 tabs max; FAB is separate from tabs.
- **Stacks** off tabs: equipment detail, update-status (as **sheet**), new equipment,
  room detail, shift handoff, scan.
- **App frame** (`(app)/_layout.tsx`): auth guard → sign-in; persistent banner zone
  for cutover / sync / offline / emergency (order + priority must be specified).
- **Deep links / NFC entry** resolve to equipment detail (`linking/deep-link-return`,
  `nfcEntry.*`). Design the "opening equipment…" transitional state.

---

## 5. RTL, i18n & content rules for the mockups

- Render Hebrew-first; annotate the exact `t()` key under each text element.
- Mirror everything: back chevrons, list disclosure, swipe directions, progress
  fills, stat strips, sheet handles.
- Numbers/IDs/timers in DM Mono; format dates/times via the locale helpers
  (`formatDateByLocale`) — show both he-IL and en-US in annotations.
- Never expose raw emails / raw currency without a designed treatment (the old
  handover leaked `lior.cohen@…` and `₪59.00` inline).

---

## 6. Screens to design — EVERY route in `apps/expo/app/`

For each: **reference screenshot** (in `vettrack/playwright-ui-screenshots/`),
**source file**, the **redesign intent**, and the **states** to draw. (Rationale and
pros/cons are in `00-capacitor-ui-audit.md` at the cited section.)

> Infra/framework routes (no standalone visual screen, but must be accounted for):
> - **`app/_layout.tsx`** — root providers, fonts, `hydrateStoredLocale()`,
>   `applyLocaleDirection`, splash. Design: branded **splash / first-load** + font/RTL
>   readiness. (Audit §0)
> - **`app/+html.tsx`** — web SSR wrapper; no native UI (note only).
> - **`app/+not-found.tsx`** — **404 / unknown route** screen (`notFoundPage.*`).
>   Design: on-brand empty + "back to Today". (Audit §0)
> - **`app/(auth)/_layout.tsx`**, **`app/(app)/_layout.tsx`**,
>   **`app/(app)/(tabs)/_layout.tsx`** — navigation frames; design the **tab bar +
>   FAB**, **stack headers**, and the **banner zone** (cutover/sync/offline/
>   emergency) here.

| # | Screen | Source file | Reference shot | States to draw |
|---|---|---|---|---|
| 1 | **Sign in + onboarding** | `(auth)/sign-in.tsx` | `01-authentication-onboarding-signin.png` | default, submitting, error, dev-no-Clerk, onboarding sheet steps 1–3 (Audit §1) |
| 2 | **Today / Home** | `(app)/(tabs)/index.tsx` | `02-dashboard-home-home.png`, `…-dashboard.png` | loading(skeleton), active shift, no shift, urgent counts, offline (Audit §2) |
| 3 | **Equipment list** | `(app)/(tabs)/equipment.tsx` | `03-equipment-management-equipment.png` | skeleton, list (rows + KPI strip), filtered, search-empty, error+retry, offline, pagination/loading-more (Audit §3) |
| 4 | **My Equipment** | `(app)/(tabs)/my-equipment.tsx` | `03-equipment-management-my-equipment.png` | skeleton, list w/ held-since, return-swipe + undo, Return-All confirm sheet, empty, error (Audit §4) |
| 5 | **Equipment detail** | `(app)/equipment/[id].tsx` | (web detail; see Audit §5) | skeleton, loaded (Details/Activity tabs), checked-out banner, checkout/return optimistic, pending-sync/conflict/sync-failed, tools sheet, not-found, error+retry (Audit §5) |
| 6 | **Update status** | `(app)/equipment/[id]/update-status.tsx` | (Audit §6) | sheet w/ status chips, saving, 409 conflict, error (Audit §6) |
| 7 | **New equipment** | `(app)/equipment/new.tsx` | `03-equipment-management-equipment-new.png` | grouped form, validation error, saving, scan-to-prefill, save error (Audit §7) |
| 8 | **Rooms list** | `(app)/(tabs)/rooms.tsx` | `03-equipment-management-rooms.png` | skeleton, room rows (availability bar + stale), filtered, empty, error (Audit §8) |
| 9 | **Room detail** | `(app)/rooms/[id].tsx` | `03-equipment-management-rooms.png` | **build out from stub**: room header + equipment list + coverage + sweep action; skeleton/empty/error (Audit §8) |
| 10 | **Alerts** | `(app)/(tabs)/alerts.tsx` | `10-realtime-alerts-alerts.png` | skeleton, grouped-by-severity list, "I've got this" claim, stale-data inline banner, empty, error (Audit §9) |
| 11 | **Shift handoff** | `(app)/shift/handoff.tsx` | `05-scheduling-tasks-shift-handover.png` | loading, unreturned list, confirm, success celebrate, 409 already-ended, no-shift, error (Audit §10) |
| 12 | **Scan (NFC)** | `(app)/scan.tsx` | (FAB; Audit §11) | idle, scanning, resolved, submitting, success, **queued**, **synced**, **failed**, **unsupported** — branded + haptic (Audit §11) |
| 13 | **Account / Settings** | `(app)/(tabs)/auth.tsx` | `09-admin-settings-settings.png` | identity, locale/RTL toggle, sync-queue entry, sign out, version/what's-new, help; (replaces the English auth-debug) (Audit §12) |
| 14 | **Emergency surface** (cross-cutting; entry + banner + blocked states) | `offline-emergency-block.ts`, `offline-policy.ts`, `safety-surfaces.ts`; banner in `(app)/_layout.tsx` | `07-emergency-response-code-blue.png` (web console — reference for *register*, do **not** port) | prominent entry/announcement, read-only status mirror, **blocked-offline** state, online-required (Audit §13, §1.6) |
| 15 | **App frame & banners** | `_layout.tsx`, `(app)/_layout.tsx`, `(tabs)/_layout.tsx`, `CutoverBanner.tsx` | — | splash/first-load, tab bar + FAB, stack headers, banner priority (cutover/sync/offline/emergency) (Audit §0, cross-app) |
| 16 | **Not-found / 404** | `app/+not-found.tsx` | — | on-brand empty + back-to-Today (Audit §0) |

> Cross-check: this table + the infra note above cover **every** file under
> `apps/expo/app/` (auth: `_layout`, `sign-in`; app: `_layout`, `scan`,
> `equipment/[id]`, `equipment/[id]/update-status`, `equipment/new`, `rooms/[id]`,
> `shift/handoff`; tabs: `_layout`, `index`, `equipment`, `my-equipment`, `rooms`,
> `alerts`, `auth`; root: `_layout`, `+html`, `+not-found`).

---

## 7. Explicitly out of scope (do not design)

Per the June-2026 scope cut (`docs/mobile/rn-parity-matrix.md`) and Frozen Doctrine:
ER / patient / hospitalization / medication / pharmacy / billing / inventory /
procurement / analytics / audit-log / admin / shift-leaderboard / crash-cart screens;
the ward kiosk **`/equipment/board`** (permanently web-only); the full **Code Blue
session console** (web/kiosk-only — design only the mobile entry/status/blocked
states per §1.6). Do not add new npm dependencies without flagging them.

---

## 8. How to produce the artifacts (Phase 1)

- Build the design system and every screen mockup as **Design Components**
  (`.dc.html`), composing the bound **VetTrack Design System** components where they
  match (Button, Card, Badge, StatusBadge, Sheet, Skeleton, EmptyState,
  `EquipmentTruthCard`, `ShiftProgressHero`, `EquipmentStatStrip`, etc.) so the
  mockups are visually faithful to the real library. Phone-frame the screens (use the
  iOS/Android device-frame starters) and present screens on a pannable canvas grid,
  RTL-first.
- Annotate each screen with: i18n keys, tap-target sizes, gestures, safe-area zones,
  states, and iOS/Android deltas.
- Keep mockups true to the constraints — green/ivory only, RTL, status taxonomy,
  ≥44–48px targets, honest offline/emergency states.
- **Do not modify any file in `apps/expo/`** during Phase 1. Output is design
  artifacts only.

---

## 9. Acceptance checklist (Phase 1)

- [ ] Native design system specified + rendered (color, type, spacing, elevation,
      motion, full component library with states).
- [ ] A mockup for **every** route in §6, RTL/Hebrew-first, with all applicable
      states drawn.
- [ ] Forest-green + ivory brand only; **zero** Expo-starter blue; status taxonomy
      complete (incl. `critical`/`needs_attention`).
- [ ] Every string references an i18n key; no hardcoded he/en.
- [ ] ≥44–48px targets; one-handed primary actions; safe areas shown.
- [ ] Emergency surface prominent + **honest offline (never fake-queued)**; no phone
      port of the web Code-Blue console.
- [ ] Nothing out-of-scope designed; no undeclared new dependencies.
- [ ] iOS + Android deltas noted.

— end of brief —
