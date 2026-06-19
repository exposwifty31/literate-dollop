#!/usr/bin/env bash
# Refuses dirty git trees, runs CI-parity verify, optionally invokes eas build.
# Intended for the ship worktree (/Users/dan/literate-dollop-ship) on main.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

VERIFY_ONLY=0
PROFILE=""
PLATFORM="ios"

usage() {
  cat <<'EOF'
Usage: scripts/eas-build-from-clean-tree.sh [options]

Options:
  --verify-only          Run CI parity gates only (no eas build)
  --profile <name>       EAS profile: development | preview | production (required unless --verify-only)
  --platform <name>      ios | android | all (default: ios)

Exits non-zero if git working tree is dirty or any gate fails.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --verify-only)
      VERIFY_ONLY=1
      shift
      ;;
    --profile)
      PROFILE="${2:-}"
      shift 2
      ;;
    --platform)
      PLATFORM="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ "$VERIFY_ONLY" -eq 0 && -z "$PROFILE" ]]; then
  echo "error: --profile is required unless --verify-only is set" >&2
  usage >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "error: git working tree is dirty — commit or stash before ship-lane verify/build" >&2
  git status --short >&2
  exit 1
fi

echo "==> ship lane verify @ $(git rev-parse --short HEAD) ($(git branch --show-current))"
pnpm install --frozen-lockfile
bash scripts/ci/contracts-gate.sh
pnpm --filter @vettrack/contracts exec tsc --noEmit
pnpm --filter vettrack-expo exec tsc --noEmit
pnpm test

if [[ "$VERIFY_ONLY" -eq 1 ]]; then
  echo "==> verify-only: all gates passed"
  exit 0
fi

echo "==> eas build --profile $PROFILE --platform $PLATFORM"
cd apps/expo
eas build --profile "$PROFILE" --platform "$PLATFORM"
