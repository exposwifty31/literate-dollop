# Porting status — vettrack → literate-dollop (milestone 1)

Tracks the import of the **Expo-relevant logic/types** from the `vettrack`
maintenance repo into this canonical Expo monorepo. The web/server UI is **not**
ported — it is rebuilt native. `vettrack` is read-only reference.

Decision for this milestone (operator-confirmed): **foundation first** — land the
clean logic/type layer now; defer the two heavy modules (`api.ts`, `sync-engine.ts`)
and everything entangled with them to a focused follow-up.

---

## ✅ Imported this milestone

| Item | vettrack source | destination | notes |
|------|-----------------|-------------|-------|
| Locales | `locales/{en,he}.json` | `apps/expo/locales/` | copied as-is; Hebrew default; en↔he parity preserved |
| i18n core | `lib/i18n/{index,internal-keys,types}.ts` | `apps/expo/src/lib/i18n-core/` | platform-agnostic; `.js` import extensions stripped |
| i18n accessor | `src/lib/i18n.ts` | `apps/expo/src/lib/i18n.ts` | accessor tree verbatim; storage swapped `localStorage`→`AsyncStorage`, `document`/`window`/`navigator` removed, RTL via `I18nManager`. Added `hydrateStoredLocale()` (async startup) + `subscribeLocaleChange()` |
| Domain types | `src/types/*` | `apps/expo/src/types/` | `.js` extensions stripped; `cursor-bug-fixer` kept for index parity |
| Shared type deps | `shared/{authority,doctor-operational-shift,equipment-board}.ts`, `shared/contracts/cursor-bug-fixer.v1.ts` | `apps/expo/src/types/shared/` | pure types pulled in to satisfy `src/types` imports; rewired to local `./shared/*` |
| Restock reducer | `src/features/inventory/restock-session-reducer.ts` | same | pure, zero deps — copied verbatim |
| Shift-chat types | `src/features/shift-chat/types.ts` | same | structural types kept; **Hebrew broadcast labels dropped** (i18n invariant) — `BroadcastKey` now derives from `BROADCAST_KEYS` |
| Native module home | — | `plugins/vettrack-control/` | Phase 2 scaffold + README only |

Tests added: `tests/i18n-interpolate.test.ts`, `tests/restock-session-reducer.test.ts`.
Path aliases added: `@/types`, `@/types/*`, `@/features/*`, `@/hooks/*` (tsconfig + vitest).

**Gates:** `pnpm --filter vettrack-expo exec tsc --noEmit` ✅ · `pnpm test` ✅ (38) ·
`pnpm contracts:gate` ✅. Contracts were already byte-identical between repos — no merge needed.

---

## ✅ Phase 3 (in progress)

| Item | destination | notes |
|------|-------------|-------|
| **network.ts** | `apps/expo/src/lib/network.ts` | NetInfo connectivity + test hooks |
| **equipment-id.ts** | `apps/expo/src/lib/equipment-id.ts` | pure URL → equipment UUID |
| **equipment-scan API** | `apps/expo/src/lib/api/equipment-scan.ts` | scan mutation + `X-Client-Timestamp` |
| **sync-engine.ts** | `apps/expo/src/lib/sync-engine.ts` | thin port on `PendingSyncStore`; `sync-ui-seam` replaces sonner/Sentry |
| **use-sync** | `apps/expo/src/hooks/use-sync.ts` | NetInfo → debounced `processQueue` |
| **nfc-platform.ts** | `apps/expo/src/lib/nfc-platform.ts` | `react-native-nfc-manager` adapter |
| **scan screen** | `apps/expo/app/(app)/scan.tsx` | NFC read → confirm → offline queue → replay |

Still deferred: full `api.ts` surface, use-auth, equipment cache tables, QR camera.

---

## ⏸ Deferred (with reason + port notes)

These are entangled with the two heavy modules and/or need an RN rewrite or a
dependency not yet in `apps/expo`. Port them in the follow-up that lands
`api.ts` + `sync-engine.ts`.

| Item | vettrack source | Blocking reason | Port note |
|------|-----------------|-----------------|-----------|
| **api.ts** | `src/lib/api.ts` (1042 l) | partial — scan endpoints only for Phase 3 | merge remaining endpoints in follow-up; strip Dexie/sonner |
| **sync-engine.ts** | `src/lib/sync-engine.ts` (511 l) | ✅ thin port landed (Phase 3) | conflict UI, Sentry, QueryClient invalidation still deferred |
| use-auth | `src/hooks/use-auth.tsx` | depends on full `api.ts`; uses `@clerk/clerk-react`, `@tanstack/react-query` | swap to `@clerk/clerk-expo`; provide a query-client seam |
| use-sync | `src/hooks/use-sync.tsx` | ✅ rebuilt (Phase 3) | mounted from root layout |
| use-push-notifications | `src/hooks/use-push-notifications.tsx` | web push / service worker | **rewrite** on `expo-notifications` (not a port) |
| use-settings | `src/hooks/use-settings.tsx` | DOM theming (`document.classList`, `body.style`) | rewrite as RN theme context; reuse `setStoredLocale`/`applyLocaleDirection` |
| useShiftChat | `src/features/shift-chat/hooks/useShiftChat.ts` | `@tanstack/react-query`, `sonner`, `shift-chat/api`→`api.ts` | port after `api.ts`; add query-client + toast seam |
| shift-chat/api | `src/features/shift-chat/api.ts` | imports `@/lib/api` | trivial once `api.ts` lands |
| useAutoSelectOrg | `src/features/auth/hooks/useAutoSelectOrg.ts` | `@clerk/clerk-react` org API + `capacitor-runtime` | re-express with `@clerk/clerk-expo`; drop Capacitor branch |

UI components (`*.tsx` under `src/features/*/components`, e.g. `DispenseSheet`,
`ShiftChatPanel`) are **out of scope** — rebuilt native, not ported.

---

## 🔵 / 🔴 (per Import Manifest)

- 🔵 SwiftUI `VetTrackControl`: Phase 2 — plugin at `plugins/vettrack-control/`.
- 🔵 NFC equipment scan: Phase 3 — `nfc-platform.ts` + `/scan` screen (dev build required).
- 🔴 Not imported (stays in vettrack): `server/**`, `migrations/**`, `src/pages/**`,
  `src/components/ui/**`, Capacitor `ios/android`, Vite/PWA/service-worker.
