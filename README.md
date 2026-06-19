# literate-dollop — VetTrack Expo (canonical mobile repo)

**This repo is the source of truth** for VetTrack mobile strategy, `@vettrack/contracts`, Expo CI, and Phases 1–6.

The production Capacitor app lives in **local** `~/vettrack` ([`exposwifty31/vettrack`](https://github.com/exposwifty31/vettrack) on GitHub; GitLab is declared canonical but GitHub `origin` is ahead in practice — treat GitHub as primary until P0-1 resolves). Use it read-only for port references.

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
  locales/              i18n dictionaries (en/he; Hebrew default)
  src/lib/              api, offline seam, i18n (+ i18n-core/)
  src/types/            domain types ported from vettrack (+ shared/ pure-type deps)
  src/features/         feature logic (UI rebuilt native, not ported)
plugins/vettrack-control/  Phase 2 native module home (scaffold)
docs/plans/             Mobile strategy master plan
docs/adr/               Architecture decisions (ADR 001: expo-sqlite)
docs/porting-status.md  What's imported from vettrack vs deferred (milestone 1)
.agents/skills/expo/    Agent skills for EAS, plugins, Clerk RN
scripts/ci/             contracts-gate.sh
```

## Prerequisites

- Node.js 22+ (see `.nvmrc`)
- [EAS CLI](https://docs.expo.dev/build/setup/): `pnpm dlx eas-cli` (no repo install required)
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

### Phase 3 NFC testing

- Dev build required — `react-native-nfc-manager` does not run in Expo Go.
- Start Metro for the dev client: `pnpm --filter vettrack-expo start -- --dev-client --lan`
- Connect the device via `exp://<LAN-IP>:8081` (or scan the QR from the dev client).
- Uninstall the Capacitor VetTrack app on the test device if both are installed (`vettrack://` scheme collision).
- Rebuild after adding the NFC config plugin: `eas build --profile development --platform ios` (and Android when testing both).
- Manual acceptance: airplane-mode scan → queued → reconnect → auto sync → synced state on `/scan`.

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
| 3 | NFC equipment scan vertical slice (in progress) |
| 6 | Capacitor kill-switch decision |

## Agent context

See [AGENTS.md](AGENTS.md) for agent quickstart, port references, and frozen doctrine.  
Cross-repo runbook: [docs/governance/expo-agent-brief-2026-06-19.md](docs/governance/expo-agent-brief-2026-06-19.md).

## Consuming contracts from local vettrack (optional)

```json
"@vettrack/contracts": "github:exposwifty31/literate-dollop#path:packages/contracts&branch=main"
```
