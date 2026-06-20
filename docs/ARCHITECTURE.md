# ARCHITECTURE.md

> Living document. Update when the architecture changes — not when you plan to change it.
> Agents read this to understand system boundaries before proposing structural changes.
> Last updated: 2026-06-20

---

## What This System Does

VetTrack (`literate-dollop`) is an offline-first Expo/React Native app for veterinary teams. It lets vets and vet techs scan equipment NFC tags, queue clinical workflows when offline, and sync back to the VetTrack monolith when connectivity returns. Current scale: one pilot site; Phase 3 (NFC equipment scan) in progress.

---

## System Diagram

```
┌──────────────────────────────────────────┐
│          Expo / RN App (literate-dollop) │
│                                          │
│  ┌──────────┐   ┌──────────────────────┐ │
│  │ Expo     │   │  @vettrack/contracts  │ │
│  │ Router   │   │  (shared types)       │ │
│  │ screens  │   └──────────────────────┘ │
│  └────┬─────┘                            │
│       │                                  │
│  ┌────▼──────────────────────────────┐   │
│  │           Feature Layer           │   │
│  │  equipment/  shift-chat/  …       │   │
│  └────┬──────────────────────────────┘   │
│       │                                  │
│  ┌────▼──────────────────────────────┐   │
│  │           Service Layer            │   │
│  │  api.ts (thin slice)              │   │
│  │  nfc-platform.ts                  │   │
│  │  i18n.ts                          │   │
│  └────┬─────────────┬────────────────┘   │
│       │             │                    │
│  ┌────▼───┐   ┌─────▼──────────────┐     │
│  │Clerk   │   │  PendingSyncStore  │     │
│  │(auth)  │   │  (expo-sqlite)     │     │
│  └────┬───┘   └────────────────────┘     │
│       │                                  │
└───────┼──────────────────────────────────┘
        │ HTTPS REST (+ Clerk JWT)
        ▼
┌──────────────────────┐
│  VetTrack Monolith   │  exposwifty31/vettrack
│  (Express + Postgres)│
└──────────────────────┘
```

---

## Request Lifecycle

### Online scan flow
1. Expo Router screen calls NFC adapter (`nfc-platform.ts`) → returns tag ID.
2. Feature calls `getEquipmentByTagId(tagId)` in equipment API slice.
3. `api.ts` sends `GET /equipment/:tagId` with Clerk JWT header.
4. Monolith validates JWT + `clinicId`, returns equipment record.
5. Screen renders record.

### Offline mutation flow
1. Feature calls mutation via `api.ts`.
2. `api.ts` calls `classifyEmergencyEndpoint()` → throws if emergency endpoint.
3. `api.ts` calls `assertPendingSyncEnqueueAllowed()`.
4. `PendingSyncStore.addPendingSync(op)` writes to expo-sqlite.
5. On reconnect, sync engine dequeues, replays to monolith, marks `synced`.

---

## Module Boundaries

| Layer | Can import from | Cannot import from |
|-------|-----------------|--------------------|
| Expo Router screens (`app/`) | Feature layer, `@/hooks/*`, `@/lib/i18n` | Service layer directly, `expo-sqlite` directly |
| Feature layer (`src/features/`) | Service layer, `@/types/*`, `@vettrack/contracts` | Other features (no cross-feature imports) |
| Service layer (`src/lib/`) | `@vettrack/contracts`, external packages | Feature layer, screens |
| Contracts (`packages/contracts/`) | External type packages only | Anything in `apps/` |

Violations must be approved via `docs/DECISIONS.md` or `docs/adr/`.

---

## External Dependencies

| Service | Purpose | Access method | Failure behaviour |
|---------|---------|---------------|------------------|
| VetTrack monolith API | Equipment records, clinical data | HTTPS REST + Clerk JWT | Mutations queue in expo-sqlite; reads return cache |
| Clerk | Authentication | `@clerk/clerk-expo` SDK + SecureStore | All API requests rejected; app shows sign-in prompt |
| EAS Build | Native builds | EAS CLI + `eas.json` | Manual dev build fallback |
| expo-nfc | NFC tag reading | `nfc-platform.ts` adapter | Permission denied error surfaced to user; no crash |

---

## Data Model Overview

```
PendingSync        — offline mutation queue (expo-sqlite)
  id, endpoint, method, body, status, createdAt, retryCount, error

Equipment (cache)  — Phase 3b; read-through cache (not yet implemented)
  tagId, name, status, lastScannedAt, clinicId

@vettrack/contracts types (source of truth for shared shapes):
  PendingSync, EmergencySurface, PendingSyncEnqueueOp, OfflinePolicy
```

---

## Authentication and Authorisation

- **Mechanism:** Clerk JWTs (short-lived). Stored in SecureStore via `@clerk/clerk-expo`.
- **Enforced at:** All API requests in `api.ts` — JWT attached as `Authorization: Bearer`.
- **Tenancy:** `clinicId` embedded in JWT; server enforces. Client never trusts its own JWT role for access decisions.
- **Exceptions:** Health check endpoint (`/health`) is unauthenticated.
- **Offline:** Clerk session cached locally; mutations queue without hitting auth endpoint.

---

## Security Model

**What we protect:**
- Patient-adjacent clinical data — never logged, never in URLs.
- Auth tokens — short-lived JWTs in SecureStore (not AsyncStorage).
- API keys — environment variables only; never in source.

**Assumed trust boundaries:**
- EAS Build infrastructure is trusted.
- The monolith enforces all business rules server-side.
- The RN client is **not trusted** — all authorisation enforced at the API.

**Critical invariant:** Code Blue (emergency) mutations are **never** queued offline. The classifier runs synchronously before any storage write. This is a patient-safety invariant and may not be relaxed.

---

## Performance Characteristics

| Operation | Typical latency | Notes |
|-----------|----------------|-------|
| NFC tag read | ~200ms | Hardware dependent |
| Equipment API (online) | ~80ms | Monolith p50 |
| PendingSyncStore enqueue | ~5ms | Local SQLite write |
| Sync replay (single op) | ~150ms | Network + monolith p50 |

---

## Known Technical Debt

| Issue | Impact | Why accepted | Plan to address |
|-------|--------|-------------|----------------|
| Full `api.ts` not ported | Medium | Avoids premature surface until parity matrix exists | Port per-wave in H5 |
| Phase 3b cache tables missing | Low | Clinical slice works without cache | Phase 3b task in backlog |
| VetTrackControl plugin not on main | Low | H2 work on separate branch | Land before H3 NFC QA on device |

---

## What Is Deliberately Absent

- **No Dexie** — Web API; unavailable in RN runtime.
- **No SSE / BroadcastChannel / service workers** — frozen until H4 approval; match web transport shape only.
- **No Redux / global state manager** — React Context only; no need for a state library at current scale.
- **No ER/patient/hospitalization screens** — June 2026 scope cut. Adding them requires an explicit product decision to reverse.
- **No ward kiosk (`/equipment/board`)** — web-only view by design.
