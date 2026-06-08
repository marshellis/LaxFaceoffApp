# Follow-ups (known minors + residual work)

The rebuild's Phase 1–5 are complete and code-review-clean (Critical + Important findings fixed).
These are the deliberately-deferred items — small, safe, and good "starter" tasks for a new
contributor (including a kid learning with an AI agent).

## Accepted minors (from the final code review)
- ~~**M5 — completion timer ignores the threeWhistle reset-pause tail.**~~ ✅ Fixed by the
  single-clock change: `buildTimeline` returns `duration` and the runner completes at that time.
- ~~**M6 — `durationSec` recorded from wall-clock (`Date.now`), not the timeline.**~~ ✅ Fixed:
  `session.tsx` now records `Math.round(duration)` from the timeline.

## New starter tasks (small, safe — good for a beginner)
- **Use the `@/` path alias.** `tsconfig.json` already defines `@/*`, but screens import
  `../../../src/...`. Switch to `@/src/...` repo-wide so nobody has to count `../`.
- **Show an audio-load error state.** If buffer loading fails, `useAudioEngine` only
  `console.error`s and the START button stays "LOADING…" forever. Add an `error` to the hook and
  render "Couldn't load sounds — tap to retry".

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
