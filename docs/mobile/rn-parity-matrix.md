# RN Parity Matrix — literate-dollop

**Updated:** 2026-06-22  
**Scope:** VetTrack Expo (post–June 2026 scope cut — equipment-first, no ER/patient/medication)  
**Source:** vettrack `src/pages/` — read-only port reference  
**Governance ref:** [`docs/governance/expo-agent-brief-2026-06-19.md`](../governance/expo-agent-brief-2026-06-19.md)

> **H5 exit met (2026-06-22).** Parity Waves 0–4 are complete (see Wave map below;
> detail in [`docs/porting-status.md`](../porting-status.md)). This matrix existing
> satisfies the E-P2-2 / P2-8 blocker. Remaining climb is H4 → H6 → H7 (see
> [`PLAN.md`](../../PLAN.md)).

---

## Scope cut (June 2026)

These pages **do not exist in the RN target** — removed from vettrack at migrations 142–143:

| vettrack page | Reason excluded |
|---------------|-----------------|
| `appointments.tsx` | ER/patient flow removed |
| `code-blue*.tsx` | Wall display / web-only emergency surface |
| `display.tsx` | Kiosk display — web-only |
| `patients.tsx` / `patientDetail` | Removed June 2026 |
| `billing*.tsx` | Removed June 2026 |
| `medsPage` / `pharmacyForecast` | Removed |
| `erImpact` / `erCommandCenter` / `erOperationalControl` | Removed |
| `rooms-list.tsx` / `room-radar.tsx` | Web layout — defer to H6 |
| `management-dashboard.tsx` | Admin / ops — H6 |
| `admin*.tsx` / `AdminDocksPage` / `AdminAssetTypesPage` | Admin — H6 |
| `equipment-qr-print.tsx` / `qr-print.tsx` | Print flow — web-only |
| `analytics.tsx` / `audit-log.tsx` | Staff-level admin — H6 |
| `procurements.tsx` / `inventory*.tsx` | Inventory — out of scope H1–H5 |
| `shift-leaderboard.tsx` | Gamification — H5+ |
| `crash-cart.tsx` / `handoff.tsx` | Specialised clinical — H5+ |
| Board (`/equipment/board`) | **Permanently web-only** (kiosk wall) |

---

## Wave map

### Wave 0 — Foundation (complete)

| Screen | Expo route | Status |
|--------|-----------|--------|
| Sign in | `/(auth)/sign-in` | ✅ Phase 1 |
| Home / dashboard | `/(app)/(tabs)/index` | ✅ Phase 1 |
| Account / auth debug | `/(app)/(tabs)/auth` | ✅ Phase 1 |
| NFC equipment scan | `/(app)/scan` | ✅ Phase 3 |

### Wave 1 — Equipment core (✅ Complete)

| vettrack reference | Expo route | Priority | API endpoints | Status |
|-------------------|-----------|----------|---------------|--------|
| `equipment-list.tsx` | `/(app)/(tabs)/equipment` | **P0** | `GET /api/equipment?q&status&page&limit` | ✅ Complete |
| `my-equipment.tsx` | `/(app)/(tabs)/my-equipment` | **P0** | `GET /api/equipment/my` | ✅ Complete |
| `equipment-detail.tsx` | `/(app)/equipment/[id]` | **P0** | `GET /api/equipment/:id` | ✅ Complete |

### Wave 2 — Equipment actions (✅ Complete)

| vettrack reference | Expo route | Priority | Notes | Status |
|-------------------|-----------|----------|-------|--------|
| Status update (sheet) | `/(app)/equipment/[id]/update-status` | P1 | `PATCH /api/equipment/:id` | ✅ Complete |
| Checkout / return (inline) | Inline in detail | P1 | `POST /api/equipment/:id/checkout` + `/return` | ✅ Complete |
| New equipment | `/(app)/equipment/new` | P2 | `POST /api/equipment` | ✅ Complete |

### Wave 3 — Shift (✅ Complete)

| vettrack reference | Expo route | Priority | Notes | Status |
|-------------------|-----------|----------|-------|--------|
| `home.tsx` (active shift) | `/(app)/(tabs)/index` (extend) | P1 | Shift summary, handover CTA | ✅ Complete |
| `handoff.tsx` | `/(app)/shift/handoff` | P2 | Shift handover flow | ✅ Complete |

### Wave 4 — Rooms / alerts (✅ Complete)

| vettrack reference | Expo route | Priority | Notes | Status |
|-------------------|-----------|----------|-------|--------|
| `rooms-list.tsx` | `/(app)/(tabs)/rooms` | P2 | Room browse + equipment per room | ✅ Complete |
| `alerts.tsx` | `/(app)/(tabs)/alerts` | P2 | Critical + overdue alerts | ✅ Complete |

---

## API surface (Phase 4 Wave 1)

All endpoints require `Authorization: Bearer <token>` (Clerk JWT).

| Endpoint | Response | Notes |
|----------|----------|-------|
| `GET /api/equipment` | `{ items: Equipment[], total, page, pageSize, hasMore }` | `?q=&status=&page=&limit=` |
| `GET /api/equipment/my` | `Equipment[]` | Checked-out by current user |
| `GET /api/equipment/:id` | `Equipment` | Full detail |

## API surface (Phase 5 additions)

| Endpoint | Response | Notes |
|----------|----------|-------|
| `PATCH /api/equipment/:id` | `Equipment` | Status update with `version` optimistic concurrency |
| `POST /api/equipment/:id/checkout` | `QuickScanToggleResult` | — |
| `POST /api/equipment/:id/return` | `QuickScanToggleResult` | — |
| `POST /api/equipment` | `Equipment` | Create new equipment |
| `GET /api/shifts/current` | `ShiftHandoverSummary \| null` | 404 → null |
| `POST /api/shifts/:id/handoff` | `void` | End active shift |
| `GET /api/rooms` | `Room[]` | All rooms with equipment counts |
| `GET /api/alerts` | `Alert[]` | Active equipment alerts |

---

## Frozen constraints

- No `GET /api/equipment/board` in RN (web-only)
- No PATCH/POST mutations in Phase 4 Wave 1 (read-only parity first)
- No realtime SSE until H6 approval (see frozen doctrine)
- `Code Blue` never queued offline
- All copy in `locales/*.json` — no hardcoded strings

---

## References

- API handlers: `~/vettrack/server/routes/equipment/handlers/`
- vettrack pages: `~/vettrack/src/pages/equipment-list.tsx`, `my-equipment.tsx`, `equipment-detail.tsx`
- Porting status: [`docs/porting-status.md`](../porting-status.md)
- Master plan: [`docs/plans/mobile-strategy-master.md`](../plans/mobile-strategy-master.md)
