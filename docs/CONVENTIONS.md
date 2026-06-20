# CONVENTIONS.md

> Agents: follow these conventions in every file you touch.
> Do not introduce new patterns — extend them only via `docs/DECISIONS.md` or `docs/adr/`.
> Document what IS, not what you wish were true.

---

## Guiding Principle

Consistency beats cleverness. When in doubt, match what already exists in the file you are editing.

---

## Language and Runtime

**Language:** TypeScript ~6.0
**Minimum version:** TypeScript 6.0 — do not use syntax removed in or before TS 5.x
**Strictness:** `strict: true` in all `tsconfig.json` files
**React Native:** Expo SDK (managed workflow); do not use bare workflow APIs
**Node tooling:** pnpm 9.15.9 workspaces only — no npm or yarn commands

---

## Naming

| Construct | Convention | Example |
|-----------|-----------|---------|
| Variables | `camelCase` | `tagId`, `isOffline`, `pendingOp` |
| Functions / methods | `camelCase`, verb-first | `getEquipmentByTagId`, `assertEnqueueAllowed` |
| React components | `PascalCase` | `ScanScreen`, `EquipmentDetail` |
| Types / interfaces | `PascalCase` | `PendingSync`, `EquipmentRecord` |
| Constants (module-level) | `SCREAMING_SNAKE` | `MAX_RETRY_COUNT`, `EMERGENCY_OFFLINE_BLOCK_MUTATIONS` |
| Files (non-component) | `kebab-case` | `nfc-platform.ts`, `pending-sync-store.ts` |
| Files (screen/component) | `PascalCase` or Expo Router convention | `scan.tsx`, `[tagId].tsx` |
| Directories | `kebab-case` | `shift-chat/`, `nfc-platform/` |
| Test files | same name + `.test` | `nfc-platform.test.ts` |
| Boolean variables | `is` / `has` / `can` prefix | `isOnline`, `hasPermission`, `canQueue` |
| i18n keys | `feature.component.element` | `equipment.scan.prompt`, `common.offline.banner` |

**Rules:**
- Do not abbreviate unless the abbreviation is universal in veterinary or RN contexts (`nfc`, `id`, `api`).
- Boolean parameters are a smell — use named options objects instead.
- Query functions: `get*` for async data fetches, `is*`/`has*` for synchronous boolean checks.
- Never use `I` prefix on interfaces (`UserRecord`, not `IUserRecord`).

---

## File and Module Structure

Internal layout for a typical service module:

```
1. External imports (alphabetical by package name)
2. Internal imports (by depth — shallowest alias first: @vettrack/contracts, then @/lib/*, @/types/*)
3. Module-level constants (SCREAMING_SNAKE)
4. Local types (not exported from this file)
5. Exported functions / classes
6. Private helpers (not exported — at bottom of file)
```

**One concern per file.** When a file exceeds ~200 lines, consider whether it is doing two distinct things. Split by responsibility, not by line count.

---

## Exports

- **Named exports only** — no default exports (exception: Expo Router screen files require default export for the framework).
- Never `export *` — explicit re-exports only.
- Re-export from an index only if the module is a deliberate public API (`packages/contracts/src/index.ts`).

---

## Functions

- **Size:** If a function needs a comment to explain what it does, extract a named sub-function.
- **Parameters:** Maximum 3 positional; use an options object after that.
- **Return types:** Always annotate exported functions. Optional on private functions when obvious from context.
- **Boolean parameters:** Prohibited — use separate functions or options objects.
- **Async:** Only make a function `async` if it contains at least one `await` expression.

---

## Error Handling

**Philosophy:** Expected failures use a Result type. Invariant violations throw. Errors are never silently swallowed.

**Expected failure pattern:**
```typescript
type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };

export async function getEquipmentByTagId(tagId: string): Promise<Result<Equipment>> {
  try {
    const record = await api.get(`/equipment/${tagId}`);
    return { ok: true, value: record };
  } catch (err) {
    return { ok: false, error: `Equipment ${tagId} not found: ${String(err)}` };
  }
}
```

**Invariant violation pattern (throw):**
```typescript
// This must never happen — throw immediately with context
if (!clinicId) {
  throw new Error(`Cannot queue sync op: clinicId missing from auth context`);
}
```

**Prohibited:**
- Empty catch blocks.
- `catch (e) { console.log(e); }` without re-throwing or returning a failure.
- Generic messages: `"Something went wrong"`, `"Invalid input"`.

---

## Comments

- Write **why**, not **what**. Comments that restate what the code does are noise.
- No multi-line comment blocks or JSDoc for obvious functions.
- One-line comments only, and only when the WHY is non-obvious: a hidden constraint, a safety invariant, or a workaround for a specific upstream bug.
- The Code Blue enforcement order (`classifyEmergencyEndpoint → assertEnqueueAllowed → addPendingSync`) must be accompanied by a brief comment stating it is a frozen safety invariant.

---

## Async / Concurrency

- Use `async/await` over `.then()` chains.
- Do not make a function `async` if it has no `await` expression.
- Use `Promise.all()` for independent parallel operations; never chain sequentially when order does not matter.

---

## i18n

- All user-visible copy lives in `locales/en.json` and `locales/he.json`.
- Access via the typed `t()` accessor from `@/lib/i18n`.
- Hebrew is the default locale; always add both `en` and `he` entries together.
- Key format: `feature.component.element` — e.g. `equipment.scan.prompt`.
- Never hardcode copy in component JSX, error messages shown to users, or push notification payloads.

---

## Testing Conventions

- **File location:** Co-located with the module (`nfc-platform.ts` → `nfc-platform.test.ts`) or in `tests/` for integration tests.
- **Naming:** Plain sentences describing expected behaviour: `"returns tag ID when scan succeeds"`, `"throws when permission denied"`.
- **Structure:** AAA — Arrange, Act, Assert — one block each.
- **Coverage requirement:** Every new exported function needs tests for success path + at least one failure path.
- **Prohibited in tests:** `expect(true).toBe(true)`, tests that assert only that code ran without throwing, commented-out test cases.

---

## Git

**Commit message format:**
```
type(scope): short description in imperative mood (max 72 chars)

- Why this change was needed
- What approach was taken and why
- Refs TASK-[N] if applicable

Types: feat | fix | refactor | test | docs | chore | perf
```

**Branch naming:** `type/short-description`
Examples: `feat/nfc-adapter`, `fix/pending-sync-startup`, `chore/upgrade-expo-sdk`

**Before every commit:**
- `pnpm test` green
- `tsc --noEmit` green
- `pnpm contracts:gate` green if contracts changed

**Never commit:**
- `.env` or any secrets
- `console.log` / debug statements
- Commented-out code
- TODO placeholders

---

## What Is Deliberately Not Listed Here

- No Prettier — formatting handled by TypeScript conventions and ESLint.
- No Husky hooks — CI enforces quality gates.
- No barrel (`index.ts`) files in feature directories — they cause circular import issues.
- No `I` prefix on interfaces — TypeScript convention in this codebase is plain `PascalCase`.
