# Follow-ups (known minors + residual work)

The rebuild's Phase 1–5 are complete and code-review-clean (Critical + Important findings fixed).
These are the deliberately-deferred items — small, safe, and good "starter" tasks for a new
contributor (including a kid learning with an AI agent).

## Recently resolved (code review minors + cleanups)
- **SDK 58 upgrade (Nov 2026)** — Expo 54 → 58, RN 0.81 → 0.88, React 19.3, TypeScript 6, Jest 30,
  Node 22 in CI. Unused deps removed (`@react-navigation/*`, async-storage, expo-speech); native
  peers (`react-native-worklets`, `react-native-nitro-modules`) made direct deps; icons moved to
  `@react-native-vector-icons/ionicons`; obsolete app.json fields dropped; `legacy/` deleted.
- **Custom sounds survived only until the next app update** — they were stored as absolute
  cache paths. Now copied into documents and stored by name (`src/audio/customSoundFiles.ts`).
- **A locked phone logged phantom sessions** — the session screen now keeps the screen awake and
  stops if the app is backgrounded.
- **Android content under the status bar** — screens now use safe-area-context insets.

- **M5 / M6** — completion + recorded `durationSec` now come from the timeline (single-clock
  session), so the `threeWhistle` reset-pause tail is honored and a backgrounded thread can't skew
  the stat.
- **`@/` path alias** — `app/` and `src/` now import via `@/src/...` instead of `../../../src/...`.
- **Audio-load error state** — a failed buffer load now shows a "Tap to retry" button
  (`useAudioEngine` exposes `error`) instead of a button stuck on "LOADING…".

## Residual setup (environment, not code)

- **On-device build** — one-time Android SDK top-up (NDK + `platforms;android-37` + CMake) then
  `npx expo run:android|ios`. See `docs/BUILD_AND_TEST.md`. iOS sim needs no extra downloads.
- **Audio parity listen-test** — build debug + release, run a Down-Set-Whistle set on each, confirm
  cue spacing matches (it should: all three cues now schedule on `AudioContext.currentTime`).
- **Live web QA** — `npx expo start --web` and click through; audio starts on the first user gesture
  (autoplay policy). The web build compiles; it hasn't been hand-exercised in a browser yet.

## Starter tasks
- **`TouchableOpacity` → `Pressable`** in `app/(tabs)/index.tsx` and `practice/session.tsx` (the
  rest of the app already uses `Pressable`).
- **Liquid Glass app icon** — make an Icon Composer `.icon` file and point `ios.icon` at it.
- **expo-doctor's one warning** (`@expo/config-plugins` installed directly) is expected:
  `react-native-audio-api`'s config plugin still imports it. Remove the dev dependency once that
  library switches to `expo/config-plugins`.

## Bigger optional directions (Phase 6, only if wanted — currently YAGNI)

- Family accounts + cross-device history sync via Supabase (managed) or PocketBase (self-host).
  The app is local-first today; add a sync boundary in `src/state/` without changing screens.
- A marketing landing page at marshallis.com (Expo web export on EAS Hosting).
