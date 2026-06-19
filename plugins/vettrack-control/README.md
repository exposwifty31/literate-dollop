# vettrack-control (Expo config plugin) — Phase 2

iOS 18 **Control Center / Lock Screen widget** + App Intent ("Scan Equipment") for
`uk.vettrack.expo`. Ported from the Capacitor shell at
`ios/App/VetTrackControl/` in the local `vettrack` repo (read-only reference).

## Layout

| File | Role |
|------|------|
| `withVetTrackControl.js` | Config plugin — `@bacons/apple-targets` + EAS build-number sync |
| `ios/VetTrackScanControl.swift` | Control widget (`uk.vettrack.expo.control.scan`) |
| `ios/_shared/OpenScanIntent.swift` | App Intent → `vettrack://scan` |
| `ios/VetTrackControl.swift` | Widget bundle entry |
| `ios/expo-target.config.js` | Apple target metadata (iOS 18, `.control` suffix) |

## Integration

Registered in `apps/expo/app.config.ts`:

```ts
plugins: [..., "@vettrack/vettrack-control-plugin"]
```

Deep-link handoff: widget opens `vettrack://scan` → Expo Router `/scan` screen.
Auth-gated return path lives in `apps/expo/src/lib/linking/deep-link-return.ts`.

## Doctrine (frozen)

- Native iOS is integrated as an **Expo config plugin** — do not hand-edit
  `apps/expo/ios/` after prebuild.
- Bundle ID `uk.vettrack.expo`, scheme `vettrack://`, universal links
  `https://vettrack.uk/app/*`.
- Widget kind uses `.expo` suffix to coexist with Capacitor (`uk.vettrack.app.control.scan`).

## Exit gate

Phase 2 exit: **dev build with widget target** on a physical iOS 18+ device.

```bash
cd apps/expo
eas build --profile development --platform ios
```

After install, add the "Scan Equipment" control in Settings → Control Center,
then tap it — app should open on `/scan`.

## Verification (local)

```bash
pnpm test tests/vettrack-control-plugin.test.ts
pnpm test tests/deep-link-return.test.ts
npx expo prebuild --platform ios --clean   # from apps/expo
```
