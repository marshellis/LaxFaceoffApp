#!/usr/bin/env bash
# Boot an Android emulator and wait until it is fully ready for tests.
# Usage: scripts/mobile/boot-android.sh [AVD_NAME]
#   AVD_NAME defaults to $ANDROID_AVD, else the first AVD found.
set -euo pipefail

. "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_env.sh"

if ! command -v emulator >/dev/null 2>&1; then
  echo "❌ 'emulator' not found. Install Android Studio + SDK and add \$ANDROID_HOME/emulator to PATH."
  echo "   See the mobile-test-setup skill."
  exit 1
fi
if ! command -v adb >/dev/null 2>&1; then
  echo "❌ 'adb' not found. brew install android-platform-tools"
  exit 1
fi

# Already have a running emulator? Reuse it.
if adb devices | grep -qE "emulator-[0-9]+\s+device"; then
  echo "✅ An Android emulator is already running:"
  adb devices | grep emulator
  exit 0
fi

AVD="${1:-${ANDROID_AVD:-}}"
if [ -z "$AVD" ]; then
  AVD="$(emulator -list-avds | head -n1 || true)"
fi
if [ -z "$AVD" ]; then
  echo "❌ No AVD found. Create one in Android Studio > Device Manager (Pixel 7, API 34)."
  exit 1
fi

echo "▶️  Booting AVD: $AVD"
nohup emulator -avd "$AVD" -no-snapshot-load -no-boot-anim >"/tmp/emulator-${AVD}.log" 2>&1 &

echo "⏳ Waiting for device..."
adb wait-for-device
echo "⏳ Waiting for boot to complete..."
until [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do
  sleep 2
done
adb shell input keyevent 82 >/dev/null 2>&1 || true  # dismiss lock screen
echo "✅ Android emulator ready: $AVD"
adb devices | grep emulator
