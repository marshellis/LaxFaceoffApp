# 🥍 Lacrosse Face-off Trainer

A cross-platform (iOS + Android, with a web build) app that helps lacrosse players practice
face-off timing and reaction speed with randomized audio cue sequences. Built with React Native +
Expo, designed to be contributed to by AI agents **and** a kid just learning to code.

## Drills
- **Down · Set · Whistle** — the traditional face-off sequence with randomized gaps so you can't anticipate.
- **Rapid Clamp** — repeated whistles for clamp reps.
- **Three Whistle (Clamp · Pull · Pop)** — a three-cue sequence with a reset pause.

Timing ranges and rep counts are configurable per drill. You can record your own voice/whistle sounds.

## Why the rewrite (the important bit)
The cue timing now runs on the **hardware audio clock** (`AudioContext.currentTime` via
`react-native-audio-api`), not JavaScript `setTimeout`. The old app's setTimeout/polling engine drifted
between debug and release builds — fatal for a reaction-timing tool. The audio **session** is also
configured with the correct current `expo-audio` / `react-native-audio-api` APIs (the old code passed
stale `expo-av` keys that were silently ignored), and recording now switches the session to a
record-capable category and restores loud playback afterward.

## Tech stack
- **Expo SDK 54**, React Native 0.81, React 19, New Architecture
- **TypeScript** + **Expo Router** (file-based routing)
- **Zustand** + **react-native-mmkv** (state + persistence)
- **react-native-audio-api** (clock-accurate audio) + **expo-audio** (recording) + **expo-speech** (Down/Set TTS)
- **Biome** (lint+format), **Jest** + jest-expo (unit), **Maestro** (on-device E2E), **GitHub Actions** (CI)

## Run it
This app has native modules, so it runs on a **development build** (not Expo Go):
```bash
npm install
npx expo run:ios        # iOS simulator
npx expo run:android    # Android emulator (one-time SDK top-up — see docs/BUILD_AND_TEST.md)
npx expo start --web    # web preview
```

## Test it
```bash
npm test            # unit tests (pure timing/stats logic)
npm run typecheck   # tsc
npm run lint        # Biome
scripts/mobile/doctor.sh                 # check the iOS/Android test toolchain
scripts/mobile/run-flows.sh ios          # Maestro UI flows on a simulator/emulator
```
The mobile test harness is fully in-repo (no Claude plugins needed) — see `maestro/README.md` and the
`mobile-test-setup` / `mobile-test-run` skills. Device build details: `docs/BUILD_AND_TEST.md`.

## Project structure
```
app/                 Expo Router screens (a file = a screen)
  (tabs)/            Home, Practice (selection→session), Activity, Settings (stack)
src/
  practice/          Pure cue-timing logic (types, rng, timeline, runner) — fully unit-tested
  audio/             AudioEngine (clock scheduling), session config, useAudioEngine hook
  state/             Zustand stores + pure helpers (defaults, history stats)
  storage/           MMKV persistence adapter
  theme/             Colors
scripts/mobile/      Vendored Maestro + emulator/simulator harness
maestro/flows/       Cross-platform UI test flows
legacy/              The pre-rewrite app — kept ONLY as a porting reference; never imported
docs/                Rebuild plan + build/test guide
```

## Contributing
See **`AGENTS.md`** — conventions for humans and AI agents (TypeScript, small files, thin screens,
tested pure logic, stable `testID`s, never sequence audio with setTimeout). The implementation plan is
in `docs/superpowers/plans/`.

## License
MIT. Made with ❤️ for lacrosse players (and one in particular).
