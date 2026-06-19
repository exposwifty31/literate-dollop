# Contracts Bump Runbook

**When:** Any PR that changes `packages/contracts/src/**`.  
**Why:** vettrack monolith installs `@vettrack/contracts` via a `github:` path dep pointing at this repo. Silent drift between the two sides breaks the Code Blue safety invariant.

---

## Step-by-step

### 1. Make and verify the contracts change

```bash
cd ~/literate-dollop
# edit packages/contracts/src/...
pnpm contracts:gate          # must stay green
pnpm --filter @vettrack/contracts typecheck
pnpm test                    # code-blue-offline.test.ts + contracts/ tests must pass
```

### 2. Bump the version

Edit `packages/contracts/package.json` — increment the semver patch (or minor for new exports).

### 3. Commit and push to main

The contracts gate runs in CI on every push. Merge to `main` only when CI is green.

### 4. Open a vettrack companion issue/PR

In `exposwifty31/vettrack`, update `package.json`:

```json
"@vettrack/contracts": "github:exposwifty31/literate-dollop#path:packages/contracts&branch=main"
```

Then in vettrack:

```bash
pnpm install
bash scripts/ci/contracts-gate.sh    # must be green
npx tsc --noEmit
```

This can be done immediately after the literate-dollop merge hits `main`.

### 5. Parity spot-check (after vettrack bump lands)

```bash
diff -u ~/literate-dollop/packages/contracts/src/emergency.ts \
        ~/vettrack/node_modules/@vettrack/contracts/src/emergency.ts

diff -u ~/literate-dollop/packages/contracts/src/pending-sync.ts \
        ~/vettrack/node_modules/@vettrack/contracts/src/pending-sync.ts
# Both diffs must be empty
```

---

## PR checklist item

Add to any PR description that touches contracts:

```
- [ ] `pnpm contracts:gate` green
- [ ] `packages/contracts` version bumped
- [ ] vettrack companion issue/PR opened to bump `github:` dep
- [ ] Parity spot-check will be run after vettrack installs the new version
```

---

## What must never change without this runbook

| Surface | Risk if missed |
|---------|----------------|
| `emergency.ts` — `EMERGENCY_OFFLINE_BLOCK_MUTATIONS` | Code Blue mutations queue offline in Expo — safety incident |
| `emergency.ts` — `classifyEmergencyEndpoint` | Emergency classifier skipped in Expo — silent safety regression |
| `pending-sync.ts` — `PendingSyncType` | Expo enqueues unknown mutation types; vettrack replay rejects them |

---

## Symmetric runbook in vettrack

vettrack has (or will have) `docs/contracts-bump-discipline.md` (P1-9 in its improvement plan). The two runbooks should stay consistent. If vettrack adds a new `EMERGENCY_OFFLINE_BLOCK_MUTATIONS` path, that change must flow here immediately.
