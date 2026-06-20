---
name: vettrack-expo-migration
description: >
  Phase-gated Expo/React Native migration discipline for the literate-dollop repo.
  Governs phase exit criteria, what can be ported vs rebuilt native, @vettrack/contracts
  bump discipline, cross-repo companion PRs, and frozen doctrine. Use when working in
  the literate-dollop repo, porting code from vettrack, modifying packages/contracts,
  making an EAS build, deciding whether a Phase 3+ task is in-scope, or checking
  whether a planned change violates the frozen doctrine. This skill must be consulted
  before any code is written in literate-dollop — it defines what work is allowed at
  each phase.
---

# VetTrack Expo Migration — Phase Discipline

Canonical repo: `exposwifty31/literate-dollop` on GitHub.
Bundle ID: `uk.vettrack.expo` — NOT `uk.vettrack.app` until Phase 6 go/no-go.

---

## Phase gates — do not cross these out of order

| Phase | What is unlocked | Exit criteria before next phase |
|-------|-----------------|----------------------------------|
| **PR1** | Monorepo bootstrap, `@vettrack/contracts` in-repo, CI green | `pnpm contracts:gate` + typecheck green on GitHub Actions |
| **1** | Offline seam, Clerk Expo | (1) contracts v0.1.0+ imported by apps/expo; (2) PendingSyncStore + integration test passing; (3) Clerk Expo sign-in + authenticated API call on device; (4) `src/lib/offline-emergency-block.ts` ported and verified before any SQLite write |
| **2** | VetTrackControl config plugin | Dev build with widget target running on device |
| **3** | NFC equipment scan vertical slice | One end-to-end offline-capable NFC workflow |
| **4–5** | Route parity expansion | Per-route checklist |
| **6** | Capacitor kill-switch decision | Go/no-go on retiring `uk.vettrack.app` |

**Do not start Expo Router screen ports beyond bootstrap until Phase 1 exit criteria are all green.**

---

## Frozen doctrine (never violate)

- **Code Blue mutations never queue offline.** Emergency classifier runs at `api.request()` before any SQLite write. Do not add Code Blue / emergency types to `PendingSyncType`.
- **No SSE, BroadcastChannel, or service worker in Expo** until post-Phase 6 (unless explicitly approved).
- **No hand-editing `ios/` or `android/`** under `apps/expo` after prebuild. Changes go in config plugins only (Phase 2+). Re-run `npx expo prebuild --clean` after plugin changes.
- **Offline storage: `expo-sqlite` PendingSyncStore** (ADR 001). Not Dexie, not WatermelonDB, not AsyncStorage for mutations.
- **Emergency classifier must run before any SQLite write** — the port of `src/lib/offline-emergency-block.ts` is Phase 1 mandatory.

---

## @vettrack/contracts — bump discipline

`packages/contracts/src/` is the source of truth for emergency type manifests and
`PendingSyncType`. Both vettrack (monolith) and literate-dollop (Expo) must stay byte-identical.

**Every PR that touches `packages/contracts/`:**

```bash
# 1. Run the contracts gate in literate-dollop
pnpm contracts:gate
# scripts/ci/contracts-gate.sh — fails if types drift

# 2. Open a companion issue/PR in vettrack to bump the github: dep
# vettrack package.json reference:
# "@vettrack/contracts": "github:exposwifty31/literate-dollop#path:packages/contracts&branch=main"
```

Never merge a contracts change in literate-dollop without a companion PR in vettrack.

---

## Port reference map (what to port, what not to port)

### Phase 1 — port these from vettrack

| vettrack source | literate-dollop destination |
|-----------------|-----------------------------|
| `src/lib/offline-emergency-block.ts` | `apps/expo/src/lib/offline-emergency-block.ts` |
| `src/lib/offline-policy.ts` | `apps/expo/src/lib/offline-policy.ts` |
| `src/lib/api.ts` (classifier hook only) | `apps/expo/src/lib/api.ts` |

### Phase 2

| vettrack source | literate-dollop destination |
|-----------------|-----------------------------|
| `ios/App/VetTrackControl/*.swift` | `plugins/vettrack-control/ios/` |

### Phase 3

| vettrack source | literate-dollop destination |
|-----------------|-----------------------------|
| `src/lib/nfc-platform.ts` | `apps/expo/src/lib/nfc-platform.ts` |

### Never move

- `server/`, `migrations/`, vettrack `src/pages/` — stays in the monolith
- Full Capacitor CI, `tests/offline-phase-7-emergency-surface-parity.test.ts`
- UI web components (rebuild native, don't port React DOM components)
- `@tanstack/react-query`, `sonner`, `@clerk/clerk-react`, `dexie` — wrong platform

---

## Deferred modules (do not port until explicitly scoped)

These are entangled with DOM APIs or unavailable deps:
- `src/lib/api.ts` full port (DOM fetch + react-query)
- `src/lib/sync-engine.ts` (Dexie-coupled)
- `use-auth`, `use-sync`, `use-push-notifications`, `use-settings`
- `useShiftChat`, `shift-chat/api`, `useAutoSelectOrg`

---

## i18n invariant (same as vettrack)

- No hardcoded copy in source — text lives only in `apps/expo/locales/*.json`
- Hebrew is default; `apps/expo/src/lib/i18n.ts` is the typed accessor (uses AsyncStorage + I18nManager, not DOM)
- Parity enforced between `en.json` and `he.json`

---

## Key commands

```bash
# Install
pnpm install --frozen-lockfile

# Contracts gate (run before any contracts PR)
pnpm contracts:gate

# Typecheck — Expo app
pnpm --filter vettrack-expo exec tsc --noEmit

# Typecheck — contracts package
pnpm --filter @vettrack/contracts typecheck

# Start Metro dev server
pnpm --filter vettrack-expo start

# EAS dev build (required for NFC, push, custom native)
cd apps/expo && eas build --profile development --platform ios
```

---

## Ship lane

- Dev tree: `literate-dollop` repo (this repo)
- Ship tree: `../literate-dollop-ship` git worktree on `main` — clean builds only
- Pre-ship verify: `bash scripts/eas-build-from-clean-tree.sh --verify-only` from ship worktree
- See `docs/mobile/expo-ship-worktree-lane-prompt.md`

---

## Cross-repo authority

When a decision touches the monolith API surface, read:
`docs/governance/expo-agent-brief-2026-06-19.md` — authoritative cross-repo narrative.
