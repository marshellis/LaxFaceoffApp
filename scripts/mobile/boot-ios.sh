#!/usr/bin/env bash
# Boot an iOS simulator and open the Simulator app. macOS + Xcode only.
# Usage: scripts/mobile/boot-ios.sh ["iPhone 15"]
#   Device name defaults to $IOS_SIM, else "iPhone 15".
set -euo pipefail

if [ "$(uname)" != "Darwin" ]; then
  echo "❌ iOS simulators require macOS. Use Android on this machine."
  exit 1
fi
if ! xcrun simctl help >/dev/null 2>&1; then
  echo "❌ Xcode command-line tools missing. Install Xcode from the App Store, then:"
  echo "   sudo xcodebuild -runFirstLaunch"
  exit 1
fi

DEVICE="${1:-${IOS_SIM:-iPhone 15}}"

# Find the UDID of an available simulator whose name matches DEVICE.
UDID="$(xcrun simctl list devices available | grep -m1 "$DEVICE (" | grep -oE "[0-9A-Fa-f-]{36}" || true)"
if [ -z "$UDID" ]; then
  echo "❌ No available simulator named '$DEVICE'."
  echo "   Available devices:"
  xcrun simctl list devices available | grep -E "iPhone|iPad" || true
  echo "   Set a different one: IOS_SIM='iPhone 16' scripts/mobile/boot-ios.sh"
  exit 1
fi

STATE="$(xcrun simctl list devices | grep "$UDID" | grep -oE "Booted|Shutdown" | head -n1 || true)"
if [ "$STATE" != "Booted" ]; then
  echo "▶️  Booting simulator: $DEVICE ($UDID)"
  xcrun simctl boot "$UDID"
else
  echo "✅ Simulator already booted: $DEVICE ($UDID)"
fi

open -a Simulator
# Give the UI a moment to come up.
xcrun simctl bootstatus "$UDID" -b >/dev/null 2>&1 || true
echo "✅ iOS simulator ready: $DEVICE ($UDID)"
