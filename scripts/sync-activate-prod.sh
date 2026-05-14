#!/usr/bin/env bash
# Mirror the latest `main` content to the secondary repo with local-only files removed.
#
# Usage:
#   ./scripts/sync-activate-prod.sh ["optional commit message"]
#
# Maintains a local `prod` branch that tracks the secondary repo's `main`.

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

# Strip files that should not exist on the secondary repo.
rm -f scripts/sync-activate-prod.sh base_idea.md
rmdir scripts 2>/dev/null || true

# Apply text scrubs to neutralize project-history references.
if [ -f README.md ]; then
  sed -i 's/^Built for a hackathon — uses /Uses /' README.md
fi
if [ -f supabase/config.toml ]; then
  sed -i 's/^project_id = "anakinhackathon"$/project_id = "stockstrike"/' supabase/config.toml
fi
for f in supabase/migrations/*.sql; do
  [ -f "$f" ] || continue
  sed -i 's/^-- Hackathon scope: server-side access via service role only\.$/-- Server-side access via service role only./' "$f"
done

git add -A

if git diff --cached --quiet; then
  echo "prod is already in sync with main. Nothing to commit."
  exit 0
fi

git commit -m "$MSG"
git push activate-prod prod:main
echo "Synced."
