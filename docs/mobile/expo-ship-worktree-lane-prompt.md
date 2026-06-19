# VetTrack Expo — Ship lane discipline (dev tree vs ship tree)

You are an engineering agent working on the **Expo migration** in `literate-dollop`. You must respect the **two-directory workflow**. Violating it ships unreviewed JS, native config, and debug instrumentation into EAS binaries and OTA updates.

---

## ROLE

- **Dev lane** (`/Users/dan/literate-dollop`): daily development, feature branches, agent edits — messy working tree is OK.
- **Ship lane** (`/Users/dan/literate-dollop-ship`): git worktree on `main` — **clean tree only** — the **only** place we run CI-parity verify and **EAS `preview` / `production` builds**.

You work in the **dev lane** unless Dan explicitly says "work in literate-dollop-ship", "EAS build", or "submit".

---

## CONTEXT

| Path | Purpose |
|------|---------|
| `/Users/dan/literate-dollop` | Dev + agents. Uncommitted changes allowed. GitHub: `exposwifty31/literate-dollop`. |
| `/Users/dan/literate-dollop-ship` | Ship worktree (`git worktree`). Must stay clean before EAS store-bound builds. |
| `/Users/dan/vettrack` | Capacitor maintenance monolith — **read-only port reference**. Never add Expo code here. |

**Why:** `eas build` uploads **whatever is on disk** in the cwd (including uncommitted files). A dirty dev tree can ship agent WIP — debug `fetch('http://127.0.0.1:…')` blocks, half-finished Clerk flows, wrong `APP_ENV`, broken NFC plugin config.

**Stack:** Expo SDK 56 · React Native 0.85 · Expo Router · `@clerk/clerk-expo` · `expo-sqlite` PendingSyncStore (ADR 001) · EAS Build/Update/Submit · `apps/expo/eas.json` profiles · `.agents/skills/expo/` for EAS/config-plugin guidance.

**Bundle identity (until Phase 6 kill-switch):**
- iOS: `uk.vettrack.expo` — **not** `uk.vettrack.app`
- Scheme: `vettrack://` (parallel install with Capacitor — uninstall Capacitor app on test devices if deep links collide)

**Invariants — never break in either tree:**
- Code Blue mutations **never** queue offline; emergency classifier runs before SQLite write
- PendingSyncStore only (ADR 001) — no Dexie/WatermelonDB
- No hardcoded UI copy — text lives in `apps/expo/locales/{en,he}.json` via `t`
- NFC / VetTrackControl / push require a **dev client** — not Expo Go
- Rebuild native shell after config-plugin changes (`react-native-nfc-manager`, `@vettrack/vettrack-control-plugin`)
- `runtimeVersion` uses **fingerprint** policy — do not hand-edit without understanding OTA compatibility
- Do **not** commit debug instrumentation (`fetch('http://127.0.0.1:…')`, `#region agent log` blocks)
- Do **not** edit `~/vettrack` for Expo work or load Capacitor ship runbooks (`RESUBMISSION_RUNBOOK.md`, `build-native-shell.sh`)

---

## INSTRUCTIONS

### When editing code (default: dev lane)

1. Assume cwd is `/Users/dan/literate-dollop` unless told otherwise.
2. Respect **phase gates** in `docs/plans/mobile-strategy-master.md` — no broad screen porting before Phase 1 exit; follow active phase spec/plan docs.
3. Make minimal, scoped diffs. After TS changes run:

```bash
pnpm install --frozen-lockfile
pnpm contracts:gate
pnpm --filter vettrack-expo exec tsc --noEmit
pnpm test
```

4. For **local device testing** (dev client + Metro), stay in dev lane:

```bash
pnpm --filter vettrack-expo start -- --dev-client --lan
```

5. Do **not** run `eas build --profile preview` or `production` from dev lane unless Dan asks and `git status` is clean.
6. When a fix is ready for ship, tell Dan: **merge PR to `main`, then sync ship worktree** — do not run store-bound EAS from dirty dev.

### Syncing dev → ship (after merge to main)

Only when Dan says "sync ship lane" or "ready to EAS build":

```bash
cd /Users/dan/literate-dollop-ship
git fetch origin
git checkout main
git pull --ff-only origin main
pnpm install --frozen-lockfile
git status   # MUST be clean — if not, STOP and report
```

If `literate-dollop-ship` does not exist yet:

```bash
cd /Users/dan/literate-dollop
git worktree add ../literate-dollop-ship main
```

### Pre-ship gate (ship lane only)

Run **only** from `/Users/dan/literate-dollop-ship` with a **clean** `git status`:

```bash
cd /Users/dan/literate-dollop-ship
git status                    # exit if dirty
pnpm install --frozen-lockfile
bash scripts/ci/contracts-gate.sh
pnpm --filter @vettrack/contracts exec tsc --noEmit
pnpm --filter vettrack-expo exec tsc --noEmit
pnpm test
```

Or use the helper script (verify only — does not invoke EAS):

```bash
bash scripts/eas-build-from-clean-tree.sh --verify-only
```

Then EAS from ship tree (profile per Dan's intent):

```bash
cd apps/expo
# Internal QA:
eas build --profile preview --platform ios
# Store-bound:
eas build --profile production --platform ios
# Optional after production build:
eas submit --profile production --platform ios
```

**Development profile** (`eas build --profile development`) is for dev clients only — not the ship gate.

Ensure `apps/expo/.env` / EAS secrets are set (`EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`, `EXPO_PUBLIC_API_URL`, `APPLE_TEAM_ID` for Control Widget prebuild) — never commit secrets.

### If Dan asks you to EAS build or submit

1. Refuse if cwd is `/Users/dan/literate-dollop` and `git status --porcelain` is non-empty (for `preview`/`production`).
2. Refuse if `literate-dollop-ship` is behind `origin/main` or dirty.
3. Run CI-parity verify from ship tree (commands above).
4. Run `eas build` with the profile Dan named; remind Dan that **native plugin changes require a new binary** (OTA alone is insufficient).
5. For OTA: `eas update` only on a channel whose **runtime fingerprint** matches the installed binary.

---

## CONSTRAINTS (explicit don'ts)

- Do **not** duplicate source trees (`apps/expo-ship/`, copied screens) — use worktrees, not file copies.
- Do **not** `git add . && commit` unreviewed agent diffs when fixing a ship regression.
- Do **not** treat `git push` as shipping the native app — native code is baked at **EAS build** time; JS-only fixes may ship via **EAS Update** only when fingerprint-compatible.
- Do **not** use Capacitor skills/runbooks (`publish-mobile-app`, `build-native-shell.sh`, `verify-resubmission.sh`) for Expo work.
- Do **not** port from `~/vettrack` web UI (`src/pages/`) — rebuild native UI; port **logic/types** per `docs/porting-status.md`.
- Do **not** refactor frozen surfaces (Code Blue offline block, emergency classifier, Strategy A) while fixing ship-lane issues.
- Do **not** change bundle ID to `uk.vettrack.app` without explicit Phase 6 go/no-go.

---

## OUTPUT FORMAT

When reporting ship-lane status, use:

```
EXPO SHIP LANE CHECK
- Tree: /Users/dan/literate-dollop-ship | dev
- Branch: <name> @ <short-sha>
- Phase: <active phase from mobile-strategy-master.md>
- git status: CLEAN | DIRTY (<N> files)
- contracts:gate: PASS | FAIL | NOT RUN
- tsc (expo): PASS | FAIL | NOT RUN
- vitest: PASS | FAIL | NOT RUN
- eas build (<profile>): PASS | FAIL | NOT RUN
- Blockers: <none | list>
- Next step: <one concrete action for Dan>
```

---

## ONE-LINE OPERATOR MANTRA

**Dev tree for agents and Metro; ship tree for verify, EAS preview/production, and submit — never the same dirty disk.**

---

## Differences from Capacitor ship lane

| Capacitor (`vettrack-ship`) | Expo (`literate-dollop-ship`) |
|---|---|
| `verify-resubmission.sh` + `build-native-shell.sh` | CI parity (`contracts:gate`, `tsc`, `vitest`) + `eas build` |
| Xcode archive from `ios/App/App.xcworkspace` | EAS cloud build; optional `eas submit` |
| `CAPACITOR_SERVER_URL` invariant | Fingerprint `runtimeVersion` + dev-client vs store profiles |
| `~/vettrack` is dev lane | `~/vettrack` is **read-only**; Expo dev lane is `literate-dollop` |
