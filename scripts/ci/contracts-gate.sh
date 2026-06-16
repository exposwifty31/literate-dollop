#!/usr/bin/env bash
set -euo pipefail
pnpm --filter @vettrack/contracts typecheck
pnpm test -- packages/contracts tests/contracts
