---
name: mobile-test-setup
description: Use when setting up a Mac to run this app's iOS and Android UI tests for the first time, or when Maestro, the Android emulator, the iOS simulator, Java, or adb are missing or failing.
---

# Mobile test setup (Mac)

## Overview

This app's UI tests run on a real iOS simulator and Android emulator via **Maestro** (a free,
cross-platform YAML test runner). Everything needed is committed to this repo — no Claude plugins,
no paid services. This skill gets a Mac ready. To actually run tests, use `mobile-test-run`.

## Quick path

```bash
scripts/mobile/install-maestro.sh   # install Maestro (idempotent)
scripts/mobile/doctor.sh            # check the whole toolchain; fix every ❌ it prints
```

`doctor.sh` exits 0 once the cross-platform essentials (Maestro + Java) are present. Per-platform
warnings only block that one platform.

## What each platform needs

| Need | Install | Used for |
|---|---|---|
| **Maestro** | `scripts/mobile/install-maestro.sh` | running flows (both platforms) |
| **Java 17+** | `brew install openjdk@17` | Maestro's CLI is a JVM app |
| **Xcode + an iOS runtime** | App Store, then `sudo xcodebuild -runFirstLaunch`; add a simulator in Xcode > Settings > Components | iOS simulator |
| **Android SDK + an AVD** | Android Studio; create a Pixel 7 / API 34 device in Device Manager | Android emulator |
| **adb + emulator on PATH** | `brew install android-platform-tools`; add `$ANDROID_HOME/emulator` to PATH | Android device control |

## Common mistakes

- **`maestro: command not found` right after install** — the installer puts it at `~/.maestro/bin`
  but doesn't always patch your PATH. Add `export PATH="$HOME/.maestro/bin:$PATH"` to `~/.zshrc`.
- **`emulator: command not found`** — Android Studio installs it but doesn't add it to PATH. Add
  `$ANDROID_HOME/emulator` (usually `~/Library/Android/sdk/emulator`).
- **No iOS simulators listed** — open Xcode once and add an iOS runtime under Settings > Components.
- **Maestro errors about Java** — it needs Java 17+. `brew install openjdk@17` and re-run `doctor.sh`.

## Next step

Once `doctor.sh` is clean, use **mobile-test-run** to build, install, and test the app.
