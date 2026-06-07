#!/usr/bin/env bash
# Run the app's Maestro UI flows on a target platform, booting the device first and
# capturing screenshots + the view hierarchy (including on failure) into maestro/artifacts/.
#
# Usage: scripts/mobile/run-flows.sh <ios|android> [flow-file-or-dir]
#   flow defaults to the whole maestro/flows/ directory.
#
# Prereq: the app must already be installed on the device. Build + install it with:
#   npx expo run:ios      (installs to the booted iOS simulator)
#   npx expo run:android  (installs to the booted Android emulator)
set -euo pipefail

PLATFORM="${1:-}"
FLOW="${2:-maestro/flows}"
. "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_env.sh"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

if [ -z "$PLATFORM" ]; then
  echo "usage: scripts/mobile/run-flows.sh <ios|android> [flow-file-or-dir]"
  exit 1
fi
if ! command -v maestro >/dev/null 2>&1; then
  echo "❌ Maestro not installed → run scripts/mobile/install-maestro.sh"
  exit 1
fi

case "$PLATFORM" in
  ios)     "$SCRIPT_DIR/boot-ios.sh" ;;
  android) "$SCRIPT_DIR/boot-android.sh" ;;
  *)       echo "❌ platform must be 'ios' or 'android'"; exit 1 ;;
esac

TS="$(date +%Y%m%d-%H%M%S)"
OUT="maestro/artifacts/${PLATFORM}-${TS}"
mkdir -p "$OUT"

echo "▶️  Running Maestro flows: $FLOW"
echo "    Debug output (screenshots + view hierarchy): $OUT"
# --debug-output captures the screen + UI hierarchy on every step, success or failure —
# this is our "failure forensics": on a failed assertion, read the last screenshot and
# the *.json hierarchy in $OUT to see exactly which screen/selector was wrong.
set +e
maestro test --debug-output "$OUT" "$FLOW"
status=$?
set -e

if [ "$status" -eq 0 ]; then
  echo "✅ Flows passed. Artifacts in $OUT"
else
  echo "❌ Flows failed (exit $status)."
  echo "   Read the latest screenshot + view hierarchy in: $OUT"
  echo "   The view hierarchy (.json) tells you 'wrong selector' vs 'wrong screen' fastest."
fi
exit "$status"
