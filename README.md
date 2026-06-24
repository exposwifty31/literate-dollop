# literate-dollop — VetTrack Expo (canonical mobile repo)

**This repo is the source of truth** for VetTrack mobile strategy, `@vettrack/contracts`, Expo CI, and Phases 1–6.

Use the clone at `~/literate-dollop` as the canonical local working copy. If another
copy exists at `~/Documents/literate-dollop`, treat it as disposable/stale unless
you intentionally need to recover uncommitted work from it.

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
pnpm install
pnpm contracts:gate
pnpm --filter vettrack-expo start
pnpm --filter vettrack-expo exec tsc --noEmit
```

## Git sync rule

Keep GitHub and the canonical local clone in lockstep after every meaningful fix,
refactor, or documentation update:

```bash
cd ~/literate-dollop
git status --short --branch
git pull --ff-only
pnpm install
pnpm --filter vettrack-expo typecheck
git add .gitignore README.md package.json pnpm-workspace.yaml plugins/vettrack-control/withVetTrackControl.js docs/mobile/redesign
git commit -m "docs: update Expo local workflow"
git push origin main
```

Do not commit local secrets or generated native folders. `apps/expo/.env`,
`apps/expo/ios/`, `apps/expo/android/`, and `.codex/` are local-only.

## Local development

```bash
cp apps/expo/.env.example apps/expo/.env
pnpm --filter vettrack-expo start
```

Required local env for production-like mobile auth and iOS signing:

```env
EXPO_PUBLIC_API_URL=https://vettrack.uk
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
APPLE_TEAM_ID=87F5G378M6
```

Use a **development build** for NFC, push, the Control Widget, or any custom native
code:

```bash
cd apps/expo && eas build --profile development --platform ios
```

For a clean local iOS regeneration:

```bash
cd ~/literate-dollop/apps/expo
rm -rf ios
pnpm exec expo prebuild --platform ios
```

### Running on a physical iPhone

`pnpm ios` may choose an iPad simulator by default. To target your iPhone, connect
and trust the device, enable Developer Mode on the phone, then run:

```bash
cd ~/literate-dollop/apps/expo
pnpm exec expo run:ios --device
```

When prompted, choose the physical iPhone. You can also pass the device name:

```bash
pnpm exec expo run:ios --device "Dan's iPhone"
```

If Xcode reports stale simulator/toolchain warnings, clear DerivedData and retry:

```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/VetTrack-*
pnpm exec expo run:ios --device
```

### Expo Go support

Expo Go is useful only for JS/UI preview work that avoids native-only features. The
full VetTrack mobile app uses `expo-dev-client`, `react-native-nfc-manager`, and a
custom Control Widget config plugin, so NFC, widgets, and any native module not
included in Expo Go require a development build.

To try the app in Expo Go for non-native UI checks:

```bash
cd ~/literate-dollop/apps/expo
pnpm exec expo start --go --lan
```

Scan the QR code with Expo Go. If a screen imports NFC/native-only code and fails in
Expo Go, use the development build instead; that is expected until the app has
explicit Expo-Go-safe fallbacks.

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

## Native redesign refactor brief

Future UI refactor work must start from these committed design documents:

- [Capacitor UI audit](docs/mobile/redesign/00-capacitor-ui-audit.md)
- [Native mobile design brief](docs/mobile/redesign/01-design-brief.md)

The redesign is approval-gated: produce design artifacts first, then implement only
after the look is approved. The direction is RTL/Hebrew-first, equipment-first,
forest-green + ivory brand, full status taxonomy, real offline/sync states, and a
native mobile evolution of the old Capacitor app rather than a reinvention.

## Agent context

See [AGENTS.md](AGENTS.md) for agent quickstart, port references, and frozen doctrine.  
Cross-repo runbook: [docs/governance/expo-agent-brief-2026-06-19.md](docs/governance/expo-agent-brief-2026-06-19.md).

## Consuming contracts from local vettrack (optional)

```json
"@vettrack/contracts": "github:exposwifty31/literate-dollop#path:packages/contracts&branch=main"
```
