#!/usr/bin/env bash
# Publish doctor: checks the EAS native-publishing pipeline (build / submit / update)
# is ready. Safe + fast — never triggers a large download. Run any time.
set -uo pipefail
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

pass() { echo "✅ $1"; }
warn() { echo "⚠️  $1"; }
miss() { echo "❌ $1"; }
fail=0

echo "── EAS CLI ─────────────────────────────────────────"
if command -v eas >/dev/null 2>&1; then
  pass "eas (global): $(eas --version 2>/dev/null | tail -1)"
  EAS="eas"
elif npx --no-install eas-cli --version >/dev/null 2>&1; then
  pass "eas-cli (npx, cached): $(npx --no-install eas-cli --version 2>/dev/null | tail -1)"
  EAS="npx --no-install eas-cli"
else
  warn "eas-cli not installed. It'll be fetched on first 'npx eas-cli ...', or install: npm i -g eas-cli"
  EAS=""
fi

echo "── Expo account (login required to build/submit/update) ──"
if [ -n "${EXPO_TOKEN:-}" ]; then
  pass "EXPO_TOKEN set (non-interactive auth)"
elif [ -n "$EAS" ] && who="$($EAS whoami 2>/dev/null | tail -1)" && [ -n "$who" ] && [[ "$who" != *"Not logged in"* ]]; then
  pass "Logged in as: $who"
else
  miss "Not logged in → run: npx eas-cli login   (or set EXPO_TOKEN). REQUIRED for build/submit/update."
  fail=1
fi

echo "── Project config ──────────────────────────────────"
if python3 -c "import json,sys; json.load(open('eas.json'))" 2>/dev/null; then
  pass "eas.json is valid JSON"
  for p in development preview production; do
    grep -q "\"$p\"" eas.json && pass "  build profile: $p" || warn "  build profile '$p' missing"
  done
else
  miss "eas.json is missing or invalid JSON"; fail=1
fi
grep -q '"projectId"' app.json && pass "app.json has EAS projectId" || { miss "app.json missing extra.eas.projectId"; fail=1; }
grep -q '"owner"' app.json && pass "app.json has owner: $(grep '"owner"' app.json | sed 's/.*: *"//;s/".*//')" || warn "app.json has no owner"
grep -q 'u.expo.dev' app.json && pass "EAS Update URL configured" || warn "no updates.url (OTA disabled)"
grep -q 'expo-updates' package.json && pass "expo-updates installed (OTA)" || warn "expo-updates not installed"

echo "────────────────────────────────────────────────────"
if [ "$fail" -eq 0 ]; then
  echo "✅ Publishing pipeline configured. Next: scripts/publish/build.sh development android"
else
  echo "❌ Fix the ❌ lines (almost always: 'npx eas-cli login'), then re-run."
fi
echo "ℹ️  Store submission also needs: Apple Developer account + App Store Connect app (iOS),"
echo "    and a Google Play Console app + service-account key (Android). See docs/PUBLISHING.md."
