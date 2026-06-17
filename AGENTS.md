# AGENTS.md — literate-dollop

## Canonical repo
Mobile strategy + `@vettrack/contracts` + Expo app.  
**GitHub:** `exposwifty31/literate-dollop` (only remote for agent work).

## Production app (local maintenance — not on GitHub)
`~/vettrack` — Capacitor Build 15 + full web/server (GitLab `origin` if present).  
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

## Skills
`.agents/skills/expo/` — use for EAS, config plugins, Clerk RN patterns.
