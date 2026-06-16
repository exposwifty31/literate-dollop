#!/usr/bin/env bash
set -euo pipefail
pnpm --filter @vettrack/contracts typecheck
# Add: pnpm test -- packages/contracts  when unit tests exist
