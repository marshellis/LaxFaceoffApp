# Follow-ups (known minors + residual work)

The rebuild's Phase 1–5 are complete and code-review-clean (Critical + Important findings fixed).
These are the deliberately-deferred items — small, safe, and good "starter" tasks for a new
contributor (including a kid learning with an AI agent).

## Recently resolved (code review minors + cleanups)
- **M5 / M6** — completion + recorded `durationSec` now come from the timeline (single-clock
  session), so the `threeWhistle` reset-pause tail is honored and a backgrounded thread can't skew
  the stat.
- **`@/` path alias** — `app/` and `src/` now import via `@/src/...` instead of `../../../src/...`.
- **Audio-load error state** — a failed buffer load now shows a "Tap to retry" button
  (`useAudioEngine` exposes `error`) instead of a button stuck on "LOADING…".

## Residual setup (environment, not code)
- **On-device build** — one-time Android SDK top-up (NDK + `platforms;android-35` + CMake) then
  `npx expo run:android|ios`. See `docs/BUILD_AND_TEST.md`. iOS sim needs no extra downloads.
- **Audio parity listen-test** — build debug + release, run a Down-Set-Whistle set on each, confirm
  cue spacing matches (it should: all three cues now schedule on `AudioContext.currentTime`).
- **Live web QA** — `npx expo start --web` and click through; audio starts on the first user gesture
  (autoplay policy). The web build compiles; it hasn't been hand-exercised in a browser yet.

## Bigger optional directions (Phase 6, only if wanted — currently YAGNI)
- Family accounts + cross-device history sync via Supabase (managed) or PocketBase (self-host).
  The app is local-first today; add a sync boundary in `src/state/` without changing screens.
- A marketing landing page at marshallis.com (Expo web export on EAS Hosting).
