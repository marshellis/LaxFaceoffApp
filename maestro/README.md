# Mobile UI tests (Maestro)

This app is tested on **real iOS simulators and Android emulators** with [Maestro](https://maestro.mobile.dev) —
one set of simple YAML "flows" that run identically on both platforms. No paid services, no Claude plugins:
everything needed lives in this repo (`scripts/mobile/` + this folder).

## One-time setup (Mac)

```bash
scripts/mobile/install-maestro.sh   # installs Maestro
scripts/mobile/doctor.sh            # checks Xcode, Android SDK, Java, etc.
```
Fix anything `doctor.sh` flags with ❌. (See the `mobile-test-setup` skill for details.)

## Running the tests

```bash
# 1. Build + install the app onto a booted device (one time per code change):
npx expo run:ios        # iOS simulator
npx expo run:android    # Android emulator

# 2. Run the flows (boots a device automatically if needed):
scripts/mobile/run-flows.sh ios
scripts/mobile/run-flows.sh android
scripts/mobile/run-flows.sh ios maestro/flows/smoke.yaml   # a single flow
```

Screenshots and the on-screen element tree for every step (success **and** failure) are saved to
`maestro/artifacts/<platform>-<timestamp>/`. When a test fails, read the latest screenshot and the
`.json` hierarchy there — it shows whether it was the *wrong selector* or the *wrong screen*.

## The one rule for writing flows: `testID`

A flow finds a button or text by its **`testID`**. In the app code, put a `testID` on anything a test
needs to tap or check:

```tsx
<Pressable testID="start-practice-button" onPress={start}>
  <Text>START</Text>
</Pressable>
```

Then the flow refers to it by `id:` (same word on iOS and Android):

```yaml
- tapOn:
    id: "start-practice-button"
```

Use clear, kebab-case names (`home-screen`, `tab-practice`, `practice-running`). Keep them stable —
a flow breaks if you rename a `testID`.

## Adding a new flow

1. Copy `flows/smoke.yaml` to `flows/<thing-youre-testing>.yaml`.
2. Make sure the components it touches have `testID`s.
3. Run it: `scripts/mobile/run-flows.sh ios maestro/flows/<name>.yaml`.
4. Read the screenshots in `maestro/artifacts/` to confirm it did what you meant.

Maestro flow syntax: `launchApp`, `tapOn`, `inputText`, `assertVisible`, `takeScreenshot`, `scroll`,
`runFlow` (conditional). Full reference: <https://maestro.mobile.dev>.
