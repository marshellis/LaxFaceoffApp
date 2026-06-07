---
name: mobile-test-run
description: Use when running this app's automated UI tests on the iOS simulator or Android emulator, capturing app screenshots, writing a new Maestro flow, or debugging a failing mobile UI test.
---

# Mobile test run (iOS + Android)

## Overview

Run the app's Maestro UI flows on a real simulator/emulator and capture screenshots + the on-screen
element tree for every step. One YAML flow runs on **both** platforms. If the toolchain isn't ready,
use `mobile-test-setup` first.

## Run it

```bash
# Build + install the app onto a device (re-run after code changes):
npx expo run:ios        # iOS simulator
npx expo run:android    # Android emulator

# Run flows (auto-boots a device if none is running):
scripts/mobile/run-flows.sh ios
scripts/mobile/run-flows.sh android
scripts/mobile/run-flows.sh ios maestro/flows/smoke.yaml   # one flow
```

Artifacts land in `maestro/artifacts/<platform>-<timestamp>/` — screenshots + a `.json` view
hierarchy per step.

## Writing a flow

A flow selects elements by **`testID`**. Add `testID="start-practice-button"` in the component, then
reference it as `id: "start-practice-button"` in the flow. Copy `maestro/flows/smoke.yaml` as a
template. Full conventions: `maestro/README.md`.

```yaml
appId: com.jljackson222.lacrossefaceofftrainer
---
- launchApp: { clearState: true }
- tapOn: { id: "tab-practice" }
- tapOn: { id: "start-practice-button" }
- assertVisible: { id: "practice-running" }
- takeScreenshot: practice-running
```

## Debugging a failure (read forensics first)

When a flow fails, **look before you theorize**:

1. Open the newest folder in `maestro/artifacts/` — the last screenshot shows the screen it died on.
2. Open that step's `.json` hierarchy — it lists the `testID`s/text actually present.
3. Compare to the selector that failed: present-but-misspelled → wrong selector; absent → wrong screen
   (the previous step didn't navigate where you expected).

This "image/dump-first" habit resolves *wrong selector vs wrong screen* in one step instead of guessing.

## Common mistakes

- **`assertVisible` fails on a brand-new element** — the component has no `testID` yet. Add it.
- **App not found / old build tested** — you changed code but didn't reinstall. Re-run `npx expo run:ios`/`run:android`.
- **Flow passes on Android, fails on iOS (or vice-versa)** — usually a missing `testID` on one
  platform's component, or a platform-only view. Give both the same `testID`.
- **Renamed a `testID` and many flows broke** — selectors are contracts; keep names stable.
