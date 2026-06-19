# RN Parity Matrix — literate-dollop

**Updated:** 2026-06-19  
**Scope:** VetTrack Expo (post–June 2026 scope cut — equipment-first, no ER/patient/medication)  
**Source:** vettrack `src/pages/` — read-only port reference  
**Governance ref:** [`docs/governance/expo-agent-brief-2026-06-19.md`](../governance/expo-agent-brief-2026-06-19.md)

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

### Wave 1 — Equipment core (Phase 4, in progress)

| vettrack reference | Expo route | Priority | API endpoints |
|-------------------|-----------|----------|---------------|
| `equipment-list.tsx` | `/(app)/(tabs)/equipment` | **P0** | `GET /api/equipment?q&status&page&limit` |
| `my-equipment.tsx` | `/(app)/(tabs)/my-equipment` | **P0** | `GET /api/equipment/my` |
| `equipment-detail.tsx` | `/(app)/equipment/[id]` | **P0** | `GET /api/equipment/:id` |

### Wave 2 — Equipment actions (Phase 4 follow-up)

| vettrack reference | Expo route | Priority | Notes |
|-------------------|-----------|----------|-------|
| Status update (sheet) | `/(app)/equipment/[id]/update-status` | P1 | `PATCH /api/equipment/:id` |
| Checkout / return (inline) | Inline in detail | P1 | `POST /api/equipment/:id/checkout` + `/return` |
| New equipment | `/(app)/equipment/new` | P2 | `POST /api/equipment` |

### Wave 3 — Shift (Phase 5)

| vettrack reference | Expo route | Priority | Notes |
|-------------------|-----------|----------|-------|
| `home.tsx` (active shift) | `/(app)/(tabs)/index` (extend) | P1 | Shift summary, handover CTA |
| `handoff.tsx` | `/(app)/shift/handoff` | P2 | Shift handover flow |

### Wave 4 — Rooms / alerts (Phase 5)

| vettrack reference | Expo route | Priority | Notes |
|-------------------|-----------|----------|-------|
| `rooms-list.tsx` | `/(app)/(tabs)/rooms` | P2 | Room browse + equipment per room |
| `alerts.tsx` | `/(app)/(tabs)/alerts` | P2 | Critical + overdue alerts |

---

## API surface (Phase 4 Wave 1)

All endpoints require `Authorization: Bearer <token>` (Clerk JWT).

| Endpoint | Response | Notes |
|----------|----------|-------|
| `GET /api/equipment` | `{ items: Equipment[], total, page, pageSize, hasMore }` | `?q=&status=&page=&limit=` |
| `GET /api/equipment/my` | `Equipment[]` | Checked-out by current user |
| `GET /api/equipment/:id` | `Equipment` | Full detail |

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
