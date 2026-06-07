#!/usr/bin/env bash
# Resolve JAVA_HOME + ANDROID_HOME by probing common macOS locations, so the mobile
# scripts work even when a JDK is installed but not on PATH (e.g. Homebrew openjdk is
# keg-only; Android Studio ships a bundled JBR). Source this from other scripts:
#   . "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_env.sh"

# --- Java (Maestro CLI + Gradle need a JDK 17+) ---
if [ -z "${JAVA_HOME:-}" ] || [ ! -x "${JAVA_HOME:-}/bin/java" ]; then
  for _cand in \
    "$(/usr/libexec/java_home -v 17 2>/dev/null)" \
    "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home" \
    "/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home" \
    "/Applications/Android Studio.app/Contents/jbr/Contents/Home" \
    "/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"; do
    if [ -n "$_cand" ] && [ -x "$_cand/bin/java" ]; then
      export JAVA_HOME="$_cand"
      break
    fi
  done
fi
[ -n "${JAVA_HOME:-}" ] && [ -x "$JAVA_HOME/bin/java" ] && export PATH="$JAVA_HOME/bin:$PATH"

# --- Android SDK ---
if [ -z "${ANDROID_HOME:-}" ]; then
  for _cand in \
    "$HOME/Library/Android/sdk" \
    "$HOME/Android/Sdk" \
    "/opt/homebrew/share/android-commandlinetools"; do
    [ -d "$_cand" ] && export ANDROID_HOME="$_cand" && break
  done
fi
[ -n "${ANDROID_HOME:-}" ] && export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"

# --- Maestro on PATH ---
[ -d "$HOME/.maestro/bin" ] && export PATH="$HOME/.maestro/bin:$PATH"

unset _cand
