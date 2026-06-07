#!/usr/bin/env bash
# Push an over-the-air JS/asset update (no store review) to a release channel's branch.
# Usage: scripts/publish/update.sh <branch> "<message>"
#   branch is usually the channel name: production | preview | development
# Only JS/asset changes ship this way — native changes require a new build + store submit.
# EAS Update only delivers to builds whose runtime fingerprint matches (see runtimeVersion policy).
set -euo pipefail
BRANCH="${1:-preview}"
MSG="${2:-update}"
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "▶️  eas update --branch $BRANCH --message \"$MSG\""
exec npx eas-cli update --branch "$BRANCH" --message "$MSG"
