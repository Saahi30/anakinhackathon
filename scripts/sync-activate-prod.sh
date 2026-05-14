#!/usr/bin/env bash
# Mirror the latest `main` content to the `activate-prod` repo.
#
# Usage:
#   ./scripts/sync-activate-prod.sh ["optional commit message"]
#
# Workflow:
#   - You commit & push to origin (anakinhackathon) as usual on `main`.
#   - When you want to mirror the current state to activate-prod, run this.
#   - It checks out the local `prod` branch (the v1..v5 base + prior syncs),
#     overlays main's working tree, commits, and pushes to activate-prod.
#   - Original repo (origin/anakinhackathon) is never touched.

set -euo pipefail

MSG="${1:-feat: sync $(date +%Y-%m-%d)}"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Working tree is dirty. Commit or stash first." >&2
  exit 1
fi

START_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

cleanup() {
  git checkout "$START_BRANCH" >/dev/null 2>&1 || true
}
trap cleanup EXIT

git checkout prod
git checkout main -- .
git add -A

if git diff --cached --quiet; then
  echo "prod is already in sync with main. Nothing to commit."
  exit 0
fi

git commit -m "$MSG"
git push activate-prod prod:main
echo "Synced. activate-prod main now matches origin/main content."
