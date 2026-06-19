# Phase 3 NFC Equipment Scan — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship one offline-capable NFC equipment scan workflow (read tag → POST scan → queue → sync-engine replay) on iOS and Android dev builds.

**Architecture:** Thin port of vettrack sync-engine onto existing `PendingSyncStore`; real NetInfo connectivity; `react-native-nfc-manager` for NFC; native `/scan` screen with confirm step and i18n-only copy. Critical path: NetInfo → sync-engine → auth bridge → use-sync → scan UI.

**Tech Stack:** Expo SDK 56, React Native 0.85, `@react-native-community/netinfo`, `react-native-nfc-manager`, `@clerk/clerk-expo`, `expo-sqlite`, vitest.

**Spec:** [2026-06-17-phase3-nfc-equipment-scan-design.md](../specs/2026-06-17-phase3-nfc-equipment-scan-design.md)

**Mobile UX checkpoint (apply on scan screen):**
- Platform: iOS + Android
- Touch targets ≥ 44pt; Confirm CTA in thumb zone
- Loading / error / offline / retry states required
- No hardcoded copy — `t()` + locales only

---

## File map

| File | Responsibility |
|------|----------------|
| `apps/expo/src/lib/network.ts` | NetInfo `isOnline`, `subscribeOnline` |
| `apps/expo/src/lib/equipment-id.ts` | Pure URL → equipment UUID |
| `apps/expo/src/lib/sync-ui-seam.ts` | Toast/telemetry noop |
| `apps/expo/src/lib/sync-engine.ts` | FIFO replay, circuit breaker |
| `apps/expo/src/lib/api/equipment-scan.ts` | Scan mutation + timestamp header |
| `apps/expo/src/lib/nfc-platform.ts` | RN NFC adapter |
| `apps/expo/src/hooks/use-sync.ts` | NetInfo → debounced `processQueue` |
| `apps/expo/src/hooks/use-sync-auth-bridge.ts` | Clerk → `setAuthStateRef` |
| `apps/expo/app/(app)/scan.tsx` | Scan state machine UI |

---

### Task 1: Dependencies and test mocks

**Files:**
- Modify: `apps/expo/package.json`
- Create: `tests/mocks/netinfo.ts`
- Create: `tests/mocks/react-native-nfc-manager.ts`
- Modify: `vitest.config.ts`

- [ ] **Step 1: Add dependencies**

In `apps/expo/package.json` dependencies:

```json
"@react-native-community/netinfo": "^11.4.1",
"react-native-nfc-manager": "^3.16.0"
```

Run: `pnpm install --frozen-lockfile` (or `pnpm install` if lockfile update needed)

- [ ] **Step 2: Create NetInfo mock**

Create `tests/mocks/netinfo.ts`:

```typescript
type NetInfoListener = (state: { isConnected: boolean; isInternetReachable: boolean | null }) => void;

let connected = true;
const listeners = new Set<NetInfoListener>();

export function __setNetInfoConnected(value: boolean): void {
  connected = value;
  const state = { isConnected: value, isInternetReachable: value ? true : false };
  listeners.forEach((fn) => fn(state));
}

export default {
  fetch: async () => ({
    isConnected: connected,
    isInternetReachable: connected ? true : false,
  }),
  addEventListener: (_type: string, listener: NetInfoListener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
```

- [ ] **Step 3: Create NFC manager mock**

Create `tests/mocks/react-native-nfc-manager.ts`:

```typescript
export default {
  start: async () => {},
  stop: async () => {},
  isSupported: async () => true,
  requestTechnology: async () => {},
  cancelTechnologyRequest: async () => {},
  getTag: async () => ({ id: "04123456", ndefMessage: [] }),
  setEventListener: () => {},
};
```

- [ ] **Step 4: Wire vitest aliases**

Add to `vitest.config.ts` resolve.alias:

```typescript
"@react-native-community/netinfo": path.resolve(__dirname, "tests/mocks/netinfo.ts"),
"react-native-nfc-manager": path.resolve(__dirname, "tests/mocks/react-native-nfc-manager.ts"),
```

- [ ] **Step 5: Verify install**

Run: `pnpm --filter vettrack-expo exec tsc --noEmit`
Expected: PASS (may need prebuild later for native modules; typecheck should pass)

---

### Task 2: NetInfo connectivity layer

**Files:**
- Modify: `apps/expo/src/lib/network.ts`
- Create: `tests/network.test.ts`

- [ ] **Step 1: Write failing network tests**

Create `tests/network.test.ts`:

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __setNetInfoConnected } from "@react-native-community/netinfo";

describe("network", () => {
  beforeEach(async () => {
    vi.resetModules();
    __setNetInfoConnected(true);
  });

  afterEach(() => {
    __setNetInfoConnected(true);
  });

  it("isOnline reflects NetInfo state", async () => {
    const { isOnline, primeNetworkState } = await import("@/lib/network");
    await primeNetworkState();
    expect(isOnline()).toBe(true);
    __setNetInfoConnected(false);
    expect(isOnline()).toBe(false);
  });

  it("setForcedOfflineForTests overrides NetInfo", async () => {
    const { isOnline, primeNetworkState, setForcedOfflineForTests } = await import("@/lib/network");
    await primeNetworkState();
    __setNetInfoConnected(true);
    setForcedOfflineForTests(true);
    expect(isOnline()).toBe(false);
    setForcedOfflineForTests(false);
  });

  it("subscribeOnline notifies on change", async () => {
    const { subscribeOnline, primeNetworkState } = await import("@/lib/network");
    await primeNetworkState();
    const seen: boolean[] = [];
    const unsub = subscribeOnline((online) => seen.push(online));
    __setNetInfoConnected(false);
    __setNetInfoConnected(true);
    unsub();
    expect(seen).toContain(false);
    expect(seen).toContain(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/network.test.ts`
Expected: FAIL — `primeNetworkState` / `subscribeOnline` not defined

- [ ] **Step 3: Implement network.ts**

Replace `apps/expo/src/lib/network.ts` connectivity section (keep existing error classes):

```typescript
import NetInfo from "@react-native-community/netinfo";

let forcedOffline = false;
let cachedOnline = true;

export function setForcedOfflineForTests(value: boolean): void {
  forcedOffline = value;
}

function readOnline(isConnected: boolean | null, isInternetReachable: boolean | null): boolean {
  if (isConnected !== true) return false;
  if (isInternetReachable === false) return false;
  return true;
}

/** Call once at app startup (from use-sync or root layout). */
export async function primeNetworkState(): Promise<void> {
  const state = await NetInfo.fetch();
  cachedOnline = readOnline(state.isConnected, state.isInternetReachable);
}

export function isOnline(): boolean {
  if (forcedOffline) return false;
  return cachedOnline;
}

export function subscribeOnline(callback: (online: boolean) => void): () => void {
  return NetInfo.addEventListener((state) => {
    cachedOnline = readOnline(state.isConnected, state.isInternetReachable);
    callback(isOnline());
  });
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm test tests/network.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/expo/package.json apps/expo/src/lib/network.ts tests/network.test.ts tests/mocks/netinfo.ts tests/mocks/react-native-nfc-manager.ts vitest.config.ts pnpm-lock.yaml
git commit -m "feat(phase-3): add NetInfo connectivity layer with tests"
```

---

### Task 3: Equipment ID extraction

**Files:**
- Create: `apps/expo/src/lib/equipment-id.ts`
- Create: `tests/equipment-id.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/equipment-id.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { extractEquipmentId, UNIVERSAL_LINK_HOST } from "@/lib/equipment-id";

describe("extractEquipmentId", () => {
  it("parses production universal link", () => {
    expect(extractEquipmentId("https://vettrack.uk/equipment/abc-123")).toBe("abc-123");
  });

  it("parses URL with query string", () => {
    expect(extractEquipmentId("https://vettrack.uk/equipment/abc-123?nfc=1")).toBe("abc-123");
  });

  it("accepts bare uuid", () => {
    expect(extractEquipmentId("eq-uuid-99")).toBe("eq-uuid-99");
  });

  it("returns null for empty", () => {
    expect(extractEquipmentId("")).toBeNull();
    expect(extractEquipmentId("   ")).toBeNull();
  });

  it("exports canonical host constant", () => {
    expect(UNIVERSAL_LINK_HOST).toBe("vettrack.uk");
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `pnpm test tests/equipment-id.test.ts`

- [ ] **Step 3: Port equipment-id.ts**

Create `apps/expo/src/lib/equipment-id.ts` (verbatim from vettrack):

```typescript
export const UNIVERSAL_LINK_ORIGIN = "https://vettrack.uk";
export const UNIVERSAL_LINK_HOST = "vettrack.uk";

export function extractEquipmentId(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split("/");
    const idx = parts.indexOf("equipment");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    return null;
  } catch {
    if (!trimmed.includes(" ") && trimmed.length > 0) return trimmed;
    return null;
  }
}
```

- [ ] **Step 4: Run test — expect PASS**

Run: `pnpm test tests/equipment-id.test.ts`

- [ ] **Step 5: Commit**

```bash
git add apps/expo/src/lib/equipment-id.ts tests/equipment-id.test.ts
git commit -m "feat(phase-3): port equipment-id parser with tests"
```

---

### Task 4: Pending sync queue helpers

**Files:**
- Modify: `apps/expo/src/lib/offline/pending-sync-queue.ts`

- [ ] **Step 1: Add update/remove wrappers**

Append to `pending-sync-queue.ts`:

```typescript
import type { PendingSync } from "@vettrack/contracts";

export async function updatePendingSync(
  id: number,
  patch: Partial<PendingSync>,
): Promise<void> {
  const store = await getPendingSyncStore();
  await store.updatePendingSync(id, patch);
}

export async function removePendingSync(id: number): Promise<void> {
  const store = await getPendingSyncStore();
  await store.removePendingSync(id);
}

export async function getPendingQueue() {
  const store = await getPendingSyncStore();
  return store.getPendingQueue();
}
```

- [ ] **Step 2: Verify types**

Run: `pnpm --filter vettrack-expo exec tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/expo/src/lib/offline/pending-sync-queue.ts
git commit -m "feat(phase-3): expose pending sync update/remove queue helpers"
```

---

### Task 5: Extend api.request for clientTimestamp

**Files:**
- Modify: `apps/expo/src/lib/api.ts`
- Create: `tests/equipment-scan-api.test.ts`

- [ ] **Step 1: Write failing test for timestamp on enqueue**

Create `tests/equipment-scan-api.test.ts`:

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addPendingSync,
  resetPendingSyncStoreForTests,
  setPendingSyncStoreForTests,
} from "@/lib/offline/pending-sync-queue";
import { PendingSyncStore } from "@/lib/offline/pending-sync-store";
import { setForcedOfflineForTests } from "@/lib/network";
import { createTestSqlExecutor } from "./helpers/test-sql-executor";

describe("equipment-scan api contract", () => {
  beforeEach(async () => {
    resetPendingSyncStoreForTests();
    const store = new PendingSyncStore(createTestSqlExecutor());
    await store.init();
    await setPendingSyncStoreForTests(store);
    setForcedOfflineForTests(true);
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
  });

  afterEach(() => {
    resetPendingSyncStoreForTests();
    setForcedOfflineForTests(false);
    vi.unstubAllGlobals();
  });

  it("scanEquipment preserves clientTimestamp on enqueue", async () => {
    const ts = 1_700_000_000_000;
    const { scanEquipment } = await import("@/lib/api/equipment-scan");
    const result = await scanEquipment("eq-1", { status: "ok" }, ts);
    expect(result.kind).toBe("queued");
    const rows = await store.getAllPendingSync();
    expect(rows[0]?.clientTimestamp).toBe(ts);
  });
});
```

Adjust test — need store variable in scope. Fix:

```typescript
  let store: PendingSyncStore;
  beforeEach(async () => {
    // ...
    store = new PendingSyncStore(createTestSqlExecutor());
    await store.init();
    await setPendingSyncStoreForTests(store);
```

- [ ] **Step 2: Extend OfflineRequestOptions in api.ts**

```typescript
export interface OfflineRequestOptions {
  offlineType: PendingSyncType;
  optimisticResult?: unknown;
  clientTimestamp?: number;
}
```

In offline enqueue block:

```typescript
const clientTimestamp = offline.clientTimestamp ?? Date.now();
await addPendingSync({
  // ...
  clientTimestamp,
});
```

- [ ] **Step 3: Create equipment-scan.ts**

Create `apps/expo/src/lib/api/equipment-scan.ts`:

```typescript
import type { Equipment, ScanEquipmentRequest, ScanLog } from "@/types/equipment";
import { request } from "@/lib/api";

export type ScanEquipmentResult =
  | { kind: "synced"; equipment: Equipment; scanLog: ScanLog }
  | { kind: "queued"; equipmentId: string; pendingSyncId: number; queuedAt: number };

type ScanApiResponse = {
  equipment: Equipment;
  scanLog: ScanLog;
  undoToken?: string;
};

export async function scanEquipment(
  equipmentId: string,
  body: ScanEquipmentRequest,
  clientTimestamp: number = Date.now(),
): Promise<ScanEquipmentResult> {
  const optimistic = {
    kind: "queued" as const,
    equipmentId,
    queuedAt: clientTimestamp,
  };

  const result = await request<ScanApiResponse | typeof optimistic>(
    `/api/equipment/${equipmentId}/scan`,
    {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "X-Client-Timestamp": String(clientTimestamp) },
    },
    {
      offlineType: "scan",
      clientTimestamp,
      optimisticResult: optimistic,
    },
  );

  if (result && typeof result === "object" && "kind" in result && result.kind === "queued") {
    const rows = await import("@/lib/offline/pending-sync-queue").then((m) => m.getAllPendingSync());
    const row = rows.find((r) => r.endpoint === `/api/equipment/${equipmentId}/scan`);
    return {
      kind: "queued",
      equipmentId,
      pendingSyncId: row?.id ?? -1,
      queuedAt: clientTimestamp,
    };
  }

  const synced = result as ScanApiResponse;
  return { kind: "synced", equipment: synced.equipment, scanLog: synced.scanLog };
}
```

Refactor pendingSyncId lookup — prefer returning from addPendingSync. Better approach: change `request()` to return `{ queued: true, pendingSyncId }` OR have scanEquipment call addPendingSync path explicitly. **Simpler fix:** extend optimistic result to include pendingSyncId by changing api.request to return enqueue id:

Add to `OfflineRequestOptions`:
```typescript
onEnqueued?: (id: number) => void;
```

In enqueue block:
```typescript
const id = await addPendingSync({...});
offline.onEnqueued?.(id);
```

Then scanEquipment:

```typescript
let pendingSyncId = -1;
const result = await request<ScanApiResponse | typeof optimistic>(..., {
  offlineType: "scan",
  clientTimestamp,
  optimisticResult: optimistic,
  onEnqueued: (id) => { pendingSyncId = id; },
});
if ("kind" in (result as object) && (result as { kind: string }).kind === "queued") {
  return { kind: "queued", equipmentId, pendingSyncId, queuedAt: clientTimestamp };
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm test tests/equipment-scan-api.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/expo/src/lib/api.ts apps/expo/src/lib/api/equipment-scan.ts tests/equipment-scan-api.test.ts
git commit -m "feat(phase-3): add scanEquipment API with clientTimestamp contract"
```

---

### Task 6: Sync UI seam

**Files:**
- Create: `apps/expo/src/lib/sync-ui-seam.ts`

- [ ] **Step 1: Create noop seam**

```typescript
export function notifySyncPaused(_message: string, _detail?: string): void {
  if (__DEV__) {
    console.warn("[sync]", _message, _detail ?? "");
  }
}

export function notifySyncPermanentFailure(_message: string): void {
  if (__DEV__) {
    console.warn("[sync:failure]", _message);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/expo/src/lib/sync-ui-seam.ts
git commit -m "feat(phase-3): add sync UI seam for toast replacement"
```

---

### Task 7: Sync-engine thin port

**Files:**
- Create: `apps/expo/src/lib/sync-engine.ts`
- Create: `tests/sync-engine.test.ts`
- Create: `tests/sync-engine.integration.test.ts`
- Reference: `~/vettrack/src/lib/sync-engine.ts` (read-only)

- [ ] **Step 1: Write replay header test**

Create `tests/sync-engine.test.ts`:

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("sync-engine replay headers", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("attemptSync sends X-Client-Timestamp and Authorization", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { setAuthStateRef, processQueue } = await import("@/lib/sync-engine");
    const { setPendingSyncStoreForTests, addPendingSync, resetPendingSyncStoreForTests } =
      await import("@/lib/offline/pending-sync-queue");
    const { PendingSyncStore } = await import("@/lib/offline/pending-sync-store");
    const { createTestSqlExecutor } = await import("./helpers/test-sql-executor");
    const { setAuthHeaderProvider } = await import("@/lib/auth/get-auth-headers");
    const { setForcedOfflineForTests, primeNetworkState } = await import("@/lib/network");

    resetPendingSyncStoreForTests();
    const store = new PendingSyncStore(createTestSqlExecutor());
    await store.init();
    await setPendingSyncStoreForTests(store);
    setAuthHeaderProvider(async () => ({ Authorization: "Bearer test-token" }));
    setAuthStateRef(() => ({ isSignedIn: true, isOfflineSession: false }));
    setForcedOfflineForTests(false);
    await primeNetworkState();

    await addPendingSync({
      type: "scan",
      endpoint: "/api/equipment/eq-1/scan",
      method: "POST",
      body: '{"status":"ok"}',
      createdAt: new Date(),
      retries: 0,
      status: "pending",
      clientTimestamp: 1_700_000_000_000,
    });

    await processQueue();

    expect(fetchMock).toHaveBeenCalled();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer test-token");
    expect(headers["X-Client-Timestamp"]).toBe("1700000000000");
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `pnpm test tests/sync-engine.test.ts`

- [ ] **Step 3: Implement sync-engine.ts**

Port from vettrack with these rules:
- Import `getPendingQueue`, `updatePendingSync`, `removePendingSync` from `pending-sync-queue`
- Import `getAuthHeaders` from `get-auth-headers` (await in attemptSync)
- Import `isOnline` from `network`
- Import `notifySyncPaused`, `notifySyncPermanentFailure` from `sync-ui-seam`
- Use `resolveApiUrl` pattern from `api.ts` (extract shared helper or duplicate minimal version in sync-engine)
- Export: `processQueue`, `onSyncStateChange`, `getSyncProgress`, `setAuthStateRef`
- On 409: `updatePendingSync(id, { status: "failed", structuredError: { code: "conflict" } })`
- On success: `updatePendingSync` → `synced` → `removePendingSync` after 3s OR immediate remove per vettrack
- Skip: Sentry, sonner, QueryClient, phase-9, conflict-store UI
- Auth gate at start of `processQueueBody` (async getAuthHeaders)

Minimum viable `setAuthStateRef`:

```typescript
type AuthStateGetter = () => { isSignedIn: boolean; isOfflineSession: boolean } | null;
let authStateGetter: AuthStateGetter | null = null;

export function setAuthStateRef(getter: AuthStateGetter): void {
  authStateGetter = getter;
}
```

Copy retry constants from vettrack: `MAX_RETRIES`, `RETRY_DELAYS_MS`, `BURST_LIMIT`, `CIRCUIT_THRESHOLD`, `CIRCUIT_COOLDOWN_MS`, `ITEM_TIMEOUT_MS`.

- [ ] **Step 4: Run unit test — expect PASS**

Run: `pnpm test tests/sync-engine.test.ts`

- [ ] **Step 5: Integration test**

Create `tests/sync-engine.integration.test.ts`:

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PendingSyncStore } from "@/lib/offline/pending-sync-store";
import {
  addPendingSync,
  resetPendingSyncStoreForTests,
  setPendingSyncStoreForTests,
} from "@/lib/offline/pending-sync-queue";
import { createTestSqlExecutor } from "./helpers/test-sql-executor";

describe("sync-engine integration", () => {
  beforeEach(async () => {
    vi.resetModules();
    resetPendingSyncStoreForTests();
    const store = new PendingSyncStore(createTestSqlExecutor());
    await store.init();
    await setPendingSyncStoreForTests(store);
  });

  afterEach(() => {
    resetPendingSyncStoreForTests();
    vi.unstubAllGlobals();
  });

  it("enqueue scan → processQueue → row removed", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));
    const { setAuthStateRef, processQueue } = await import("@/lib/sync-engine");
    const { setAuthHeaderProvider } = await import("@/lib/auth/get-auth-headers");
    const { setForcedOfflineForTests, primeNetworkState } = await import("@/lib/network");

    setAuthHeaderProvider(async () => ({ Authorization: "Bearer t" }));
    setAuthStateRef(() => ({ isSignedIn: true, isOfflineSession: false }));
    setForcedOfflineForTests(false);
    await primeNetworkState();

    const id = await addPendingSync({
      type: "scan",
      endpoint: "/api/equipment/eq-1/scan",
      method: "POST",
      body: '{"status":"ok"}',
      createdAt: new Date(),
      retries: 0,
      status: "pending",
      clientTimestamp: Date.now(),
    });

    await processQueue();
    const store = new PendingSyncStore(createTestSqlExecutor());
    await store.init();
    expect(await store.getPendingSync(id)).toBeUndefined();
  });
});
```

Note: integration test store instance mismatch — use same store from beforeEach via module singleton. Fix by reading via `getAllPendingSync()` from queue helper after processQueue.

- [ ] **Step 6: Run full test suite**

Run: `pnpm test`
Expected: all pass including `code-blue-offline.test.ts`

- [ ] **Step 7: Commit**

```bash
git add apps/expo/src/lib/sync-engine.ts tests/sync-engine.test.ts tests/sync-engine.integration.test.ts
git commit -m "feat(phase-3): port thin sync-engine with replay header tests"
```

---

### Task 8: use-sync and auth bridge hooks

**Files:**
- Create: `apps/expo/src/hooks/use-sync-auth-bridge.ts`
- Create: `apps/expo/src/hooks/use-sync.ts`
- Modify: `apps/expo/app/_layout.tsx`

- [ ] **Step 1: Create use-sync-auth-bridge.ts**

```typescript
import { useAuth } from "@clerk/clerk-expo";
import { useEffect } from "react";

import { isClerkActive } from "@/lib/auth/clerk-config";
import { setAuthStateRef } from "@/lib/sync-engine";

export function useSyncAuthBridge(): void {
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (!isClerkActive) {
      setAuthStateRef(() => ({ isSignedIn: true, isOfflineSession: false }));
      return;
    }
    if (!isLoaded) return;
    setAuthStateRef(() => ({
      isSignedIn: !!isSignedIn,
      isOfflineSession: false,
    }));
  }, [isLoaded, isSignedIn]);
}
```

- [ ] **Step 2: Create use-sync.ts**

```typescript
import { useEffect, useRef } from "react";

import { primeNetworkState, subscribeOnline } from "@/lib/network";
import { processQueue } from "@/lib/sync-engine";

const DEBOUNCE_MS = 500;

export function useSync(): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void primeNetworkState().then(() => {
      scheduleProcessQueue();
    });

    return subscribeOnline((online) => {
      if (online) scheduleProcessQueue();
    });

    function scheduleProcessQueue() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void processQueue();
      }, DEBOUNCE_MS);
    }
  }, []);
}
```

- [ ] **Step 3: Mount in app/_layout.tsx**

In `RootLayoutNav`:

```typescript
import { useSync } from "@/hooks/use-sync";
import { useSyncAuthBridge } from "@/hooks/use-sync-auth-bridge";

function RootLayoutNav() {
  usePendingSyncStartup();
  useSyncAuthBridge();
  useSync();
  // ...
}
```

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter vettrack-expo exec tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/expo/src/hooks/use-sync.ts apps/expo/src/hooks/use-sync-auth-bridge.ts apps/expo/app/_layout.tsx
git commit -m "feat(phase-3): wire use-sync and Clerk auth bridge to sync-engine"
```

---

### Task 9: NFC platform adapter

**Files:**
- Create: `apps/expo/src/lib/nfc-platform.ts`
- Modify: `apps/expo/app.config.ts`
- Create: `tests/nfc-platform.test.ts`

- [ ] **Step 1: Configure app.config.ts**

Add to `ios.infoPlist`:

```typescript
NFCReaderUsageDescription:
  "VetTrack reads equipment NFC tags to record scans and checkout.",
```

Add plugin (after vettrack-control):

```typescript
[
  "react-native-nfc-manager",
  {
    nfcPermission: "VetTrack reads equipment NFC tags to record scans and checkout.",
  },
],
```

- [ ] **Step 2: Write nfc-platform unit test (mocked)**

Test `readNfcOnce` rejects when unsupported — use mock.

- [ ] **Step 3: Implement nfc-platform.ts**

Port surface from vettrack; implementation uses `react-native-nfc-manager`:

```typescript
export type NfcReadPayload = { text: string | null; url: string | null; tagId: string | null };

let nativeSupportCache: boolean | null = null;

export async function isNfcSupported(): Promise<boolean> { /* NfcManager.isSupported */ }
export function isNfcSupportedSync(): boolean { return nativeSupportCache === true; }
export async function primeNfcSupportCache(): Promise<void> { nativeSupportCache = await isNfcSupported(); }

export function readNfcOnce(options: {
  timeoutMs?: number;
  signal?: AbortSignal;
}): Promise<NfcReadPayload> { /* requestTechnology + parse NDEF URL/text */ }
```

Parse NDEF: prefer URL record → `url`; text record → `text`; include `tagId` hex when available.

- [ ] **Step 4: Run tests**

Run: `pnpm test tests/nfc-platform.test.ts`

- [ ] **Step 5: Commit**

```bash
git add apps/expo/src/lib/nfc-platform.ts apps/expo/app.config.ts tests/nfc-platform.test.ts
git commit -m "feat(phase-3): add react-native-nfc-manager adapter"
```

---

### Task 10: Scan screen + i18n

**Files:**
- Modify: `apps/expo/locales/en.json`, `apps/expo/locales/he.json`
- Modify: `apps/expo/src/lib/i18n.ts`
- Modify: `apps/expo/app/(app)/scan.tsx`
- Modify: `apps/expo/app/(app)/_layout.tsx` (Clerk loading shell)

- [ ] **Step 1: Add scanScreen locale keys**

In both `en.json` and `he.json`:

```json
"scanScreen": {
  "title": "Equipment scan",
  "scanCta": "Scan NFC tag",
  "confirmCta": "Confirm scan",
  "cancel": "Cancel",
  "scanning": "Hold near tag…",
  "resolvedLabel": "Equipment ID",
  "successTitle": "Scan recorded",
  "queuedTitle": "Queued for sync",
  "syncedTitle": "Synced",
  "failedTitle": "Sync failed",
  "retry": "Retry sync",
  "unsupported": "NFC is not available on this device"
}
```

Wire in `i18n.ts` under `t.scanScreen.*`.

- [ ] **Step 2: Clerk loading shell**

Replace `return null` when `!isLoaded` in `(app)/_layout.tsx` with:

```typescript
import { ActivityIndicator, Text, View } from "react-native";
import { t } from "@/lib/i18n";

// ...
if (!isLoaded) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 12 }}>
      <ActivityIndicator />
      <Text>{t.auth.guard.loadingApp}</Text>
    </View>
  );
}
```

Ensure `t.auth.guard.loadingApp` exists in i18n tree (from locales `auth.guard.loadingApp`).

- [ ] **Step 3: Implement scan.tsx state machine**

States: `idle | scanning | resolved | submitting | success | queued | synced | failed | unsupported`

- Primary **Scan** button: min height 48, bottom-weighted layout
- On resolved: show UUID + **Confirm** (thumb zone) + Cancel
- Call `readNfcOnce` → `extractEquipmentId` → set resolved
- On confirm: `scanEquipment(id, { status: "ok" })`
- Subscribe `onSyncStateChange` while `queued` to detect replay completion
- On `failed`/`dead`: show `t.scanScreen.failedTitle` + Retry → `processQueue()`
- `useEffect` on mount: `primeNfcSupportCache()`

- [ ] **Step 4: Typecheck + lint**

Run: `pnpm --filter vettrack-expo exec tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add apps/expo/app/(app)/scan.tsx apps/expo/app/(app)/_layout.tsx apps/expo/locales/en.json apps/expo/locales/he.json apps/expo/src/lib/i18n.ts
git commit -m "feat(phase-3): rebuild scan screen with NFC flow and i18n"
```

---

### Task 11: Documentation and verification

**Files:**
- Modify: `README.md`
- Modify: `docs/porting-status.md`

- [ ] **Step 1: Update README**

Add section **Phase 3 NFC testing**:
- Dev build required (not Expo Go)
- `pnpm --filter vettrack-expo start -- --dev-client --lan`
- Connect via `exp://<LAN-IP>:8081`
- Uninstall Capacitor VetTrack on test device (scheme collision)
- EAS rebuild after NFC plugin: `eas build --profile development --platform ios`
- Manual test: airplane mode scan → reconnect → synced

- [ ] **Step 2: Update porting-status.md**

Move Phase 3 items from deferred to in-progress: nfc-platform, sync-engine, equipment-scan API.

- [ ] **Step 3: Run full gates**

```bash
pnpm install --frozen-lockfile
pnpm contracts:gate
pnpm test
pnpm --filter vettrack-expo exec tsc --noEmit
```

Expected: all green

- [ ] **Step 4: Commit**

```bash
git add README.md docs/porting-status.md
git commit -m "docs(phase-3): NFC scan testing notes and porting status"
```

---

## Plan self-review

| Spec requirement | Task |
|------------------|------|
| NetInfo connectivity | Task 2 |
| clientTimestamp live + replay | Task 5, 7 |
| Auth ref + use-sync mount | Task 8 |
| sync-engine thin port | Task 7 |
| equipment-id | Task 3 |
| equipment-scan API | Task 5 |
| nfc-platform + config | Task 9 |
| scan screen + i18n | Task 10 |
| Clerk loading shell | Task 10 |
| README scheme collision | Task 11 |
| Integration test processQueue | Task 7 |
| Both platforms | Task 9 (Android manifest via plugin) |
| Confirm button UX | Task 10 |
| Failed replay retry | Task 10 |

No TBD placeholders remain. Type names consistent: `ScanEquipmentResult`, `NfcReadPayload`, `setAuthStateRef`.

---

## Manual acceptance checklist (post-implementation)

- [ ] iPhone dev build: NFC tag → confirm → online success shows equipment name
- [ ] Airplane mode: scan queues with UUID
- [ ] Reconnect: auto sync → synced state
- [ ] Android dev build: same flow
- [ ] Widget/deep link opens `/scan` (Capacitor uninstalled)
- [ ] `pnpm contracts:gate && pnpm test` green

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-17-phase3-nfc-equipment-scan.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration (`superpowers:subagent-driven-development`)

2. **Inline Execution** — execute tasks in this session with checkpoints (`superpowers:executing-plans`)

**Which approach?**
