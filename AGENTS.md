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

## Frozen doctrine
Code Blue mutations never queue offline. Emergency classifier runs before SQLite write.
ADR 001: expo-sqlite PendingSyncStore, not Dexie/WatermelonDB.

## Skills
`.agents/skills/expo/` — use for EAS, config plugins, Clerk RN patterns.
