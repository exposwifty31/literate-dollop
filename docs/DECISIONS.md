# DECISIONS.md — Architecture Decision Records

> An ADR records a significant technical decision: what was decided, why, and what the consequences are.
> Agents: check this before proposing alternatives — the decision may already be made and closed.
> Add a new ADR whenever you make a non-obvious architectural choice during implementation.
>
> Detailed ADRs (with full context) live in `docs/adr/`. This file is the index and home for new decisions.

---

## Status Legend

| Status | Meaning |
|--------|---------|
| `proposed` | Under discussion — not yet adopted |
| `accepted` | Adopted — follow this in new code |
| `rejected` | Evaluated and declined — do not revisit without new information |
| `superseded` | Was accepted, replaced by a later ADR |
| `deprecated` | Being phased out — do not use in new code |

---

## Decision Index

| ADR | Title | Status | Date | Full doc |
|-----|-------|--------|------|----------|
| ADR-001 | Offline storage: expo-sqlite PendingSyncStore (not Dexie) | `accepted` | 2026-06-16 | `docs/adr/001-offline-storage.md` |
| ADR-002 | Named exports only (no default exports except Expo Router screens) | `accepted` | 2026-06-20 | Below |
| ADR-003 | Thin API slice per feature (no monolithic api.ts port) | `accepted` | 2026-06-20 | Below |
| ADR-004 | NFC behind platform adapter — no direct expo-nfc import in feature code | `accepted` | 2026-06-20 | Below |

---

## ADR-001: Offline storage — expo-sqlite PendingSyncStore

**Date:** 2026-06-16
**Status:** `accepted`
**Deciders:** Dan (solo founder)

Full text: [`docs/adr/001-offline-storage.md`](adr/001-offline-storage.md)

**Summary:** Dexie uses IndexedDB (Web API — unavailable in RN). expo-sqlite is the replacement. A thin `PendingSyncStore` adapter interface wraps expo-sqlite, keeping sync-engine logic portable.

---

## ADR-002: Named exports only

**Date:** 2026-06-20
**Status:** `accepted`
**Deciders:** Dan

#### Context
Default exports make refactoring harder (import names diverge across files) and are incompatible with consistent barrel-free imports.

#### Decision
All modules use named exports only. Exception: Expo Router screen files (`app/**/*.tsx`) require a default export for the framework's file-based routing — this exception is explicit and limited to screen files.

#### Consequences
**Positive:**
- Import name matches export name everywhere — easier to search and refactor.
- Tree-shaking is more predictable.

**Negative:**
- Expo Router screen files must carry a `export default` for the framework despite the convention — comment in each screen file explains the exception.

#### Alternatives Considered
| Alternative | Why rejected |
|-------------|-------------|
| Default exports everywhere | Import names diverge; harder to grep |
| Mixed (defaults for components, named for services) | Inconsistent; agents forget the boundary |

---

## ADR-003: Thin API slice per feature (no monolithic api.ts port)

**Date:** 2026-06-20
**Status:** `accepted`
**Deciders:** Dan

#### Context
The vettrack monolith `api.ts` is ~1042 LOC. Porting it all now would introduce surface area for endpoints that RN does not use yet. The RN parity matrix (`docs/mobile/rn-parity-matrix.md`) does not yet exist — porting without it means guessing.

#### Decision
Each feature owns its own API slice (e.g. `src/features/equipment/api.ts`). Only endpoints needed for the current feature are implemented. Full parity waves happen in H5 after the parity matrix is authored.

#### Consequences
**Positive:**
- No dead code — every implemented endpoint is in active use.
- API surface per feature is testable in isolation.

**Negative:**
- Some code duplication (fetch boilerplate) across feature slices — acceptable until H5.

#### Alternatives Considered
| Alternative | Why rejected |
|-------------|-------------|
| Port full api.ts now | Premature; creates untested surface area; blocked on parity matrix |
| Shared api.ts with lazy loading | Over-engineering for current scale |

---

## ADR-004: NFC behind platform adapter

**Date:** 2026-06-20
**Status:** `accepted`
**Deciders:** Dan

#### Context
`expo-nfc` is a native module. Importing it directly in feature or screen code makes those files impossible to unit test without native hardware and makes future platform changes (e.g. swapping NFC library) a cross-cutting refactor.

#### Decision
All `expo-nfc` usage is contained in `src/lib/nfc-platform.ts`. Feature code imports only the adapter interface (`startScan`, `stopScan`). The adapter is mockable in tests.

#### Consequences
**Positive:**
- Feature code and screen code are fully testable without native hardware.
- NFC library can be swapped by changing one file.

**Negative:**
- One extra layer of indirection — accepted because the adapter is trivial.

#### Alternatives Considered
| Alternative | Why rejected |
|-------------|-------------|
| Import expo-nfc directly in screen | Untestable without device; change ripples across features |
| No NFC abstraction | Same problem; harder to mock |

---

## ADR Template

```markdown
### ADR-NNN: [Title]

**Date:** YYYY-MM-DD
**Status:** proposed | accepted | rejected | superseded by ADR-NNN | deprecated
**Deciders:** [Who was involved]

#### Context
[What situation requires a decision?]

#### Decision
[State the decision directly: "We will use X."]

#### Rationale
[Why this option over the alternatives?]

#### Consequences
**Positive:**
- [What becomes easier]

**Negative / trade-offs:**
- [What becomes harder]

#### Alternatives Considered
| Alternative | Why rejected |
|-------------|-------------|
| [Option A] | [Reason] |
```

<!-- Add new ADRs above. Number sequentially. Never delete superseded records — mark them. -->
