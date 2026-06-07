#!/usr/bin/env bash
# Build a native binary in the cloud with EAS.
# Usage: scripts/publish/build.sh <development|preview|production> <android|ios|all>
#   development → installable dev client (test native modules on your phone; no local NDK needed!)
#   preview     → internal ad-hoc build to share/sideload
#   production  → store-ready binary (App Store / Play Store)
set -euo pipefail
PROFILE="${1:-development}"
PLATFORM="${2:-all}"
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "▶️  eas build --profile $PROFILE --platform $PLATFORM"
echo "   (requires 'npx eas-cli login'. Runs in the cloud — no local Android NDK/Xcode build needed.)"
exec npx eas-cli build --profile "$PROFILE" --platform "$PLATFORM"
