# vettrack-control (Expo config plugin) — Phase 2 placeholder

Reserved home for the **VetTrackControl** native module: the iOS Control
Center / Lock Screen widget + App Intent ("open scan") currently living in
the Capacitor shell at `ios/App/VetTrackControl/` in the `vettrack` repo.

This directory is **scaffolding only**. No Swift has been ported yet — that
is Phase 2 work, gated behind the Phase 1 exit criteria (see
[`docs/plans/mobile-strategy-master.md`](../../docs/plans/mobile-strategy-master.md)).

## Phase 2 plan

| `vettrack` source (read-only reference)            | destination here                         |
| -------------------------------------------------- | ---------------------------------------- |
| `ios/App/VetTrackControl/VetTrackControl.swift`    | `plugins/vettrack-control/ios/`          |
| `ios/App/VetTrackControl/VetTrackScanControl.swift`| `plugins/vettrack-control/ios/`          |
| `ios/App/VetTrackControl/AppIntent+OpenScan.swift` | `plugins/vettrack-control/ios/`          |
| config plugin                                      | `plugins/vettrack-control/withVetTrackControl.ts` |

## Doctrine (frozen)

- Native iOS is integrated as an **Expo config plugin**, not by hand-editing
  `apps/expo/ios/` after prebuild (config plugins only — master plan doctrine).
- Bundle ID `uk.vettrack.expo`, scheme `vettrack://`, universal links
  `https://vettrack.uk/app/*`.
- Do not start Phase 2 until the three Phase 1 exit criteria pass.
