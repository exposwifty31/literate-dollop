# 00 — Capacitor UI Audit (the "old" VetTrack)

> **Purpose.** An honest, screen-by-screen audit of the *current* VetTrack UI as it
> ships today, so the native-mobile redesign is a deliberate **evolution** of what
> works — not a reinvention. Read this before `01-design-brief.md`.
>
> **Status:** read-and-audit only. No app code is changed by this document.
> **Author context date:** 2026-06-24.
> **Scope guard:** Reflects the post–June-2026 scope cut (equipment-first; no
> ER/patient/medication RN screens — see `docs/mobile/rn-parity-matrix.md`).

---

## What "the old UI" actually is

There are **two** front-ends in play, and the audit must keep them distinct:

1. **The desktop web app** (`vettrack` repo, React + Vite + Tailwind/shadcn, the
   "Ivory" design system). Forest-green brand, data-dense **dashboards and data
   tables**. This is what renders at desktop widths and what most of the
   `playwright-ui-screenshots/` captures show (top nav bar: *Admin · Ward · Shifts
   · Pharmacy · Equipment · Patients · Home · VetTrack*).
2. **The Capacitor build** (`uk.vettrack.app`) — the *same* React web app wrapped in
   a WebView and shipped to the App Store / Play Store. On phone widths the app
   already switches some screens to a **mobile shell**: a forest-green top bar, a
   **bottom tab bar with a floating green QR-scan FAB**, and stacked white cards
   (visible in *My Equipment*, *New Equipment*, *Shift Handover*). This is the thing
   real clinic staff hold in their hands today, and the thing the Expo rebuild
   replaces.

The redesign's north-star reaction — *"oh, this is so much better than the old
one"* — is measured against **(2)**: the squeezed-WebView experience. But the brand
DNA, status taxonomy, and information model all come from **(1)**.

> **Evidence base.** Real rendered screenshots in
> `vettrack/playwright-ui-screenshots/` (mirrored to `_audit_shots/` during this
> audit); brand tokens in `vettrack/src/index.css` + `vettrack/tailwind.config.ts`;
> the shipped component library (the bound "VetTrack Design System"). The *new*
> Expo app being redesigned lives in `literate-dollop/apps/expo/app/`.

---

## Brand DNA — what is non-negotiably "VetTrack" (carry forward, elevate)

Pulled verbatim from `vettrack/src/index.css` and `tailwind.config.ts`. These are
the exact tokens the native design system must evolve from — **not** reinvent.

### Color (light / default theme)
| Token | Value | Role |
|---|---|---|
| `--primary` | `hsl(130 42% 20%)` ≈ **`#1e4a25`** | Deep forest green — the brand. Primary buttons, headers, active tab. |
| `--primary-foreground` | `#ffffff` | Text/icon on green. |
| `--ivory-bg` | `rgb(246 247 251)` ≈ **`#f6f7fb`** | Warm/cool near-white page surface ("Ivory"). |
| `--ivory-surface` | `#ffffff` | Cards, sheets, raised panels. |
| `--ivory-border` | `rgb(216 220 230)` | Hairline card borders. |
| `--ivory-text` / `text2` / `text3` | `#111a12` / slate `#2e394d` / muted `#5a6884` | Primary → secondary → muted ink. |
| `--ivory-green` / `greenMid` / `greenBg` | `#1e4a25` / `#1e7a32` / `#e9f4ea` | Brand green ramp + selected/success tint. |

### Clinical status taxonomy (the heart of the product — KEEP)
| Status | Solid | Soft bg / fg / border (badge) |
|---|---|---|
| **ok** (operational) | `#16a34a` | `#f0faf2` / `#166534` / `#a7f3bd` |
| **issue** | `#dc2626` | `#fff1f1` / `#7f1d1d` / `#fca5a5` |
| **maintenance** | `#d97706` | `#fffbeb` / `#78350f` / `#fcd34d` |
| **sterilized** | `#2563eb` (≈`221 83% 53%`) | `#eff6ff` / `#1e40af` / `#93c5fd` |
| **info** | `#2563eb` | — |

> The Expo `EquipmentStatus` union extends these with **`critical`** (`#b91c1c`) and
> **`needs_attention`** (`#c2410c`) — see `apps/expo/constants/statusColors.ts`.
> Those two MUST survive the redesign as first-class statuses (today some RN list
> screens silently collapse them into a generic "info" label — a regression to fix,
> not a pattern to keep).

### Dedicated safety / connectivity namespaces (already in the brand — surface them)
| Namespace | Tokens | Use |
|---|---|---|
| **emergency** | `bg #0c0c0c`, `surface #18181b`, `accent #ef4444`, `amber #fbbf24`, `text #f4f4f5` | The dark Code Blue console. A *distinct, deliberate* visual register. |
| **offline** | `bg #fef3c7`, `border #d97706`, `text #78350f` | Amber offline / queued banners. |

### Radius / shadow / type / motion
- **Radius:** `--radius` 10px base; `sm 6 · md 8 · xl 12 · 2xl 16 · pill 9999`.
- **Shadow:** `--shadow-card` (`0 1px 3px rgb(15 23 42/.08)`) — subtle, clinical.
- **Type:** `font-sans` = **Plus Jakarta Sans / Heebo / Noto Sans Hebrew / Rubik**;
  `font-mono` = IBM Plex Mono; **`font-num` = DM Mono** (tabular numerals for
  stats/counts/IDs).
- **Motion:** `--motion-instant 120ms · quick 200ms · enter 620ms · celebrate
  700ms · pill 320ms`; eases `enter cubic-bezier(.2,.8,.2,1)`,
  `reward cubic-bezier(.34,1.56,.64,1)`. The brand already has an opinion about
  motion — keep it subtle and meaningful.

**Brand DNA verdict:** deep-green + ivory + a tight clinical status palette +
tabular-number stats + restrained motion is a strong, coherent identity. The
redesign must look like *the same company leveled up*, not a new app.

---

## Screen-by-screen audit

Each entry: what it is today → **Pros (keep / carry forward)** → **Cons
(desktop-web baggage — do NOT port)** → **Mobile-native opportunity**. The
"→ Expo route" line maps the old screen to the new-app route it informs.

---

### 1. Sign in / onboarding
**Old:** Centered card, email + password, forest-green submit. Onboarding is a
3-step coach-mark **walkthrough** modal ("שלב 1 מתוך 3 — סרוק את הפריט הראשון",
Next / Skip) that overlays the first real screen and teaches the scan gesture.
→ Expo route: `app/(auth)/sign-in.tsx`; onboarding ≈ `OnboardingWalkthrough`.

- **Pros:** Dead-simple credential form; the scan-first coach-mark is genuinely
  good onboarding — it teaches the one gesture the whole product hinges on.
- **Cons:** The walkthrough renders as a **centered desktop dialog** floating over a
  dimmed page; on a phone it reads as a web modal, not a native sheet. The current
  Expo sign-in has **hardcoded English strings** ("Email", "Password", "Sign in",
  "Continue without Clerk (dev)") — a doctrine violation, not a style choice.
- **Mobile-native opportunity:** Full-screen native auth with large fields, OS
  password autofill / keychain, and `KeyboardAvoidingView`. Re-cast onboarding as a
  swipeable, dismissible **bottom-sheet** sequence (or a paged coach-mark) that
  points at the real scan FAB. Every string via `t(onboarding.*)`.

---

### 2. Home / "Today"
**Old:** Two faces. The *desktop* "Home" is nearly empty (top nav + blank canvas in
the capture). The *mobile* "dashboard" stacks a **location overview** (rooms with
availability progress bars) and a **"System health"** debug panel (memory `66/74
MB`, uptime `1m`, sync successes/failures) — developer telemetry surfaced to end
users. Mixed EN/HE throughout.
→ Expo route: `app/(app)/(tabs)/index.tsx`.

- **Pros:** A shift-aware landing surface is the right instinct. The current Expo
  home already has the bones: a **shift summary card** (started-at, items-out,
  *End shift* CTA) and a big **Scan** CTA.
- **Cons:** "System health / memory / sync stats" is **desktop/diagnostic baggage** —
  it belongs in a debug screen, never on a clinician's home. Generic Expo-starter
  styling (blue `#0a7ea4` button, `#f4f6f8` card) — **none of the brand green**. No
  real hierarchy: title, subtitle ("phase subtitle"), card, button stacked flat.
- **Mobile-native opportunity:** A true **shift hero** — who's on, shift clock,
  items still out, today's scans — using the brand's `ShiftProgressHero` language
  and `font-num` stats. One unmissable primary action (Scan). Surface *urgent*
  counts (critical alerts, overdue) as tappable chips that deep-link. Kill the
  telemetry panel.

---

### 3. Equipment list (the core screen)
**Old (desktop):** "Equipment Overview" — four **KPI stat cards** (Needs Review /
Maintenance / Operational / Total with uptime %), an "Add Equipment" button, a
search box, then a **DATA TABLE**: columns *Status · Last Scan · Location · Name ·
ID*. Outlined status pills, "Never" last-scan, mono IDs (`eq-vent-1`). Footer:
three summary chips (devices healthy / in maintenance / overdue check).
→ Expo route: `app/(app)/(tabs)/equipment.tsx`.

- **Pros:** The **triage model is excellent** and must be carried forward: the
  KPI roll-up (attention / in-use / operational / total + uptime) and the
  status-first reading order. Search + status filter is the right control set.
  Information density is a *feature* for ward staff — they scan a lot at a glance.
- **Cons:** A **5-column data table** is the single worst piece of desktop baggage —
  tiny rows, horizontal columns that don't fit a phone, mouse-sized hit areas, no
  thumb affordance. Hover-dependent affordances. The current Expo list is the
  opposite extreme: a plain `FlatList` of name + one pill, **losing the KPIs, the
  location, last-scan, and ID entirely**, and it **collapses `critical`/
  `needs_attention` into "info"**. Spinner-only loading; generic palette.
- **Mobile-native opportunity:** Replace the table with **rich list rows / cards**:
  name (bold) + status pill + location + relative last-scan + recovery badge
  ("stale", "checked out 4h"), full-width tap target ≥ 56px. Keep the KPI roll-up
  as a compact **horizontal stat strip** above the list (tap a stat → filters).
  Filters as a sticky scrollable chip row; search as a native field. **Swipe
  actions** (check out / report issue) and long-press for bulk. Real **skeleton**
  rows, empty, error+retry, and offline states.

---

### 4. My Equipment
**Old (mobile, RTL):** "הציוד שלי / checked out 3". A "Return All (3)" full-width
action, then expandable cards per item: status badge (Critical / OK / Needs
Attention), name, location ("ICU Bay A"), "Since in about 3 hours". Bottom tab +
scan FAB. **English leaks**: "Return All", "checked out 3", "Since in about 3
hours".
→ Expo route: `app/(app)/(tabs)/my-equipment.tsx`.

- **Pros:** Sharp, useful focus screen — "what do *I* personally still hold?" plus a
  one-tap **Return All**. The expandable card with held-since duration is the right
  content. This is one of the most mobile-correct screens already.
- **Cons:** The i18n leaks betray that copy was hand-built, not fully `t()`-driven.
  Expand chevrons + per-card "Return" buttons are small. The current Expo version
  dropped **Return All** and the expandable detail; it's just a count + flat rows.
- **Mobile-native opportunity:** Keep Return-All as a pinned bottom action with a
  confirm sheet (`myEquipment.returnAllConfirm`). Per-row **swipe-to-return** with
  haptic confirat + undo toast. Show held-duration prominently (it drives shift
  handover). Everything via `t(myEquipment.*)`.

---

### 5. Equipment detail
**Old:** Rich detail built from the DS's `EquipmentTruthCard`,
`EquipmentDetailStatusStrip`, activity tab, tools sheet, "confirm in room", floor
notes, QR print, WhatsApp issue report, scan log (today/week/all) — a deep,
capable screen on web.
→ Expo route: `app/(app)/equipment/[id].tsx` (+ `[id]/update-status.tsx`).

- **Pros:** The detail *content model* is gold: status + who-has-it + location +
  serial/model/manufacturer + maintenance/sterilization dates + activity/scan log +
  inline checkout/return. The i18n already enumerates all of it
  (`equipmentDetail.*`).
- **Cons:** On web it's a long scroll of bordered sections, tabs, and dialog-driven
  tools — many **mouse/dialog affordances**. The current Expo detail is a thin
  subset: header + a bordered detail list + checkout/return + a link to
  update-status; **no activity/scan-log tab, no tools sheet, no floor notes**, and
  it uses hardcoded action colors (`#16a34a`/`#0891b2`) instead of tokens. Loading
  is a bare spinner.
- **Mobile-native opportunity:** A native **sticky header** (name + status + custody)
  over scrollable content; **Details / Activity** as native tabs; tools (report
  issue, move room, confirm-in-room, print QR) as a **bottom-sheet** action menu
  (≥48px rows). Update-status as a sheet, not a separate full page. Optimistic
  checkout/return with haptics + honest *pending-sync / conflict / sync-failed*
  inline states (the i18n keys already exist: `equipmentDetail.localState*`).

---

### 6. Update status
**Old/Expo:** A full-screen radio list of statuses (color dot + label + radio),
Cancel / Save footer, 409-conflict handling.
→ Expo route: `app/(app)/equipment/[id]/update-status.tsx`.

- **Pros:** Clean, correct, already uses the full status taxonomy + version
  optimistic-concurrency (409 → conflict copy). 52px rows. This is close to native.
- **Cons:** It's a **pushed full page** for a quick mutation; reads as a form, not a
  native picker. Tint/colors still generic.
- **Mobile-native opportunity:** Promote to a **bottom sheet** with large
  tappable status chips, status-tinted selection, haptic on select, and a
  prominent Save. Keep conflict handling; show it as an inline banner.

---

### 7. New equipment
**Old (mobile, RTL):** A long stacked form — Name, Serial Number, Model,
Folder/Category select, Purchase Date / expiry (native `dd/mm/yyyy` pickers),
MAINTENANCE section (interval days, expected-use minutes) — big green "שמור ציוד"
save. The onboarding coach-mark overlays it on first run. **EN/HE leaks** ("Name",
"Serial Number", "Purchase Date", "Set to auto-alert when maintenance is overdue").
→ Expo route: `app/(app)/equipment/new.tsx`.

- **Pros:** Sensible field set; native date inputs; single clear save. Current Expo
  version already uses `KeyboardAvoidingView` + validation + 52px inputs.
- **Cons:** Long single-column scroll with mixed-language labels; no grouping
  hierarchy on mobile; generic palette. Validation is name-only.
- **Mobile-native opportunity:** Grouped sections (Identity / Location /
  Maintenance) with native pickers and **scan-to-prefill** (read an NFC/QR tag to
  seed the ID). Inline validation, sticky Save, keyboard-aware. All labels `t()`.

---

### 8. Rooms (list + detail)
**Old (desktop "Equipment Radar" / רדאר ציוד):** "Add Room", filter pills (Synced
5/5 · Issue 1 · In Use 1 · Available 4), category chips (Other/Surgery/ER/ICU/All),
then a **2-column grid of room cards**: "Stale" badge, door icon with a 0% coverage
ring, room name, item count, **availability progress bar** ("avail 0/1", "in use
1"). Mixed EN/HE.
→ Expo routes: `app/(app)/(tabs)/rooms.tsx` + `app/(app)/rooms/[id].tsx`.

- **Pros:** The room-as-card with **availability bar + coverage/stale signal** is a
  strong glanceable model. Category + status filtering is useful.
- **Cons:** 2-up desktop grid; tiny ring gauges; the room *detail* on the current
  Expo side is **a stub** — it shows only name + floor, **no equipment list, no
  counts, no coverage** (a clear gap). Generic styling; badge colors hand-rolled.
- **Mobile-native opportunity:** Single-column **room rows/cards** with an
  availability bar and stale/coverage badge; tap → a real **room detail** listing
  the equipment in that room (reuse the equipment row), with a "Sweep / confirm all
  in room" action (the i18n + DS `EquipmentRoomSweepSheet` already exist). Sticky
  filter chips.

---

### 9. Alerts
**Old (desktop, RTL "התראות"):** "פעילות 5" active chip, inactive/low filters, then
large low-density cards: equipment name, "No scan in 14+ days" (EN leak), an
activity icon, location, and a big **"אני מטפל/ת בזה" (I've got this)** claim row.
→ Expo route: `app/(app)/(tabs)/alerts.tsx`.

- **Pros:** Alert taxonomy is solid (issue / overdue / sterilization_due / inactive)
  with severity colors; the **"I've got this" ownership** action is a great
  operational primitive. Current Expo alerts already handle stale-data inline banner
  vs full-screen error well.
- **Cons:** Very **low information density** on web (huge cards, lots of
  whitespace) — the opposite problem from the equipment table. EN leaks. Severity is
  encoded only by a small badge color.
- **Mobile-native opportunity:** Denser **grouped list** (by severity, most-urgent
  first), each row tappable → equipment detail, with a swipe / inline **"I've got
  this"** claim (haptic). A persistent urgent count that the Home hero mirrors.
  Pull-to-refresh; skeleton/empty/error states.

---

### 10. Shift handover
**Old (mobile, RTL "חפיפת משמרת"):** Title + "financial & operational summary",
**End shift** + **Export summary** buttons, collapsible sections — *Not returned*
(item — email — room), *Shift revenue* (time window + "₪59.00 accumulated"), *Shift
activity*, *Expiring soon*, *Consumables*. Bottom tab + FAB.
→ Expo route: `app/(app)/shift/handoff.tsx`.

- **Pros:** The "before you leave" checklist is exactly right for clinic shift
  changes; the unreturned-items warning is the safety-relevant part. Current Expo
  handoff already lists unreturned items + a confirm + 409 "already ended" handling.
- **Cons:** Collapsible accordions are web-ish; **exposes raw email addresses** and
  raw currency; revenue/consumables may be **out of the equipment-first RN scope**
  (verify against parity matrix before porting those sections). Generic styling +
  brief auto-`router.back()` success with no celebration.
- **Mobile-native opportunity:** A focused **handover sheet/flow**: prominent
  unreturned count + items, a single confirm, optional bulk-return inline, and a
  satisfying success state. Keep only equipment-relevant sections for the
  equipment-first scope; defer revenue/consumables unless the matrix says otherwise.

---

### 11. Scan (NFC) — net-new in Expo, no desktop equivalent
**Old:** Web had a QR/NFC entry; the Capacitor build exposes scan via the **green
FAB** in the bottom bar.
→ Expo route: `app/(app)/scan.tsx`.

- **Pros:** This is the **best** screen in the current Expo app and a model for the
  rest: a real **state machine** — idle → scanning → resolved → submitting →
  success / **queued** / **synced** / **failed** / **unsupported** — with honest
  offline queueing and safe-area handling. This is what "motion that explains state"
  should feel like everywhere.
- **Cons:** Still generic-tinted; states are text-only (no iconography / haptics /
  skeleton); "unsupported" is a dead end.
- **Mobile-native opportunity:** Keep the state machine; dress it in brand green,
  add **haptics** per transition, status-tinted result screens, and a clear path
  from "resolved" → equipment detail. Make the FAB the app's signature gesture.

---

### 12. Account / Admin (auth debug)
**Old:** Settings / admin / help exist on web; on RN this tab is an **auth-debug
screen** ("Fetch /api/users/me", sign out).
→ Expo route: `app/(app)/(tabs)/auth.tsx`.

- **Pros:** Useful as a dev affordance; sign-out lives somewhere sensible.
- **Cons:** **Entirely hardcoded English** ("Sign in to attach Clerk tokens…",
  "Fetch /api/users/me", "Sign out") — a doctrine violation. Reads as a developer
  tool, not an account screen. Generic palette.
- **Mobile-native opportunity:** A real **Account / Settings** screen: identity,
  **locale toggle (he/en) + RTL**, sync-queue access, sign out, app version /
  what's-new, help. All copy via `t()`. Keep a hidden/dev-only diagnostics section
  if needed.

---

### 13. Code Blue / emergency — the safety surface
**Old (web/kiosk, dark "emergency" theme):** A full immersive console — red "CODE
BLUE" header on near-black, precheck-passed-by, dispatch manager, patient + weight
("Rocky — 34.1 kg"), a giant **CPR cycle timer (11:30, rhythm-check countdown)**,
quick-log drug buttons (Atropine / Epinephrine / Vasopressin / defib shock /
compressor swap), connect-equipment, and a timestamped **event timeline**.
→ **Per the June-2026 scope cut + Frozen Doctrine, the full Code Blue *session
console* is web/kiosk-only and is NOT a ported RN screen.** What IS in RN scope is
the **safety *invariant*** and its honest states.

- **Pros:** The dark `emergency` register is a deliberate, unmistakable mode-shift —
  the right instinct: emergency must look and feel different. The timer + quick-log +
  timeline model is excellent for the wall display.
- **Cons (for mobile):** It is a dense, landscape, kiosk-oriented surface — porting
  it wholesale to a phone would violate scope and be unusable one-handed.
- **Mobile-native opportunity (in scope):** On mobile, "make the emergency surface
  more prominent and unmissable" means the **entry point and the honesty of its
  states**, not the console:
  - A persistent, high-contrast **emergency affordance** that is never buried (e.g. a
    code-blue entry/announcement surface or banner using the `emergency` tokens).
  - **Frozen-doctrine-correct offline behavior:** emergency mutations are *never*
    queued (`classifyEmergencyEndpoint` → block before any `expo-sqlite` write). So
    the mobile design must show **honest "blocked offline / requires connection"**
    states for any emergency action (`equipmentNfc.onlineRequired`, the
    `OfflineEmergencyMutationBlockedError` path), with no false "queued" promise.
  - Mirror active code-blue *status* (read-only) where relevant, deep-linking to the
    web/kiosk console rather than re-implementing it.

---

## Cross-app baggage to leave behind (applies everywhere)

These are *desktop-web* patterns the WebView inherited; none should survive into the
native app:

- **Data tables** (Equipment Overview) → rich list rows / cards.
- **Top horizontal nav bar** (Admin · Ward · Shifts · …) → native bottom tab bar
  (already started in Expo) + stack headers.
- **Hover-dependent affordances** → tap, long-press, swipe; visible state always.
- **Mouse-sized hit targets** (table rows, chevrons, "Return" buttons) → ≥ 44–48px
  everywhere; thumb-reach primary actions.
- **Centered desktop dialogs / accordions** → native bottom sheets and segmented
  controls.
- **Horizontal scroll / fixed-width grids** → single-column, vertically scrolling,
  responsive to safe areas.
- **Diagnostic/telemetry panels** (memory, uptime, sync counts on Home) → debug
  screen only.
- **A floating web-chat bubble** (visible bottom-right in every desktop capture) →
  not a mobile pattern; omit.

## Cross-app strengths to preserve and elevate

- **Deep-green + ivory brand** and the **clinical status taxonomy** (incl. `critical`
  / `needs_attention`).
- **Triage thinking:** KPI roll-ups, attention-first ordering, recovery/stale
  badges.
- **The scan-first gesture** (FAB) and its honest **offline/queued/synced** state
  machine.
- **Ownership primitives:** "I've got this", Return All, confirm-in-room, shift
  handover's unreturned check.
- **Tabular-number stats** (`font-num`) and **restrained, meaningful motion**.
- **A real RTL/Hebrew-first posture** — already the default; the rebuild must honor
  it natively.

---

## Honest defects in the *current Expo app* the redesign must fix

(These are not in the old web UI — they're regressions / stubs in
`literate-dollop/apps/expo/` that the redesign explicitly corrects.)

1. **No brand.** Generic Expo-starter palette everywhere (`#0a7ea4`, `#2f95dc`,
   `#f4f6f8`); `constants/Colors.ts` is the untouched template. Zero forest green.
2. **Status colors duplicated & inconsistent.** Each screen re-declares
   `STATUS_PILL_COLORS`; `equipment.tsx` / `my-equipment.tsx` **collapse `critical`
   & `needs_attention` into "info"**, while detail/update-status use the full set.
3. **No real states.** Loading is `ActivityIndicator` only — **no skeletons**; empty
   and error+retry exist but offline/slow-network/checked-out are mostly absent
   outside Scan.
4. **Hardcoded English** in `auth.tsx` and `sign-in.tsx` (doctrine violation).
5. **Stubbed screens:** `rooms/[id].tsx` (name+floor only); Home telemetry; Account
   tab is a debug fetcher.
6. **No haptics, minimal gesture vocabulary, no bottom sheets.** Mutations are
   pushed full pages.
7. **Lost depth vs. web:** equipment detail dropped activity log / tools / floor
   notes; my-equipment dropped Return-All.

---

## Route coverage map (every `apps/expo/app/` route, audited)

| Expo route | Old-UI reference | Audited in §|
|---|---|---|
| `app/_layout.tsx` (root: providers, i18n hydrate) | app shell | (infra — see Brief §0) |
| `app/+html.tsx` (web SSR wrapper) | — | (infra — web only) |
| `app/+not-found.tsx` | web 404 / `notFoundPage` | (infra — see Brief §0) |
| `app/(auth)/_layout.tsx` | auth stack | §1 |
| `app/(auth)/sign-in.tsx` | sign-in + onboarding | §1 |
| `app/(app)/_layout.tsx` (auth guard + CutoverBanner) | app frame + cutover/sync banners | §0/§13 |
| `app/(app)/(tabs)/_layout.tsx` (tab bar) | bottom tab + FAB | cross-app |
| `app/(app)/(tabs)/index.tsx` | Home / dashboard | §2 |
| `app/(app)/(tabs)/equipment.tsx` | Equipment Overview (table) | §3 |
| `app/(app)/(tabs)/my-equipment.tsx` | My Equipment | §4 |
| `app/(app)/(tabs)/rooms.tsx` | Rooms / Equipment Radar | §8 |
| `app/(app)/(tabs)/alerts.tsx` | Alerts | §9 |
| `app/(app)/(tabs)/auth.tsx` | Settings/Admin (RN: auth debug) | §12 |
| `app/(app)/scan.tsx` | Scan (FAB) | §11 |
| `app/(app)/equipment/[id].tsx` | Equipment detail | §5 |
| `app/(app)/equipment/[id]/update-status.tsx` | Status update | §6 |
| `app/(app)/equipment/new.tsx` | New equipment | §7 |
| `app/(app)/rooms/[id].tsx` | Room detail (stub) | §8 |
| `app/(app)/shift/handoff.tsx` | Shift handover | §10 |
| (safety invariant, cross-cutting) | Code Blue / emergency | §13 |

---

## The five "evolution" moves (preview — detailed in the Brief)

1. **Re-skin to the real brand.** One forest-green + ivory token system replaces the
   Expo-starter palette, applied everywhere — instant recognition, instant lift.
2. **Kill the table, keep the triage.** Equipment becomes rich, thumb-friendly list
   rows + a glanceable KPI stat strip — *denser AND calmer* than both the web table
   and the over-spaced cards.
3. **States as a feature.** Skeletons, empty, error+retry, offline, queued,
   checked-out, conflict — motion that *explains* state — generalized from the one
   screen (Scan) that already does it right.
4. **Native interaction layer.** Bottom sheets for mutations, swipe + long-press +
   haptics, safe-area-correct, ≥44–48px targets, one-handed reach.
5. **Honest, prominent safety.** The emergency surface is unmissable and *truthful*
   offline (never a fake "queued"), honoring the frozen Code-Blue invariant.

— end of audit —
