# Capacitor Kill-Switch — H7 Retirement Criteria & Runbook

**Status:** `approved-path` (product go/no-go = GO, 2026-06-22) — execution gated on the external steps below
**Owners:** Dan (product) · Expo agent (literate-dollop) · vettrack maintainer
**Cross-repo:** Expo **E-P3-4** ↔ vettrack **P3-7**
**Refs:** [`docs/governance/expo-agent-brief-2026-06-19.md`](../governance/expo-agent-brief-2026-06-19.md) · [`docs/plans/mobile-strategy-master.md`](../plans/mobile-strategy-master.md) (Phase 6) · [ADR-006](../adr/006-capacitor-kill-switch.md)

> This is the written kill-switch doc the H7 sign-off gate requires. It defines
> **when** Capacitor (`uk.vettrack.app`) may be retired, **how** the cutover is
> sequenced across two repos and the app stores, and **how to roll back**. GO
> authorizes the path; the Expo `capacitorRetired` flag is flipped to `true`
> only **after** the store cutover below completes.

---

## 1. Bundle identities

| App | Bundle / package | Status |
|-----|------------------|--------|
| Capacitor (legacy) | `uk.vettrack.app` | Live store path (H0) — being retired |
| Expo (this repo) | `uk.vettrack.expo` | Becomes the sole store path at H7 |

The Expo `bundleIdentifier` / `package` are **not** changed by this repo as part
of H7 (`apps/expo/app.config.ts` stays `uk.vettrack.expo`). Whether the store
listing migrates in place or ships as a new identity is a **store/EAS decision**
(see §5 handoff) — not a code change here.

## 2. Go/no-go criteria (all must hold before flipping the kill-switch)

- [ ] Expo parity for the equipment-first scope is shipped and stable: H1–H6
      complete (workspace/contracts/Clerk/PendingSyncStore, VetTrackControl,
      NFC scan, parity waves 1–4, SSE+push, coexistence banner).
- [ ] Internal beta of the Expo build passes on real devices (NFC hardware QA on
      a dev client; Capacitor build uninstalled to avoid `vettrack://` collision).
- [ ] Crash-free + sync-success metrics on the Expo build meet the agreed bar.
- [ ] Code Blue online-only invariant verified on the Expo build (no emergency
      mutation ever enqueued) — `tests/code-blue-offline.test.ts` + manual QA.
- [ ] App Store / Play listings for the Expo identity are approved and ready.
- [ ] Rollback path (§4) rehearsed.

## 3. Cutover sequence (ordered; each step gated on the previous)

1. **Expo readiness (this repo — DONE):** kill-switch flag
   `EXPO_PUBLIC_CAPACITOR_RETIRED` (default `false`) + retired banner variant +
   this doc. No user-visible change yet.
2. **Store cutover (handoff — EAS/App Store/Play):** publish the Expo build as
   the production VetTrack app; stop shipping new Capacitor releases.
3. **Flip the kill-switch:** set `EXPO_PUBLIC_CAPACITOR_RETIRED=true` for the
   Expo production build → the coexistence banner becomes the "retired" message
   (`t.cutoverBanner.retired*`), telling users they may uninstall the old app.
4. **Retire Capacitor in vettrack (handoff — vettrack repo, P3-7):** remove the
   Capacitor `ios/`/`android/` paths and references **only after** steps 2–3 are
   live and stable. Guardrail: *never delete Capacitor refs before this point*
   (governance brief §5).
5. **Decommission:** remove the Capacitor listing per store policy once adoption
   has migrated.

## 4. Rollback

| If a problem appears at… | Roll back by… |
|--------------------------|---------------|
| Step 3 (kill-switch on) | Set `EXPO_PUBLIC_CAPACITOR_RETIRED=false` (or disable the banner via `EXPO_PUBLIC_CUTOVER_BANNER_ENABLED=false`) and re-deploy — pure config, no code revert. |
| Step 2 (store cutover) | Resume Capacitor releases; keep both store listings live (coexistence is the pre-H7 state). |
| Step 4 (vettrack removal) | Revert the vettrack Capacitor-removal PR (paths are reinstated from git history). |

No data migration is involved — `PendingSyncStore` and the monolith API are
unchanged by H7.

## 5. Steps this repo/agent CANNOT perform (explicit handoffs)

These are **required follow-ups** outside the literate-dollop session scope:

1. **EAS / App Store / Play:** publish the Expo build to production, manage
   signing, and migrate/retire the Capacitor store listing. *(Store ops)*
2. **vettrack repo (P3-7):** delete Capacitor `ios/`/`android/` paths and
   references after the store cutover. *(vettrack maintainer — separate repo,
   not in this session's scope)*
3. **Flip `EXPO_PUBLIC_CAPACITOR_RETIRED=true`** in the production Expo
   environment once step 5.2 is live. *(Release owner)*

## 6. What H7 delivered in this repo

- `EXPO_PUBLIC_CAPACITOR_RETIRED` kill-switch flag (`src/lib/cutover/cutover-config.ts`).
- Retired banner variant + en/he copy (`components/CutoverBanner.tsx`, `locales/*`).
- This runbook + ADR-006.
- Tests: kill-switch default/override and banner-variant selection.
