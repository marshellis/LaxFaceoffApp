# Lacrosse Face-off Trainer — agent guide

Cross-platform (iOS + Android + web) Expo / React Native app that trains lacrosse face-off
timing with randomized audio cue sequences. Built to be contributed to by AI agents **and** a
beginner (a 12-year-old learning to code), so legibility and small files matter as much as
correctness.

**Status:** Clean TypeScript rebuild shipped — PR #1 (rebuild) and PR #2 (native publishing
pipeline) are merged to `main`. No open issues or PRs. The old app survives only as
`legacy/` (porting reference; never imported or edited). Phases 1–5 of the rebuild are
complete and code-review-clean; deferred minors are tracked in `docs/FOLLOWUPS.md`.

## The core architecture decision (why this rebuild exists)

The old app sequenced cues with JS-thread `setTimeout`/polling, which drifted between debug
and release builds — fatal for a reaction-timing tool — and configured the audio session with
stale `expo-av` keys that `expo-audio` silently ignored. The rebuild fixes both:

- **Cues schedule on the hardware audio clock**, not the JS thread. `src/audio/AudioEngine.ts`
  decodes each sound to an `AudioBuffer` once, then `scheduleSequence()` places every cue at
  `AudioContext.currentTime + cue.at` via `react-native-audio-api`. Sample-accurate and immune
  to JS jitter, so debug and release builds time identically.
- **The audio session is configured with the correct current APIs**
  (`src/audio/session.ts`): `react-native-audio-api`'s `AudioManager` + `expo-audio`'s
  `setAudioModeAsync`. Recording switches to a record-capable category and restores loud
  playback afterward. All session calls are web-guarded (the native module no-ops on web).

**The one rule that must never be broken: never sequence cues with `setTimeout`.** Always go
through the engine so timing stays on the audio clock. (`PracticeRunner` in
`src/practice/runner.ts` does use timers — but only to emit UI *state* like rep counters, never
to fire audio.)

## Layout (verified paths)

```
app/                     Expo Router screens — a file = a screen, screens stay thin
  (tabs)/                Home (index), Practice (selection → session), Activity, Settings (stack)
src/
  audio/                 AudioEngine (clock scheduling), session config, useAudioEngine hook, loadAsset
  practice/              Pure cue-timing logic: types, random (seedable RNG), timeline, runner
  state/                 Zustand stores (settings, history) + pure helpers (defaults, historyStats)
  storage/               MMKV persistence adapter (web falls back to localStorage / in-memory)
  theme/                 Colors
scripts/mobile/          Vendored Maestro + simulator/emulator harness (no Claude plugins needed)
scripts/publish/         EAS build / submit / update / doctor wrappers
maestro/flows/           Cross-platform UI test flows (selectors are React Native testIDs)
legacy/                  Pre-rewrite app — porting reference ONLY; never import or edit it
docs/                    Rebuild plan, build/test guide, publishing guide, follow-ups
```

Counts as of this writing: 21 `.ts/.tsx` under `src/` (7 colocated `*.test.ts`), 13 screens
under `app/`, 4 Maestro flows. Pure logic in `src/practice/` and `src/state/` is unit-tested;
screens render state and call into `src/` (no business logic in screens).

## Conventions (this is the canonical list — `AGENTS.md` points here)

- **TypeScript everywhere**, `strict` on. No `any` without a justifying comment.
- **Small files**, one responsibility each (aim < 200 lines). Screens stay thin: they render
  state and call into `src/` — no business logic in screens.
- **Pure timing/randomness/timeline logic** lives in `src/practice/` and MUST have unit tests.
- **Audio rules (learned the hard way):** never sequence cues with `setTimeout` — schedule on
  `AudioContext.currentTime` through the engine. Always configure the audio session
  (`src/audio/session.ts`) before playing or recording.
- **Stable, kebab-case `testID`s** on every element a UI test taps or asserts
  (`home-screen`, `tab-practice`, `start-practice-button`, `practice-running`). Maestro flows
  in `maestro/flows/` depend on them — don't rename casually.
- **`legacy/` is the old app** — a porting reference only. Never import from it or edit it.
- Before committing: `npm run typecheck && npm run lint && npm test` must pass. `main` is
  branch-protected; CI must be green to merge. Keep PRs small.

> Shared UI components would live in `src/ui/`, but that directory does not exist yet — there
> are none today. Create it when the first one lands.

## Commands

```bash
npm test            # Jest unit tests (pure timing/stats logic)
npm run typecheck   # tsc --noEmit
npm run lint        # Biome (check); npm run format to write

# On device (native modules → dev build, NOT Expo Go):
npx expo run:ios                    # iOS simulator (no extra SDK downloads)
npx expo run:android                # Android emulator (one-time SDK top-up — see docs/BUILD_AND_TEST.md)
npx expo start --web                # web preview
scripts/mobile/doctor.sh            # check the iOS/Android test toolchain
scripts/mobile/run-flows.sh ios     # Maestro UI flows + screenshots (ios|android)

# Publish (EAS — keys live in GitHub CI, see docs/PUBLISHING.md):
scripts/publish/doctor.sh           # readiness check
npm run build:prod                  # eas build --profile production
npm run ota -- --branch production --message "..."   # OTA JS-only update
```

CI (`.github/workflows/ci.yml`) runs typecheck + lint + test on every PR. Native builds are
cloud-built via `.github/workflows/publish.yml` (manual dispatch or `v*` tag), so no contributor
needs signing keys locally.

## Key docs

- **`AGENTS.md`** — stub that points back here; exists so non-Claude agents (Codex, Cursor,
  Gemini, etc.) find the conventions too. This file is the source of truth.
- **`docs/BUILD_AND_TEST.md`** — on-device build + the Android SDK top-up + the audio-parity listen-test.
- **`docs/PUBLISHING.md`** — EAS build/submit/OTA, CI publishing, adding contributors.
- **`docs/FOLLOWUPS.md`** — deferred minors (good beginner tasks) + residual setup.
- **`maestro/README.md`** — the vendored mobile UI test harness.
- **`docs/superpowers/plans/2026-06-07-laxfaceoff-rebuild.md`** — the rebuild plan. Shipped
  (PR #1/#2); a historical record, not current-state design — its target structure shows
  `src/ui/` and a `tests/` dir that the shipped code doesn't use (tests are colocated).

## Known follow-ups (deferred, safe starter tasks)

From `docs/FOLLOWUPS.md` — small and well-scoped:

- **M5** — completion fires ~1ms after the last cue; `threeWhistle`'s `resetPause` tail is
  ignored. Thread the timeline's total duration into `runner.start()`.
- **M6** — `durationSec` is recorded from wall-clock (`Date.now`) in `session.tsx`, not the
  timeline; a backgrounded JS thread can skew it. Compute from the timeline instead.
- **Audio-parity listen-test** — build debug + release, run a Down-Set-Whistle set on each,
  confirm cue spacing matches (it should — all cues schedule on `AudioContext.currentTime`).
- **Live web QA** — the web build compiles but hasn't been hand-exercised in a browser; audio
  starts on the first user gesture (autoplay policy).

Bigger optional directions (Phase 6, currently YAGNI): family accounts + cross-device history
sync (add a sync boundary in `src/state/`), and a marketing landing page.
