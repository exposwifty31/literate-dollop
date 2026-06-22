# CLAUDE.md

> Read by Claude Code CLI automatically at session start.
> This is the primary context file. Keep it accurate — stale context causes worse output than no context.
> Last updated: 2026-06-20

---

## Project

**Name:** literate-dollop (VetTrack Expo)
**Purpose:** Expo/React Native rebuild of VetTrack's veterinary workflow app — offline-first NFC scanning, emergency Code Blue enforcement, and sync against the VetTrack monolith API.
**Repo:** `exposwifty31/literate-dollop` (GitHub — only remote for agent work)
**Production URL:** Not yet live (`uk.vettrack.expo`); Capacitor build `uk.vettrack.app` is current store version.
**CI/CD:** GitHub Actions — `pnpm contracts:gate` + typecheck + vitest on push to main.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript ~6.0 (`strict: true`) |
| Runtime | React Native via Expo SDK (managed workflow) |
| Framework | Expo Router (file-based navigation) |
| Database | `expo-sqlite` — `PendingSyncStore` adapter (ADR 001) |
| Testing | Vitest 3 |
| Package manager | pnpm 9.15.9 (workspace) |
| Auth | `@clerk/clerk-expo` + SecureStore |
| Hosting | EAS Build → App Store / Google Play |
| Config plugins | `plugins/vettrack-control/` (Phase 2 Swift/Kotlin) |

---

## Repository Layout

```
apps/expo/
  locales/{en,he}.json      # i18n strings (Hebrew default)
  src/
    features/               # vertical slices (inventory, shift-chat, …)
    hooks/                  # RN hooks
    lib/                    # platform services (i18n, offline, nfc, …)
    providers/              # React context providers
    types/                  # domain types (src/types/shared/ = pure-type deps)
packages/
  contracts/                # @vettrack/contracts — shared types authored here
plugins/
  vettrack-control/         # Phase 2 native config plugin (scaffold only)
scripts/
  ci/contracts-gate.sh      # byte-parity check vs vettrack node_modules
tests/                      # Vitest test files (co-located tests preferred)
docs/
  adr/                      # Architecture Decision Records
  governance/               # Cross-repo agent runbooks
  mobile/                   # RN-specific docs
  plans/                    # Master and feature plans
  superpowers/              # Feature specs
```

Path aliases: `@/lib/*`, `@/types`, `@/types/*`, `@/features/*`, `@/hooks/*`.

---

## Architecture in Plain Language

VetTrack is an offline-first veterinary workflow app. The Expo/RN rebuild (`literate-dollop`) targets native iOS and Android, replacing the Capacitor PWA shell while the monolith API (`exposwifty31/vettrack`) stays unchanged. The Expo app communicates with the monolith over HTTPS, authenticated via Clerk JWTs. When offline, mutations queue in `PendingSyncStore` (expo-sqlite) and replay on reconnection — except Code Blue (emergency) mutations, which are hard-blocked before reaching the queue (see frozen doctrine below). Shared type contracts live in `packages/contracts` and are consumed by the monolith via a `github:` path dep.

---

## Stack Constraints

Fixed. Do not introduce alternatives without a Decision Record in `docs/DECISIONS.md` or `docs/adr/`.

- **No Dexie** — IndexedDB is a Web API; unavailable in RN runtime.
- **No WatermelonDB** — rejected (see ADR 001); expo-sqlite only.
- **No SSE / BroadcastChannel / service workers** — frozen until explicit H4 approval.
- **No WebSockets** — SSE only when ported; match web transport.
- **No default exports** — named exports only (except framework page components).
- **No hardcoded copy** — text lives in `locales/*.json` only; use `t()`.
- **No `any` casts without inline explanation.**
- **No new npm packages without noting them in your response.**
- **`clinicId` tenancy enforced server-side** — never trust JWT role alone; client sends auth headers.

---

## Frozen Doctrine (safety invariants — never change without explicit sign-off)

| Invariant | Implementation |
|-----------|---------------|
| Code Blue never queued offline | `classifyEmergencyEndpoint()` runs before any `expo-sqlite` write |
| Emergency block source of truth | `EMERGENCY_OFFLINE_BLOCK_MUTATIONS` + `classifyEmergencyEndpoint` from `@vettrack/contracts` |
| Offline storage | `PendingSyncStore` (expo-sqlite) — never Dexie |
| Transport | HTTPS REST; no SSE before H6 |
| Tenancy | `clinicId` enforced server-side |
| Scope cut (June 2026) | No ER/patient/hospitalization RN screens; ward kiosk (`/equipment/board`) is web-only |
| Hebrew copy | `locales/*.json` only; never in source identifiers or string literals |

---

## Current Work

> See `PLAN.md` for full details. Horizon status reconciled 2026-06-22 against
> `docs/porting-status.md` + `docs/mobile/rn-parity-matrix.md` (source of truth).

**Feature / Sprint:** Reach Horizon 7 — orchestrated climb to Capacitor retirement
**Status:** in progress
**Branch:** `claude/reach-horizon-7-0vqq5o` (per-horizon child branches → PR → `main`)

**Horizons complete:** H1 (workspace/contracts/Clerk/PendingSyncStore), H2
(VetTrackControl plugin — landed, 4/4 tests), H3 (NFC equipment scan slice — 75
tests), H5 (RN parity waves 1–4: equipment, actions, shift, rooms, alerts).

**Remaining climb:** H4 (SSE realtime + native push) → H6 (cutover/coexistence
banner) → H7 (Capacitor kill-switch retirement). Each is gated — see PLAN.md
sign-off gates.

**Out of scope right now (until their sign-off gate clears):**
- SSE / push notification port (H4 — needs written SSE approval + monolith push endpoint)
- Full `api.ts` port (~1042 LOC) — scan-only API until parity matrix defines waves
- ER/patient/hospitalization screens (June 2026 scope cut)
- Capacitor cutover / retirement (H6–H7 — needs product go/no-go + kill-switch doc)

---

## Known Issues and Traps

| Area | Issue | What to do |
|------|-------|-----------|
| Contracts parity | Silent drift risk when vettrack adds an emergency API path without updating contracts | Run `pnpm contracts:gate` on every PR touching `packages/contracts`; open companion PR in vettrack |
| Remote truth | vettrack docs say GitLab canonical; GitHub (`exposwifty31/vettrack`) is ahead in practice | Treat GitHub as primary until P0-1 resolves |
| i18n | Hebrew is the default locale; `I18nManager.isRTL` must be respected | Always use `t()` — never inline copy |
| Path collision | Capacitor (`uk.vettrack.app`) and Expo (`uk.vettrack.expo`) may share `vettrack://` deep-link scheme | Uninstall Capacitor build on QA devices before NFC testing |
| Startup sequence | `PendingSyncStore.runStartupCleanup()` must be called before any queue consumer | Enforce via app init guard |
| VetTrackControl plugin | Landed on `main` (Phase 2 / H2 complete — `vettrack-control-plugin.test.ts` 4/4) | Config plugin at `plugins/vettrack-control/`; dev build required for NFC hardware QA |

---

## Environment Variables

```
CLERK_PUBLISHABLE_KEY      # Clerk Expo public key
EXPO_PUBLIC_API_URL        # VetTrack monolith API base URL
```

Access env vars via `expo-constants` or typed config wrapper — never `process.env` directly in business logic.

---

## Verification Commands

```bash
pnpm install --frozen-lockfile   # Install deps
pnpm contracts:gate              # Byte-parity check vs vettrack contracts
pnpm --filter vettrack-expo exec tsc --noEmit   # Type check expo app
pnpm --filter @vettrack/contracts typecheck     # Type check contracts
pnpm test                        # Run Vitest suite (59 tests)
pnpm --filter vettrack-expo start               # Start Expo dev server
```

---

## Established Patterns

### Result type for expected failures
```typescript
// Expected failures return a typed Result; invariants throw
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };
```

### i18n access
```typescript
import { t } from '@/lib/i18n';
// Always use t() — never inline copy
const label = t('equipment.scan.prompt');
```

### Named exports only
```typescript
// ✅
export function getUserById(id: string): Promise<User> { … }
// ❌
export default function getUserById(id: string): Promise<User> { … }
```

### Code Blue enforcement (call order is sacred)
```typescript
// api.request() call chain — do not reorder
classifyEmergencyEndpoint(endpoint)   // throws if emergency + offline
assertPendingSyncEnqueueAllowed()     // throws if conditions not met
addPendingSync(op)                    // expo-sqlite write
```

---

## What Agents Must Never Do

1. Queue Code Blue (emergency) mutations offline — this is a patient safety invariant.
2. Add Dexie, WatermelonDB, or any IndexedDB-based storage.
3. Add SSE, WebSocket, or BroadcastChannel patterns before explicit H4 approval.
4. Change `packages/contracts` without noting that vettrack must bump its `github:` dep.
5. Push to `main` or create a PR without verifying `pnpm contracts:gate` passes.
6. Hardcode copy — all text goes in `locales/*.json`.
7. Add ER/patient/hospitalization screens (June 2026 scope cut).
8. Assume vettrack `origin` is GitLab (it is GitHub; use `exposwifty31/vettrack`).

---

## Cross-Repo Context

- **Governance runbook:** `docs/governance/expo-agent-brief-2026-06-19.md` — read before decisions that touch the monolith API surface.
- **Parity audit:** `LITERATE_DOLLOP_PARITY_REPORT.md` in `exposwifty31/vettrack`.
- **Contracts bump discipline:** `docs/contracts-bump-runbook.md`.

---

## Definition of Done

A task is done when:
- [ ] All tests pass (`pnpm test`)
- [ ] Type check passes (`tsc --noEmit`) with no new errors
- [ ] `pnpm contracts:gate` passes if contracts were touched
- [ ] New behaviour has tests (including at least one failure path)
- [ ] No TODO comments in delivered code
- [ ] `TASKS.md` updated
- [ ] `PLAN.md` updated if the approach deviated

See `DEFINITION_OF_DONE.md` for the full checklist.
