# AGENTS.md — literate-dollop

> Mirrors CLAUDE.md — keep both files in sync when you update either.
> Read by OpenAI Codex, GitHub Copilot Workspace, Aider, Cline, Roo Code, and similar tools.

## Start Here — read these files before writing any code

1. `CLAUDE.md` — project context, stack, frozen doctrine, known traps
2. `PLAN.md` — what is currently in scope (Phase 3 NFC scan)
3. `TASKS.md` — your specific task and acceptance criteria
4. `DEFINITION_OF_DONE.md` — what "done" means for every task
5. Every file you plan to modify

Supporting docs: `docs/ARCHITECTURE.md`, `docs/CONVENTIONS.md`, `docs/DECISIONS.md`.

If any of these are missing or incomplete, say so before proceeding.

---

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

## Skills
`.agents/skills/expo/` — use for EAS, config plugins, Clerk RN patterns.

## Agent Prompts
Ready-to-use prompts in `prompts/`:
- `prompts/plan.md` — use before planning a new feature; output goes into `PLAN.md`
- `prompts/execute.md` — use when assigning a task from `TASKS.md` to an agent
- `prompts/review.md` — use after an agent completes a task, before merging

## Cursor Rules
Project rules in `.cursor/rules/` apply to every Cursor edit session:
- `00-core-behavior.mdc` — session start protocol, prime directive, hard stops
- `01-anti-patterns.mdc` — AI code tells to avoid (comment theater, TODO abandonment, swallowed errors, etc.)
- `02-workflow.mdc` — required phases: orient → clarify → plan → implement → verify → document
- `03-testing.mdc` — what counts as a test, coverage requirements, AAA structure
