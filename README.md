# literate-dollop — VetTrack Expo (Horizon 1+)

Expo / React Native shell for VetTrack mobile. Runs **alongside** the Capacitor app in [vettrack](https://github.com/exposwifty31/vettrack) until workflow parity and internal beta gates pass.

## Stack

| Layer | Choice |
|-------|--------|
| Expo SDK | 56 (RN 0.85, New Architecture default) |
| Navigation | Expo Router + typed routes |
| Dev workflow | `expo-dev-client` + EAS Build |
| Package manager | **pnpm 9.15.9** (match vettrack) |
| Bundle IDs | `uk.vettrack.expo` (iOS/Android) — **not** `uk.vettrack.app` so Capacitor Build 14 and Expo can coexist on one device |

## Prerequisites

- Node.js 22+
- [EAS CLI](https://docs.expo.dev/build/setup/): `pnpm add -g eas-cli`
- Expo account linked: `eas login` then `eas init` (writes `extra.eas.projectId` into `app.config.ts`)

## Local development

```bash
pnpm install
cp .env.example .env
pnpm start
```

Use a **development build** (not Expo Go) for anything touching NFC, push, or custom native code:

```bash
eas build --profile development --platform ios
# or
eas build --profile development --platform android
```

## EAS profiles

| Profile | Purpose |
|---------|---------|
| `development` | Dev client, internal distribution, `development` update channel |
| `preview` | Internal QA APK/IPA, `preview` channel |
| `production` | Store-bound binaries, fingerprint runtime version, auto-increment |

## Deep links

- Custom scheme: `vettrack://`
- Universal / app links: `https://vettrack.uk/app/*` (requires hosted `apple-app-site-association` + `assetlinks.json`)

## Migration phases (from master plan)

1. **Done** — Bootstrap (`15a3b48`), EAS skeleton, ADR 001 offline storage (`b44db8e`)
2. **Now** — pnpm lockfile commit, shared `@vettrack/contracts`, Clerk RN auth
3. **Next** — NFC (`react-native-nfc-manager`), offline adapter implementation
4. **Later** — SwiftUI `VetTrackControl` via config plugin, push (`expo-notifications`)
5. **Gate** — Internal TestFlight / Play internal before public Capacitor retirement

## Related VetTrack docs

Capacitor resubmission and NFC ship checklist live in the main `vettrack` repo under `docs/mobile/` and `RESUBMISSION_RUNBOOK.md`.
