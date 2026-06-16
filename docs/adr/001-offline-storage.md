# ADR 001: Offline Storage for Expo Migration

**Status:** Accepted  
**Date:** 2026-06-16  
**Deciders:** Dan (solo founder)

---

## Context

VetTrack's offline-first architecture depends on a pending sync queue with a strict state machine:

```
pending → processing → synced / failed / dead / conflict
```

The current implementation uses **Dexie 3.2.7** (IndexedDB wrapper) in the Capacitor/PWA shell. Dexie is pinned and frozen — do not upgrade.

The Expo/React Native target (`literate-dollop`) cannot use Dexie because **IndexedDB is a Web API** and does not exist in the React Native runtime.

A replacement must:
1. Preserve the FIFO queue state machine semantics from `offline-db.ts`
2. Support relational queries (queue ordering, conflict payloads, dead-letter retention)
3. Allow `sync-engine.ts` retry/circuit-breaker/burst logic to port unchanged
4. Enforce the Code Blue block at `api.request()` — **before** any storage write

---

## Options Considered

| Option | Verdict | Reason |
|--------|---------|--------|
| Port Dexie | ❌ Impossible | Dexie requires IndexedDB (Web API — unavailable in RN runtime) |
| WatermelonDB | ❌ Rejected | Opinionated reactive ORM; VetTrack queue is a state machine, not a CRUD collection. Observable models add overhead without benefit |
| MMKV alone | ❌ Insufficient | No relational queries for queue ordering, conflict payloads, or dead-letter retention |
| `expo-sqlite` | ✅ Accepted | Matches Dexie table semantics; storage-agnostic seam already exists in `sync-engine.ts` |

---

## Decision

**Use `expo-sqlite` with a thin `PendingSyncStore` adapter interface.**

`sync-engine.ts` already calls storage only through named exports from `offline-db.ts` — it does not import Dexie directly. This means the migration is: **swap the implementation behind the same interface**, not refactor the engine.

---

## Adapter Interface (`PendingSyncStore`)

```typescript
// src/lib/adapters/pending-sync-store.ts (literate-dollop)

export interface PendingSyncStore {
  // Queue operations
  getPendingSync(id: string): Promise<PendingSync | undefined>;
  addPendingSync(op: PendingSyncEnqueueOp): Promise<void>; // calls assertPendingSyncEnqueueAllowed first
  updatePendingSync(id: string, patch: Partial<PendingSync>): Promise<void>;
  removePendingSync(id: string): Promise<void>;

  // Startup recovery
  runStartupCleanup(): Promise<void>;
  recoverProcessingPendingSync(): Promise<void>; // pending → processing on crash recovery

  // Cache tables (secondary — Phase 3b, not Phase 3a)
  // equipment: read-through cache, same semantics as Dexie v4 stores
  // rooms: read-through cache
}
```

**Ship order:**
- Phase 3a: queue + state machine (unblocks clinical vertical slice)
- Phase 3b: equipment/rooms cache tables

---

## Code Blue Constraint (frozen — never changes)

Emergency mutations **never** enter the queue. The block lives at `api.request()` — before any `expo-sqlite` write.

```
api.request()
  └─ classifyEmergencyEndpoint()        ← offline-emergency-block.ts
       └─ if emergency → throw OfflineEmergencyMutationBlockedError
       └─ if not emergency → assertPendingSyncEnqueueAllowed()
            └─ addPendingSync() → expo-sqlite write
```

Port these three modules verbatim from vettrack:
- `src/lib/offline-emergency-block.ts` — classifier (no Dexie dependency)
- `src/lib/offline-policy.ts` — `assertPendingSyncEnqueueAllowed` choke-point (no Dexie dependency)
- `shared/emergency-surfaces.manifest.ts` — move into `@vettrack/contracts`

Regression contract: equivalent of `tests/code-blue-offline-queue-removed.test.ts` must be green before Phase 3 merges.

---

## Consequences

**Positive:**
- `sync-engine.ts` ports with minimal changes (storage calls already abstracted)
- SQLite gives full relational queries for queue ordering and conflict payloads
- No reactive ORM overhead — state machine stays explicit

**Negative / Risks:**
- `expo-sqlite` API differs from Dexie's promise-based table API — adapter layer must be written carefully
- Startup cleanup (`recoverProcessingPendingSync`) must be called before any queue consumer starts — enforce with app init sequence guard
- Equipment/rooms cache deferred to Phase 3b — clinical vertical slice (Phase 3a) works without cache

---

## Gate

This ADR must be merged and the adapter must pass one **enqueue/replay integration test** before any Expo screen work begins (Phase 3).

Test shape:
```
addPendingSync(op) → status: 'pending'
recoverProcessingPendingSync() → status: 'pending' (was stuck as 'processing')
updatePendingSync(id, { status: 'synced' }) → removed from active queue
```
