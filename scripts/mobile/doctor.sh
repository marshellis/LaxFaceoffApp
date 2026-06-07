#!/usr/bin/env bash
# Mobile testing doctor: checks that everything needed to run iOS + Android UI tests
# is installed on this Mac. Prints a status line per tool with a fix hint, and exits
# non-zero if a cross-platform essential (Maestro or Java) is missing.
#
# Usage: scripts/mobile/doctor.sh
set -uo pipefail

# Auto-discover JAVA_HOME / ANDROID_HOME (Homebrew openjdk is keg-only; Android Studio ships a JBR).
. "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_env.sh"

ok=0
fail=0
pass() { echo "✅ $1"; }
warn() { echo "⚠️  $1"; }
miss() { echo "❌ $1"; }

echo "── Cross-platform essentials ─────────────────────────────"

# Java 17+ — Maestro's CLI is a JVM app. NOTE: macOS ships a /usr/bin/java stub that exists
# on PATH even with no JDK, so we must actually RUN it, not just check `command -v`.
if jver="$(java -version 2>&1)" && ! printf '%s' "$jver" | grep -qi "unable to locate"; then
  java_ok=1
  pass "Java: $(printf '%s' "$jver" | head -n1)"
else
  java_ok=0
  miss "Java missing → run: brew install openjdk@17 (Maestro needs a JDK to run)"
  fail=1
fi

# Maestro (test runner) — works for both platforms. It only really works if Java is present,
# so verify it actually produces a version string (a bare launcher with no JDK prints nothing).
export PATH="$HOME/.maestro/bin:$PATH"
mver="$(maestro --version 2>/dev/null | head -n1 || true)"
if command -v maestro >/dev/null 2>&1 && [ -n "$mver" ]; then
  pass "Maestro: $mver"
elif command -v maestro >/dev/null 2>&1 && [ "$java_ok" -eq 0 ]; then
  miss "Maestro installed but can't run → fix Java above (Maestro is a JVM app)"
  fail=1
else
  miss "Maestro missing → run: scripts/mobile/install-maestro.sh"
  fail=1
fi

# Node — to build the app.
if command -v node >/dev/null 2>&1; then
  pass "Node: $(node --version)"
else
  warn "Node missing → install Node 20 LTS (https://nodejs.org)"
fi

echo "── Apple / iOS (requires macOS + Xcode) ──────────────────"
if [ "$(uname)" = "Darwin" ]; then
  if xcrun simctl help >/dev/null 2>&1; then
    pass "Xcode simctl available"
    runtimes="$(xcrun simctl list runtimes 2>/dev/null | grep -c iOS || true)"
    if [ "${runtimes:-0}" -gt 0 ]; then
      pass "iOS runtimes installed: $runtimes"
    else
      warn "No iOS runtimes → open Xcode > Settings > Components and add an iOS simulator"
    fi
  else
    miss "Xcode tools missing → install Xcode from the App Store, then: xcodebuild -runFirstLaunch"
  fi
else
  warn "Not macOS — iOS simulator testing is unavailable on this machine (Android still works)"
fi

echo "── Android ───────────────────────────────────────────────"
if command -v adb >/dev/null 2>&1; then
  pass "adb: $(adb version 2>/dev/null | head -n1)"
else
  miss "adb missing → brew install android-platform-tools (or install Android Studio)"
fi
if command -v emulator >/dev/null 2>&1; then
  pass "emulator on PATH"
  avds="$(emulator -list-avds 2>/dev/null | grep -c . || true)"
  if [ "${avds:-0}" -gt 0 ]; then
    pass "AVDs available: $(emulator -list-avds 2>/dev/null | tr '\n' ' ')"
  else
    warn "No AVDs → create one in Android Studio > Device Manager (Pixel 7, API 34)"
  fi
else
  warn "emulator not on PATH → add \$ANDROID_HOME/emulator to PATH (Android Studio installs it)"
fi

echo "──────────────────────────────────────────────────────────"
if [ "$fail" -eq 0 ]; then
  echo "✅ Cross-platform essentials present. Per-platform warnings above (if any) only block that platform."
  exit 0
else
  echo "❌ A cross-platform essential is missing. Fix the ❌ lines above, then re-run."
  exit 1
fi
