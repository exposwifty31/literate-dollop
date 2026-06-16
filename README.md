# literate-dollop — VetTrack Expo (canonical mobile repo)

**This repo is the source of truth** for VetTrack mobile strategy, `@vettrack/contracts`, Expo CI, and Phases 1–6.

The production Capacitor app lives in **local** `~/vettrack` (GitLab maintenance only — not on GitHub). Use it read-only for port references.

## Stack

| Layer | Choice |
|-------|--------|
| Expo SDK | 56 (RN 0.85, New Architecture default) |
| Navigation | Expo Router + typed routes |
| Dev workflow | `expo-dev-client` + EAS Build |
| Package manager | **pnpm 9.15.9** |
| Monorepo | `packages/contracts` + `apps/expo` |
| Bundle IDs | `uk.vettrack.expo` — parallel to Capacitor `uk.vettrack.app` |

## Repo layout

```
packages/contracts/     @vettrack/contracts — shared types (emergency + pending-sync)
apps/expo/              Expo Router app
docs/plans/             Mobile strategy master plan
docs/adr/               Architecture decisions (ADR 001: expo-sqlite)
.agents/skills/expo/    Agent skills for EAS, plugins, Clerk RN
scripts/ci/             contracts-gate.sh
```

## Prerequisites

- Node.js 22+ (see `.nvmrc`)
- [EAS CLI](https://docs.expo.dev/build/setup/): `pnpm add -g eas-cli`
- Expo account: `eas login` then `eas init`

## Commands

```bash
pnpm install --frozen-lockfile
pnpm contracts:gate
pnpm --filter vettrack-expo start
pnpm --filter vettrack-expo exec tsc --noEmit
```

## Local development

```bash
cp apps/expo/.env.example apps/expo/.env
pnpm --filter vettrack-expo start
```

Use a **development build** (not Expo Go) for NFC, push, or custom native code:

```bash
cd apps/expo && eas build --profile development --platform ios
```

## EAS profiles

| Profile | Purpose |
|---------|---------|
| `development` | Dev client, internal distribution |
| `preview` | Internal QA APK/IPA |
| `production` | Store-bound binaries |

## Deep links

- Custom scheme: `vettrack://`
- Universal links: `https://vettrack.uk/app/*`

## Migration phases

See [docs/plans/mobile-strategy-master.md](docs/plans/mobile-strategy-master.md).

| Phase | Status |
|-------|--------|
| PR1 | Monorepo bootstrap + contracts + CI |
| 1 | PendingSyncStore, emergency seam, Clerk Expo |
| 2 | VetTrackControl config plugin |
| 3 | NFC clinical vertical slice |
| 6 | Capacitor kill-switch decision |

## Agent context

See [AGENTS.md](AGENTS.md) for agent quickstart, port references, and frozen doctrine.

## Consuming contracts from local vettrack (optional)

```json
"@vettrack/contracts": "github:exposwifty31/literate-dollop#path:packages/contracts&branch=main"
```
