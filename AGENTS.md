# AGENTS.md — literate-dollop

## Canonical repo
Mobile strategy + `@vettrack/contracts` + Expo app.  
**GitHub:** `exposwifty31/literate-dollop` (only remote for agent work).

## Production app (monolith — on GitHub)
`~/vettrack` — Capacitor Build 15 + full web/server.  
**GitHub:** [`exposwifty31/vettrack`](https://github.com/exposwifty31/vettrack) — GitLab is declared canonical but GitHub `origin` is ahead in practice; treat GitHub as primary for pull and port references until P0-1 (remote reconciliation) resolves.  
Read-only for port references. Do not add Expo code there.

## Consuming contracts elsewhere (human maintenance)
If local vettrack needs shared types after PR1 merges here:

```json
"@vettrack/contracts": "github:exposwifty31/literate-dollop#path:packages/contracts&branch=main"
```

That change is **out of scope** for this agent unless explicitly requested.

## Commands
```bash
pnpm install --frozen-lockfile
pnpm contracts:gate
pnpm --filter vettrack-expo exec tsc --noEmit
pnpm --filter @vettrack/contracts typecheck
pnpm --filter vettrack-expo start
```

## Phase gates
See docs/plans/mobile-strategy-master.md. No screen porting until Phase 1 exit (contracts + PendingSyncStore test + Clerk Expo).

## Port references (vettrack paths)
- offline-emergency-block: src/lib/offline-emergency-block.ts
- offline-policy: src/lib/offline-policy.ts
- sync-engine: src/lib/sync-engine.ts (logic only)
- nfc-platform: src/lib/nfc-platform.ts (Phase 3)
- VetTrackControl Swift: ios/App/VetTrackControl/*.swift (Phase 2 plugin)

## Imported logic layer (milestone 1)
Logic/types ported from `vettrack` (web UI deliberately **not** ported — rebuilt native).
Full status + what's deferred and why: [`docs/porting-status.md`](docs/porting-status.md).

```
apps/expo/
  locales/{en,he}.json              # i18n dictionaries (Hebrew default), parity-matched
  src/lib/i18n.ts                   # typed `t` accessor (RN: AsyncStorage + I18nManager)
  src/lib/i18n-core/                # interpolate / internal-keys / types (platform-agnostic)
  src/types/                        # domain types (+ src/types/shared/ pure-type deps)
  src/features/inventory/restock-session-reducer.ts
  src/features/shift-chat/types.ts
plugins/vettrack-control/           # Phase 2 native module home (scaffold only)
```

Path aliases: `@/lib/*`, `@/types`, `@/types/*`, `@/features/*`, `@/hooks/*`.

**Deferred to the follow-up that ports the two heavy modules** (`src/lib/api.ts`,
`src/lib/sync-engine.ts`): `use-auth`, `use-sync`, `use-push-notifications`,
`use-settings`, `useShiftChat`, `shift-chat/api`, `useAutoSelectOrg`. Each is
entangled with the deferred modules and/or needs a DOM→RN rewrite or a lib not in
the Expo dep set (`@tanstack/react-query`, `sonner`, `@clerk/clerk-react`, `dexie`).
See the porting-status doc.

## i18n invariant (preserved on import)
No hardcoded copy in source — text lives only in `locales/*.json`, accessed via `t`.
The web `shift-chat/types.ts` inlined Hebrew broadcast labels; that copy was dropped
on import (kept the `BroadcastKey` type contract).

## Frozen doctrine
Code Blue mutations never queue offline. Emergency classifier runs before SQLite write.
ADR 001: expo-sqlite PendingSyncStore, not Dexie/WatermelonDB.

## Ship lane (EAS / store builds)
Dev tree: this repo. Ship tree: `../literate-dollop-ship` (git worktree on `main`, clean only).
See [`docs/mobile/expo-ship-worktree-lane-prompt.md`](docs/mobile/expo-ship-worktree-lane-prompt.md).
Pre-ship verify: `bash scripts/eas-build-from-clean-tree.sh --verify-only` (from ship worktree).

## Cross-repo context

- **Brief + governance runbook:** [`docs/governance/expo-agent-brief-2026-06-19.md`](docs/governance/expo-agent-brief-2026-06-19.md) — authoritative cross-repo narrative; read this before making decisions that touch the monolith API surface.
- **Parity audit:** `LITERATE_DOLLOP_PARITY_REPORT.md` lives in the vettrack monolith repo (`exposwifty31/vettrack`).
- **Contracts bump discipline:** see [`docs/contracts-bump-runbook.md`](docs/contracts-bump-runbook.md). On **every PR touching `packages/contracts`**: run `pnpm contracts:gate` AND open a companion issue/PR in vettrack to bump the `github:` dep so both sides stay byte-identical.

## Working doctrine (finish-driven agents)
Every dev agent on this repo works by three principles:
1. **Whole-codebase awareness across time** — know the *past* (git history, ADRs, prior
   PRs, why decisions were made), the *present* (current branch + what is in flight), and
   the *future* (roadmap in `docs/plans/*`, phase gates, deferred items). Orient before
   acting.
2. **Always work in context** — load and hold the relevant files/conventions before
   editing; never operate blind on an isolated slice.
3. **Driven to finish, not to write code** — optimize for *done*: gates green, tests
   pass, types clean, PR landed, verified end-to-end. Code is the means, completion is
   the goal; never report partial work as complete.

Reusable persona: [`.agents/agents/finisher.md`](.agents/agents/finisher.md) (canonical,
version-controlled). To spawn it as a Claude Code subagent, copy it to the gitignored
`.claude/agents/finisher.md`.

## Skills
`.agents/skills/expo/` — use for EAS, config plugins, Clerk RN patterns.
