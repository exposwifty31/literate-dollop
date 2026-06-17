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

### Follow-up branch (`claude/expo-port-api-sync-engine`)

| Item | vettrack source | destination | notes |
|------|-----------------|-------------|-------|
| **sync-engine** | `src/lib/sync-engine.ts` (511 l) | `apps/expo/src/lib/sync-engine.ts` | faithful FIFO/retry/circuit-breaker/crash-recovery port. Dexie→`PendingSyncStore`; `sonner`+i18n→`SyncNotifier` seam; `@sentry/react`→`SyncReporter` seam; `@tanstack/react-query`→`invalidateQueries`/`clearQueries` seams; `navigator.locks` dropped (single-threaded JS); `window` online→`subscribeOnline` seam (NetInfo); **Phase 9 post-sync reconciliation dropped** (realtime-adjacent — no SSE pre-Phase 6) |
| api-origin | `src/lib/api-origin.ts` | same | `resolveApiUrl` via `EXPO_PUBLIC_API_URL`; existing `api.ts` de-duped onto it |
| auth-store | `src/lib/auth-store.ts` | same | pure in-memory token/clinic holder — copied verbatim |
| conflict-store | `src/lib/conflict-store.ts` | same | Dexie reads/writes → `PendingSyncStore`; React `useConflicts` dropped (kept React-free so the engine stays node-testable) — added `subscribeConflicts`/`getConflicts` |
| store/queue extensions | — | `pending-sync-store.ts`, `offline/pending-sync-queue.ts` | added `getConflictRows`; queue now delegates `getPendingQueue`/`getPendingSyncById`/`updatePendingSync`/`removePendingSync`/`recoverProcessingPendingSync`/`runStartupCleanup`/`getConflictRows` |

Tests added: `tests/sync-engine.test.ts` (replay→synced, conflict, 403→dead,
401→halt, transient→dead). Total suite: **44 pass**.

**Wiring the seams (app, later):** call `initSyncEngine({ notifier, reporter,
invalidateQueries, clearQueries, onAuthHalt, subscribeOnline })` once at startup;
populate `auth-store` (`setAuthState`) + `setAuthStateRef` from the auth layer.
The engine drains the same `PendingSyncStore` that `api.request()` enqueues into.

> Note: the web `api.ts` "port" is the **request core** — already implemented in
> `apps/expo/src/lib/api.ts` (`request()` with emergency classifier + offline
> enqueue). The 1042-line *typed endpoint catalog* is ported incrementally as
> each hook/screen needs it (it is mechanical typed `request()` wrappers), not
> dumped wholesale.

**Gates:** `pnpm --filter vettrack-expo exec tsc --noEmit` ✅ · `pnpm test` ✅ (38) ·
`pnpm contracts:gate` ✅. Contracts were already byte-identical between repos — no merge needed.

---

## ⏸ Deferred (with reason + port notes)

These are entangled with the two heavy modules and/or need an RN rewrite or a
dependency not yet in `apps/expo`. Port them in the follow-up that lands
`api.ts` + `sync-engine.ts`.

| Item | vettrack source | Blocking reason | Port note |
|------|-----------------|-----------------|-----------|
| api.ts typed catalog | `src/lib/api.ts` (1042 l) | incremental, not blocking | request core already ported; port the typed endpoint wrappers per hook/screen as needed |
| use-auth | `src/hooks/use-auth.tsx` | uses `@clerk/clerk-react`, `@tanstack/react-query`; needs `offline-session` | swap to `@clerk/clerk-expo`; provide a query-client seam; populate `auth-store` + `setAuthStateRef`; port `offline-session` onto AsyncStorage |
| use-sync | `src/hooks/use-sync.tsx` | `sync-engine` now available, but imports `dexie` `liveQuery` + needs a reactive store layer | wrap `onSyncStateChange`/`getSyncProgress` + `subscribeConflicts` in a hook; replace `liveQuery` with a store-change subscription |
| use-push-notifications | `src/hooks/use-push-notifications.tsx` | web push / service worker | **rewrite** on `expo-notifications` (not a port) |
| use-settings | `src/hooks/use-settings.tsx` | DOM theming (`document.classList`, `body.style`) | rewrite as RN theme context; reuse `setStoredLocale`/`applyLocaleDirection` |
| useShiftChat | `src/features/shift-chat/hooks/useShiftChat.ts` | `@tanstack/react-query`, `sonner`, `shift-chat/api`→`api.ts` | port after `api.ts`; add query-client + toast seam |
| shift-chat/api | `src/features/shift-chat/api.ts` | imports `@/lib/api` | trivial once `api.ts` lands |
| useAutoSelectOrg | `src/features/auth/hooks/useAutoSelectOrg.ts` | `@clerk/clerk-react` org API + `capacitor-runtime` | re-express with `@clerk/clerk-expo`; drop Capacitor branch |

UI components (`*.tsx` under `src/features/*/components`, e.g. `DispenseSheet`,
`ShiftChatPanel`) are **out of scope** — rebuilt native, not ported.

---

## 🔵 / 🔴 (per Import Manifest)

- 🔵 SwiftUI `VetTrackControl` + native NFC: Phase 2 / Phase 3 — home scaffolded at `plugins/vettrack-control/`.
- 🔴 Not imported (stays in vettrack): `server/**`, `migrations/**`, `src/pages/**`,
  `src/components/ui/**`, Capacitor `ios/android`, Vite/PWA/service-worker.
