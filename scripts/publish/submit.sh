#!/usr/bin/env bash
# Submit the latest production build to the App Store / Play Store.
# Usage: scripts/publish/submit.sh <android|ios>
# Prereqs: a finished `production` build, plus store credentials
#   iOS:     Apple Developer account + an App Store Connect app record
#   Android: Google Play Console app + a service-account JSON key
set -euo pipefail
PLATFORM="${1:-}"
[ -z "$PLATFORM" ] && { echo "usage: scripts/publish/submit.sh <android|ios>"; exit 1; }
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "▶️  eas submit --profile production --platform $PLATFORM"
exec npx eas-cli submit --profile production --platform "$PLATFORM"
