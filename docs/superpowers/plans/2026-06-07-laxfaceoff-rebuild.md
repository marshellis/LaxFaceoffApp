# Lacrosse Face-off Trainer — Clean Rebuild Implementation Plan

> **Status: shipped (PR #1 + #2, 2026-06-08) — historical record, not current-state design.**
> Phases 1–5 are complete. This plan's "Target file structure" shows a `src/ui/` directory and a
> top-level `tests/` dir that the shipped code does not use (there are no shared UI components yet,
> and tests are colocated as `*.test.ts` beside source). Read it for the *why* (root-cause
> analysis, architecture rationale), not as a map of the current tree. See `CLAUDE.md` for that.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Lacrosse Face-off Trainer as a TypeScript + Expo Router app with a sample-accurate, dev/prod-identical audio engine, so it ships reliably to iOS + Android (and web), and stays legible enough for a beginner (a 12-year-old) and AI agents to contribute safely.

**Architecture:** Keep React Native + Expo (the right call given the existing investment, single-codebase iOS/Android/web, and best-in-class AI-agent/beginner ergonomics). Replace the broken JS-thread `setTimeout`+poll audio timing with a `react-native-audio-api` (Web Audio) engine that schedules cues on the hardware audio clock. Fix the iOS/Android audio-session configuration (the root cause of dev-vs-prod divergence). Move from monolithic screens to small, focused, file-based routes with typed state.

**Tech Stack:** Expo SDK 54+ · React Native 0.81+ · React 19 · TypeScript · Expo Router (file-based) · react-native-audio-api v0.11.0 (playback/scheduling) · expo-audio (recording capture only) · Zustand + react-native-mmkv (state + persistence) · Biome (lint+format) · Jest + React Native Testing Library (unit) · Maestro (E2E) · EAS Build/Update/Hosting · GitHub Actions (CI).

> **Why a development build, not Expo Go:** the audio engine (`react-native-audio-api`) is a third-party native module, so the app runs on an **expo-dev-client development build**, not Expo Go. This is the modern Expo workflow and directly resolves the original "can't test custom native code on my phone" pain — done correctly this time. Fast Refresh still gives instant JS feedback; web preview works for non-native screens.

---

## Root-cause summary (why the original app's audio broke)

This plan is shaped by two confirmed, code-level root causes in the current app:

1. **Stale audio-session config (dev-vs-prod divergence + record/playback issues).** `src/services/AudioService.js:25` passes `expo-av`-era keys (`allowsRecordingIOS`, `playsInSilentModeIOS`, `staysActiveInBackground`, `shouldDuckAndroid`, `playThroughEarpieceAndroid`) to `expo-audio`'s `setAudioModeAsync`, which recognizes *different* keys (`allowsRecording`, `playsInSilentMode`, `shouldPlayInBackground`, `interruptionMode`). The old keys are silently ignored, so the audio session was never configured as intended. `RecordingScreen.js` never sets `allowsRecording: true` before recording.
2. **Non-deterministic timing.** `PracticeScreen.js` sequences cues with JS-thread `setTimeout`/`await`, and `AudioService.playWhistle()` "waits" by polling `whistlePlayer.playing` every 100ms. Debug and release builds run JS at different speeds with different buffering, so timing drifts between builds — fatal for a reaction-timing trainer.

The rebuild eliminates both: cues are decoded into buffers once and scheduled on `AudioContext.currentTime`, and the session is configured with the correct API.

---

## Target file structure

```
app/                                  # Expo Router routes (file = screen)
  _layout.tsx                         # Root: providers (stores), theme, audio init
  (tabs)/
    _layout.tsx                       # Bottom tab navigator
    index.tsx                         # Home
    practice/
      _layout.tsx                     # Practice stack
      index.tsx                       # Practice selection
      session.tsx                     # Active practice session (thin: renders runner state)
    activity.tsx                      # Practice history + charts
    settings/
      _layout.tsx                     # Settings stack
      index.tsx                       # Settings menu
      practice-types.tsx              # Per-type timing settings
      audio.tsx                       # Audio settings (custom sounds list)
      record.tsx                      # Record custom sounds
      help.tsx                        # Help & support
src/
  audio/
    session.ts                        # Audio-session config (correct expo-audio + RNAA APIs)
    AudioEngine.ts                    # RNAA engine: load buffers, schedule cues on the clock
    useAudioEngine.ts                 # React hook wrapping a singleton AudioEngine
  practice/
    types.ts                          # PracticeType, PracticeConfig, ScheduledCue, CueKind
    random.ts                         # Seedable RNG + randomDelay (pure, testable)
    timeline.ts                       # buildTimeline(config, rng) -> ScheduledCue[] (pure)
    runner.ts                         # PracticeRunner: drives engine from a timeline + emits state
  state/
    settingsStore.ts                  # Zustand store (practice settings, custom sound URIs)
    historyStore.ts                   # Zustand store (practice sessions)
  storage/
    mmkv.ts                           # MMKV instance + Zustand persist storage adapter
  ui/                                 # Shared presentational components (Button, Card, etc.)
  theme/
    colors.ts                         # Ported from src/constants/Colors.js, typed
tests/                                # (or colocate *.test.ts beside source)
docs/
  superpowers/plans/                  # this plan + future per-phase plans
AGENTS.md                             # Conventions for AI agents + human contributors
biome.json                            # Lint + format config
.github/workflows/ci.yml             # typecheck + biome + tests on PR
```

**Decomposition note (per writing-plans scope check):** this is a multi-subsystem program. **Phase 1 (Foundation) and Phase 2 (Audio Engine) are specified below in full bite-sized TDD detail** because they are the riskiest and most testable. **Phases 3–6 are specified as structured task lists**; each should be expanded into its own detailed plan (`docs/superpowers/plans/2026-..-<phase>.md`) when reached, using the existing `src/screens/*.js` files as the behavioral source-of-truth to port from.

---

## Vendored mobile test harness (already built — in repo, no plugins needed)

So contributors without any Claude plugins (e.g. a 12-year-old on his own Mac) can drive **iOS + Android** UI testing, the harness lives entirely in this repo. It mirrors ACE's portable atom layer (Maestro + adb + emulator) and Canopy's screenshot-on-failure QA philosophy, minus all the CommCare-specific machinery.

**What's committed:**
- `.claude/skills/mobile-test-setup/SKILL.md` + `.claude/skills/mobile-test-run/SKILL.md` — repo-local skills auto-available to any Claude Code session opened in this repo (no plugin install).
- `scripts/mobile/{install-maestro,doctor,boot-ios,boot-android,run-flows}.sh` — committed, executable wrappers over Maestro + `xcrun simctl` + `adb`/`emulator`.
- `maestro/flows/smoke.yaml` + `maestro/README.md` — one cross-platform flow runs on both iOS and Android; artifacts (screenshots + view hierarchy per step, incl. failures) land in gitignored `maestro/artifacts/`.

**Engine:** Maestro (free, open-source, cross-platform YAML flows). Selectors are React Native **`testID`** props referenced as `id:` — identical on iOS and Android.

**Verified (Jun 2026):** `scripts/mobile/doctor.sh` runs and correctly detects the toolchain on the dev Mac (iOS runtimes ✅, Android AVD `ACE_Pixel_API_34` ✅). It also caught and now reports the real gap: **Java 17 is required by Maestro and is missing — `brew install openjdk@17`.** Full flow execution (`run-flows.sh`) gets validated end-to-end once the first screen with `testID`s exists (Phase 1/Task 13).

**Convention this imposes on the app code:** every interactive/asserted element gets a stable, kebab-case `testID` (e.g. `home-screen`, `tab-practice`, `start-practice-button`, `practice-running`). This is recorded in `AGENTS.md` (Task 6) and is required by the Maestro flows added in Phase 4.

---

## Phase 1 — Foundation (scaffold, TypeScript, tooling)

**Outcome:** a fresh, typed, lint-gated Expo Router app that boots to an empty tab shell on a dev build, with CI green.

### Task 1: Convert the existing app to a TypeScript + Expo Router skeleton (in-place)

The repo is already a valid Expo SDK 54 app with working EAS config, the
`com.jljackson222.lacrossefaceofftrainer` bundle id (the Maestro smoke flow depends on it), and
the assets. So we transform in place rather than scaffolding fresh — preserving all of that.

**Files:**
- Move: `App.js`, `src/` → `legacy/` (porting reference only; never imported by new code)
- Create: `tsconfig.json`, `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`
- Modify: `package.json` (`main` → `expo-router/entry`), `index.js` (delete — Expo Router provides the entry)

- [ ] **Step 1: Move legacy code aside (keep as porting reference)**

```bash
mkdir -p legacy
git mv App.js legacy/App.js
git mv src legacy/src
git mv index.js legacy/index.js
```
`legacy/` is the behavioral source-of-truth for Phases 3–4. New code never imports from it.

- [ ] **Step 2: Install TypeScript + Expo Router**

```bash
npx expo install expo-router typescript @types/react
```

- [ ] **Step 3: Point the entry at Expo Router**

In `package.json` set `"main": "expo-router/entry"` (replacing `"index.js"`). Add the router plugin
and a scheme to `app.json` under `expo`:
```json
"scheme": "laxfaceoff",
"plugins": ["expo-router", "expo-font", "expo-audio"]
```

- [ ] **Step 4: Write `tsconfig.json`**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": { "strict": true, "paths": { "@/*": ["./*"] } },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

- [ ] **Step 5: Create the minimal route shell with testIDs the smoke flow expects**

`app/_layout.tsx`:
```tsx
import { Stack } from 'expo-router';
export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

`app/(tabs)/_layout.tsx`:
```tsx
import { Tabs } from 'expo-router';
export default function TabsLayout() {
  return <Tabs screenOptions={{ headerShown: false }} />;
}
```

`app/(tabs)/index.tsx` (note the `testID="home-screen"` that `maestro/flows/smoke.yaml` asserts):
```tsx
import { View, Text } from 'react-native';
export default function Home() {
  return (
    <View testID="home-screen" style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Lacrosse Face-off Trainer</Text>
    </View>
  );
}
```

- [ ] **Step 6: Verify it boots on web (fastest check)**

```bash
npx expo start --web
```
Expected: a browser tab shows "Lacrosse Face-off Trainer". Ctrl-C to stop.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: convert to TypeScript + Expo Router skeleton (legacy moved aside)"
```

### Task 2: Install dependencies for the rebuild stack

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime + native deps**

```bash
npx expo install react-native-audio-api expo-audio expo-speech \
  @react-native-async-storage/async-storage react-native-mmkv \
  zustand react-native-gesture-handler react-native-reanimated \
  react-native-safe-area-context react-native-screens
```

- [ ] **Step 2: Install dev deps**

```bash
npm i -D @biomejs/biome jest jest-expo @testing-library/react-native @types/jest typescript
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json && git commit -m "chore: add rebuild dependencies"
```

### Task 3: Configure Biome (lint + format)

**Files:**
- Create: `biome.json`

- [ ] **Step 1: Write `biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": { "recommended": true }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": { "formatter": { "quoteStyle": "single", "jsxQuoteStyle": "double" } }
}
```

- [ ] **Step 2: Add scripts to `package.json`**

```json
{
  "scripts": {
    "start": "expo start --dev-client",
    "web": "expo start --web",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "lint": "biome check .",
    "format": "biome format --write .",
    "typecheck": "tsc --noEmit",
    "test": "jest"
  }
}
```

- [ ] **Step 3: Run lint and verify it passes (or auto-fix)**

```bash
npm run format && npm run lint
```
Expected: `Checked N files` with no errors after format.

- [ ] **Step 4: Commit**

```bash
git add biome.json package.json && git commit -m "chore: configure Biome lint+format"
```

### Task 4: Configure Jest + jest-expo

**Files:**
- Create: `jest.config.js`
- Modify: `package.json`

- [ ] **Step 1: Write `jest.config.js`**

```js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/react-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-audio-api|react-native-mmkv))',
  ],
};
```

- [ ] **Step 2: Write a smoke test** `src/__smoke__/sanity.test.ts`

```ts
test('jest runs', () => {
  expect(1 + 1).toBe(2);
});
```

- [ ] **Step 3: Run it**

```bash
npm test
```
Expected: 1 passed.

- [ ] **Step 4: Commit**

```bash
git add jest.config.js src/__smoke__/sanity.test.ts && git commit -m "test: configure jest-expo with smoke test"
```

### Task 5: CI gate (GitHub Actions)

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write the workflow**

```yaml
name: CI
on:
  pull_request:
  push: { branches: [main] }
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml && git commit -m "ci: typecheck + lint + test on PR"
```

### Task 6: AGENTS.md (conventions for kid + AI contributors)

**Files:**
- Create: `AGENTS.md`

- [ ] **Step 1: Write `AGENTS.md`**

```md
# Contributing conventions (humans + AI agents)

## Golden rules
- TypeScript everywhere. No `any` unless justified with a comment.
- Small files: one component/responsibility per file, aim < 200 lines.
- Pure logic (timing, randomness, timeline) lives in `src/practice/` and MUST have unit tests.
- Screens in `app/` are thin: they render state and call into `src/`. No business logic in screens.
- Before committing: `npm run typecheck && npm run lint && npm test` must pass.
- Small PRs. `main` is branch-protected; CI must be green to merge.

## Where things live
- Routes/screens: `app/` (Expo Router; a file = a screen)
- Audio engine: `src/audio/`
- Practice logic (pure): `src/practice/`
- State: `src/state/` (Zustand stores)
- Shared UI: `src/ui/`

## Audio rules (learned the hard way)
- Never sequence cues with setTimeout. Schedule on `AudioContext.currentTime` via the engine.
- Always configure the audio session before playing/recording (see src/audio/session.ts).

## Testability rules
- Every element a UI test taps or asserts gets a stable, kebab-case `testID`
  (e.g. `home-screen`, `tab-practice`, `start-practice-button`, `practice-running`).
  Don't rename them casually — Maestro flows in `maestro/flows/` depend on them.
- Mobile UI tests are vendored in-repo (no plugins): see the `mobile-test-setup` and
  `mobile-test-run` skills, or `maestro/README.md`. Run: `scripts/mobile/run-flows.sh ios|android`.
```

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md && git commit -m "docs: add contributor conventions for humans + AI"
```

---

## Phase 2 — Audio engine (the crux; full TDD)

**Outcome:** a sample-accurate cue scheduler that behaves identically in dev and production, with the audio session configured correctly. Pure logic is fully unit-tested; the native layer is a thin, mockable boundary.

### Task 7: Practice domain types

**Files:**
- Create: `src/practice/types.ts`

- [ ] **Step 1: Write the types**

```ts
export type CueKind = 'down' | 'set' | 'whistle';

export type PracticeType = 'downSetWhistle' | 'rapidClamp' | 'threeWhistle';

/** Min/max seconds for a randomized gap. */
export interface DelayRange { min: number; max: number; }

export interface PracticeConfig {
  type: PracticeType;
  numberOfReps: number;
  /** Gaps used per practice type; keys are a superset, only the relevant ones are read. */
  downToSet?: DelayRange;     // downSetWhistle
  setToWhistle?: DelayRange;  // downSetWhistle
  restBetween?: DelayRange;   // all
  clampToPull?: DelayRange;   // threeWhistle
  pullToPop?: DelayRange;     // threeWhistle
  resetPause?: DelayRange;    // threeWhistle
}

/** One cue scheduled at an absolute offset (seconds) from sequence start. */
export interface ScheduledCue {
  kind: CueKind;
  at: number;      // seconds from t0
  rep: number;     // 1-based
  label: string;   // 'Down!', 'Set!', 'GO!', 'CLAMP!', etc. (for UI)
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/practice/types.ts && git commit -m "feat(practice): domain types"
```

### Task 8: Seedable RNG + randomDelay (pure, TDD)

**Files:**
- Create: `src/practice/random.ts`
- Test: `src/practice/random.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { makeRng, randomDelay } from './random';

test('makeRng is deterministic for a given seed', () => {
  const a = makeRng(42);
  const b = makeRng(42);
  expect(a()).toBeCloseTo(b());
  expect(a()).toBeCloseTo(b());
});

test('randomDelay stays within [min, max]', () => {
  const rng = makeRng(1);
  for (let i = 0; i < 1000; i++) {
    const d = randomDelay({ min: 0.5, max: 2.5 }, rng);
    expect(d).toBeGreaterThanOrEqual(0.5);
    expect(d).toBeLessThanOrEqual(2.5);
  }
});
```

- [ ] **Step 2: Run, verify it fails**

```bash
npx jest src/practice/random.test.ts
```
Expected: FAIL — `makeRng is not a function`.

- [ ] **Step 3: Implement**

```ts
import type { DelayRange } from './types';

/** Mulberry32 — tiny, deterministic PRNG. Returns a function yielding [0,1). */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomDelay(range: DelayRange, rng: () => number = Math.random): number {
  return range.min + rng() * (range.max - range.min);
}
```

- [ ] **Step 4: Run, verify it passes**

```bash
npx jest src/practice/random.test.ts
```
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/practice/random.ts src/practice/random.test.ts && git commit -m "feat(practice): seedable rng + randomDelay"
```

### Task 9: buildTimeline (pure cue scheduler, TDD)

**Files:**
- Create: `src/practice/timeline.ts`
- Test: `src/practice/timeline.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { buildTimeline } from './timeline';
import { makeRng } from './random';
import type { PracticeConfig } from './types';

const dsw: PracticeConfig = {
  type: 'downSetWhistle',
  numberOfReps: 2,
  downToSet: { min: 1, max: 1 },     // fixed for deterministic assertions
  setToWhistle: { min: 1, max: 1 },
  restBetween: { min: 2, max: 2 },
};

test('downSetWhistle: emits down,set,whistle per rep in order', () => {
  const cues = buildTimeline(dsw, makeRng(1));
  const kinds = cues.map((c) => c.kind);
  expect(kinds).toEqual(['down', 'set', 'whistle', 'down', 'set', 'whistle']);
});

test('cue times are strictly increasing', () => {
  const cues = buildTimeline(dsw, makeRng(1));
  for (let i = 1; i < cues.length; i++) {
    expect(cues[i].at).toBeGreaterThan(cues[i - 1].at);
  }
});

test('downSetWhistle: gaps match config (down@0, set@1, whistle@2, rest 2s, next down@4)', () => {
  const cues = buildTimeline(dsw, makeRng(1));
  expect(cues[0].at).toBeCloseTo(0);
  expect(cues[1].at).toBeCloseTo(1);
  expect(cues[2].at).toBeCloseTo(2);
  expect(cues[3].at).toBeCloseTo(4); // 2 (whistle) + 2 (rest)
});

test('rapidClamp: one whistle per rep separated by restBetween', () => {
  const cfg: PracticeConfig = { type: 'rapidClamp', numberOfReps: 3, restBetween: { min: 1, max: 1 } };
  const cues = buildTimeline(cfg, makeRng(1));
  expect(cues.map((c) => c.kind)).toEqual(['whistle', 'whistle', 'whistle']);
  expect(cues[1].at - cues[0].at).toBeCloseTo(1);
});

test('threeWhistle: clamp,pull,pop per rep', () => {
  const cfg: PracticeConfig = {
    type: 'threeWhistle', numberOfReps: 1,
    clampToPull: { min: 1, max: 1 }, pullToPop: { min: 1, max: 1 },
    resetPause: { min: 1, max: 1 }, restBetween: { min: 1, max: 1 },
  };
  const cues = buildTimeline(cfg, makeRng(1));
  expect(cues.map((c) => c.label)).toEqual(['CLAMP!', 'PULL!', 'POP!']);
  expect(cues[1].at).toBeCloseTo(1);
  expect(cues[2].at).toBeCloseTo(2);
});
```

- [ ] **Step 2: Run, verify it fails**

```bash
npx jest src/practice/timeline.test.ts
```
Expected: FAIL — `buildTimeline is not a function`.

- [ ] **Step 3: Implement**

```ts
import type { PracticeConfig, ScheduledCue } from './types';
import { randomDelay } from './random';

export function buildTimeline(cfg: PracticeConfig, rng: () => number = Math.random): ScheduledCue[] {
  const cues: ScheduledCue[] = [];
  let t = 0;
  const rest = cfg.restBetween ?? { min: 0, max: 0 };

  for (let rep = 1; rep <= cfg.numberOfReps; rep++) {
    if (cfg.type === 'downSetWhistle') {
      cues.push({ kind: 'down', at: t, rep, label: 'Down!' });
      t += randomDelay(cfg.downToSet ?? { min: 0, max: 0 }, rng);
      cues.push({ kind: 'set', at: t, rep, label: 'Set!' });
      t += randomDelay(cfg.setToWhistle ?? { min: 0, max: 0 }, rng);
      cues.push({ kind: 'whistle', at: t, rep, label: 'GO!' });
    } else if (cfg.type === 'rapidClamp') {
      cues.push({ kind: 'whistle', at: t, rep, label: 'CLAMP!' });
    } else if (cfg.type === 'threeWhistle') {
      cues.push({ kind: 'whistle', at: t, rep, label: 'CLAMP!' });
      t += randomDelay(cfg.clampToPull ?? { min: 0, max: 0 }, rng);
      cues.push({ kind: 'whistle', at: t, rep, label: 'PULL!' });
      t += randomDelay(cfg.pullToPop ?? { min: 0, max: 0 }, rng);
      cues.push({ kind: 'whistle', at: t, rep, label: 'POP!' });
      t += randomDelay(cfg.resetPause ?? { min: 0, max: 0 }, rng);
    }
    if (rep < cfg.numberOfReps) t += randomDelay(rest, rng);
  }
  return cues;
}
```

- [ ] **Step 4: Run, verify it passes**

```bash
npx jest src/practice/timeline.test.ts
```
Expected: all passed.

- [ ] **Step 5: Commit**

```bash
git add src/practice/timeline.ts src/practice/timeline.test.ts && git commit -m "feat(practice): pure cue timeline builder"
```

### Task 10: Audio-session config (correct expo-audio + RNAA APIs)

**Files:**
- Create: `src/audio/session.ts`

- [ ] **Step 1: Write the session module**

This is the direct fix for root cause #1 — using the *correct* current API keys.

```ts
import { setAudioModeAsync } from 'expo-audio';
import { AudioManager } from 'react-native-audio-api';

/** Configure the session for PLAYBACK of cues (loud, plays in silent mode, not earpiece). */
export async function configurePlaybackSession(): Promise<void> {
  AudioManager.setAudioSessionOptions({ iosCategory: 'playback', iosMode: 'default', iosOptions: [] });
  await AudioManager.setAudioSessionActivity(true);
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    interruptionMode: 'mixWithOthers',
  });
}

/** Configure the session for RECORDING a custom sound. */
export async function configureRecordingSession(): Promise<void> {
  AudioManager.setAudioSessionOptions({ iosCategory: 'playAndRecord', iosMode: 'default', iosOptions: [] });
  await AudioManager.setAudioSessionActivity(true);
  await setAudioModeAsync({
    allowsRecording: true,
    playsInSilentMode: true,
  });
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```
Expected: no errors. (If a key name has shifted in the installed SDK version, check `node_modules/expo-audio` types and adjust — these match expo-audio current docs as of SDK 54.)

- [ ] **Step 3: Commit**

```bash
git add src/audio/session.ts && git commit -m "feat(audio): correct playback/recording session config"
```

### Task 11: AudioEngine — decode buffers + schedule on the clock

**Files:**
- Create: `src/audio/AudioEngine.ts`
- Test: `src/audio/AudioEngine.test.ts`

The engine takes a `ScheduledCue[]` and schedules each cue's buffer at `ctx.currentTime + cue.at`. Pure scheduling math is tested against a mock context; the real `AudioContext` is injected so tests don't need native code.

- [ ] **Step 1: Write the failing test (scheduling math against a mock context)**

```ts
import { AudioEngine } from './AudioEngine';
import type { ScheduledCue } from '../practice/types';

function mockContext() {
  const started: Array<{ when: number }> = [];
  const ctx: any = {
    currentTime: 10,
    decodeAudioData: jest.fn(async () => ({}) as any),
    destination: {},
    createBufferSource() {
      return {
        buffer: null,
        connect() {},
        start(when: number) { started.push({ when }); },
        stop() {},
      };
    },
  };
  return { ctx, started };
}

test('schedules each cue at currentTime + cue.at', async () => {
  const { ctx, started } = mockContext();
  const engine = new AudioEngine(ctx);
  // pretend buffers are loaded
  (engine as any).buffers = { down: {}, set: {}, whistle: {} };
  const cues: ScheduledCue[] = [
    { kind: 'down', at: 0, rep: 1, label: 'Down!' },
    { kind: 'set', at: 1.5, rep: 1, label: 'Set!' },
    { kind: 'whistle', at: 3, rep: 1, label: 'GO!' },
  ];
  engine.scheduleSequence(cues);
  expect(started.map((s) => s.when)).toEqual([10, 11.5, 13]);
});
```

- [ ] **Step 2: Run, verify it fails**

```bash
npx jest src/audio/AudioEngine.test.ts
```
Expected: FAIL — cannot find module `./AudioEngine`.

- [ ] **Step 3: Implement**

```ts
import { AudioContext } from 'react-native-audio-api';
import type { CueKind, ScheduledCue } from '../practice/types';

type Buffers = Partial<Record<CueKind, unknown>>;
type SourceMap = { down?: string | number; set?: string | number; whistle?: string | number };

export class AudioEngine {
  private ctx: AudioContext;
  private buffers: Buffers = {};
  private scheduled: Array<{ stop: () => void }> = [];

  constructor(ctx?: AudioContext) {
    this.ctx = ctx ?? new AudioContext({ sampleRate: 44100 });
  }

  /** Decode each source (asset URI or required module) into an AudioBuffer once. */
  async load(sources: { kind: CueKind; arrayBuffer: ArrayBuffer }[]): Promise<void> {
    for (const s of sources) {
      this.buffers[s.kind] = await this.ctx.decodeAudioData(s.arrayBuffer);
    }
  }

  /** Schedule every cue on the audio clock. Sample-accurate; immune to JS-thread jitter. */
  scheduleSequence(cues: ScheduledCue[]): void {
    const t0 = this.ctx.currentTime;
    for (const cue of cues) {
      const buffer = this.buffers[cue.kind];
      if (!buffer) continue;
      const node = this.ctx.createBufferSource();
      node.buffer = buffer as never;
      node.connect(this.ctx.destination);
      node.start(t0 + cue.at);
      this.scheduled.push({ stop: () => node.stop() });
    }
  }

  /** Stop everything scheduled/playing immediately. */
  stopAll(): void {
    for (const s of this.scheduled) {
      try { s.stop(); } catch { /* already stopped */ }
    }
    this.scheduled = [];
  }

  async suspend(): Promise<void> { await this.ctx.suspend(); }
  async resume(): Promise<void> { await this.ctx.resume(); }
  get currentTime(): number { return this.ctx.currentTime; }
}
```

- [ ] **Step 4: Run, verify it passes**

```bash
npx jest src/audio/AudioEngine.test.ts
```
Expected: 1 passed.

- [ ] **Step 5: Commit**

```bash
git add src/audio/AudioEngine.ts src/audio/AudioEngine.test.ts && git commit -m "feat(audio): clock-scheduled audio engine"
```

> **Asset loading note:** to get an `ArrayBuffer` from a bundled asset, use `expo-asset` to resolve the asset then `expo-file-system` (or `fetch(asset.uri).then(r => r.arrayBuffer())`) to read bytes. For custom recordings, read the recorded file URI the same way. Add a small `src/audio/loadAsset.ts` helper in Task 12 and unit-test the URI→ArrayBuffer boundary with a mock.

### Task 12: PracticeRunner — drive the engine + expose UI state

**Files:**
- Create: `src/practice/runner.ts`
- Test: `src/practice/runner.test.ts`

The runner owns the state machine the UI renders (`ready | running | paused | complete`, current rep, current label). It schedules the timeline via the engine and uses *one* timer only to advance the **UI label** (not the audio — audio is already scheduled on the clock). This keeps visual updates and audio decoupled, so even if the JS thread stutters the *sound* stays accurate.

- [ ] **Step 1: Write the failing test** (label advancement uses fake timers; audio is a mock engine)

```ts
import { PracticeRunner } from './runner';
import type { ScheduledCue } from './types';

test('runner emits labels at scheduled offsets and completes', () => {
  jest.useFakeTimers();
  const engine = { scheduleSequence: jest.fn(), stopAll: jest.fn() };
  const cues: ScheduledCue[] = [
    { kind: 'down', at: 0, rep: 1, label: 'Down!' },
    { kind: 'whistle', at: 1, rep: 1, label: 'GO!' },
  ];
  const states: string[] = [];
  const runner = new PracticeRunner(engine as never);
  runner.on((s) => states.push(s.label ?? s.phase));
  runner.start(cues);

  expect(engine.scheduleSequence).toHaveBeenCalledWith(cues);
  jest.advanceTimersByTime(0); expect(states).toContain('Down!');
  jest.advanceTimersByTime(1000); expect(states).toContain('GO!');
  jest.advanceTimersByTime(10); expect(states).toContain('complete'); // phase flips after last cue
  jest.useRealTimers();
});
```

- [ ] **Step 2: Run, verify it fails**

```bash
npx jest src/practice/runner.test.ts
```
Expected: FAIL — cannot find `./runner`.

- [ ] **Step 3: Implement**

```ts
import type { ScheduledCue } from './types';

export type Phase = 'ready' | 'running' | 'paused' | 'complete';
export interface RunnerState { phase: Phase; rep: number; label?: string; }

interface EngineLike { scheduleSequence(cues: ScheduledCue[]): void; stopAll(): void; }

export class PracticeRunner {
  private listeners: Array<(s: RunnerState) => void> = [];
  private timers: ReturnType<typeof setTimeout>[] = [];
  private state: RunnerState = { phase: 'ready', rep: 0 };

  constructor(private engine: EngineLike) {}

  on(fn: (s: RunnerState) => void): () => void {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter((l) => l !== fn); };
  }
  private emit(next: Partial<RunnerState>) {
    this.state = { ...this.state, ...next };
    for (const l of this.listeners) l(this.state);
  }

  start(cues: ScheduledCue[]): void {
    this.stop();
    this.engine.scheduleSequence(cues);
    this.emit({ phase: 'running', rep: 1 });
    for (const cue of cues) {
      this.timers.push(setTimeout(() => this.emit({ label: cue.label, rep: cue.rep }), cue.at * 1000));
    }
    const end = cues.length ? cues[cues.length - 1].at * 1000 + 1 : 0;
    this.timers.push(setTimeout(() => this.emit({ phase: 'complete' }), end));
  }

  stop(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.engine.stopAll();
    this.emit({ phase: 'ready', rep: 0, label: undefined });
  }
}
```

- [ ] **Step 4: Run, verify it passes**

```bash
npx jest src/practice/runner.test.ts
```
Expected: passed.

- [ ] **Step 5: Commit**

```bash
git add src/practice/runner.ts src/practice/runner.test.ts && git commit -m "feat(practice): runner state machine driving the engine"
```

### Task 13: Manual device verification of audio parity

**Files:** none (verification task — uses superpowers:verification-before-completion)

- [ ] **Step 1: Build a dev client and run on the physical Android phone**

```bash
npx expo run:android   # or: eas build --profile development --platform android
```

- [ ] **Step 2: Wire a temporary debug screen** that loads the three cue buffers, builds a `downSetWhistle` timeline, and plays it. Confirm cue timing sounds correct.

- [ ] **Step 3: Build a RELEASE/production build and run the same flow**

```bash
eas build --profile production --platform android
```

- [ ] **Step 4: Verify parity (the whole point)**

Record both runs (phone screen-record with audio). Confirm: cue spacing is audibly identical between dev and production, whistle plays at full volume, and a record→playback cycle keeps playback loud (not earpiece). This closes the original blocker.

---

## Phase 3 — State & persistence

Expand into its own plan. Tasks:
- [ ] `src/storage/mmkv.ts`: MMKV instance + a Zustand `PersistStorage` adapter.
- [ ] `src/state/settingsStore.ts`: port `src/contexts/SettingsContext.js` (250 lines) to a typed Zustand store with `persist`. Keep `PRACTICE_TYPE_CONFIGS` defaults; type them with `PracticeConfig`. Migrate custom-sound URIs (`customDownUri`, etc.).
- [ ] `src/state/historyStore.ts`: port `src/contexts/PracticeHistoryContext.js` (445 lines) to a typed Zustand store; `addSession(type, reps, durationSec)`, selectors for the Activity charts/calendar.
- [ ] Unit tests for store reducers/selectors (pure parts) — e.g., streak/aggregate computations from history.
- [ ] One-time migration: read any existing AsyncStorage keys from the old app and import into MMKV on first launch (so existing users/the son don't lose history). Test the migration mapping with a mock.

## Phase 4 — Screens (port + decompose monoliths)

Expand into its own plan. Port each old screen to an Expo Router route, splitting the 1000+ line files into focused components in `src/ui/`. Use the old `.js` files as the behavior spec.

- [ ] `app/(tabs)/index.tsx` ← `HomeScreen.js` (127 lines)
- [ ] `app/(tabs)/practice/index.tsx` ← `PracticeSelectionScreen.js` (159) + `SessionTypeSelector.js`
- [ ] `app/(tabs)/practice/session.tsx` ← `PracticeScreen.js` (1105) — **thin**: subscribe to `PracticeRunner` state, render label/rep/controls. All sequencing logic now lives in `src/practice/` (already built + tested in Phase 2). This is where the biggest line-count reduction happens.
- [ ] `app/(tabs)/activity.tsx` ← `ActivityScreen.js` (461) — split chart + calendar into `src/ui/` components.
- [ ] `app/(tabs)/settings/*` ← `SettingsMenuScreen` (179), `PracticeTypeSettingsScreen` (727 → split per practice type), `AudioSettingsScreen` (277), `HelpSupportScreen` (291).
- [ ] `app/(tabs)/settings/record.tsx` ← `RecordingScreen.js` (524) — use `configureRecordingSession()` before `recorder.record()`, and `configurePlaybackSession()` after `recorder.stop()` (fixes the quiet-after-record bug).
- [ ] Decide fate of `DeveloperModeScreen.js` (307) and `SettingsScreen.js` (1018, appears to be a superseded duplicate of the settings stack) — likely drop the old monolith.
- [ ] Add Maestro E2E flows to the **vendored harness** (`maestro/flows/`): `practice-happy-path.yaml` (start a session, hear it complete), `record-custom-sound.yaml`. Add the matching `testID`s to components as you port them (`tab-practice`, `start-practice-button`, `practice-running`, etc.). Verify on both platforms: `scripts/mobile/run-flows.sh ios` and `scripts/mobile/run-flows.sh android`. This is where the vendored harness gets its first real end-to-end validation.

## Phase 5 — Web target (marshallis.com)

Expand into its own plan. Tasks:
- [ ] Verify each route renders under `npx expo start --web`; gate native-only bits with `Platform.OS`.
- [ ] Audio on web: `react-native-audio-api` IS the Web Audio API, so the engine ports — but browsers **block autoplay**; ensure the audio context is created/resumed inside the "Start" tap handler (`engine.resume()` on first user gesture). Add a web unit/Playwright check.
- [ ] Recording on web is browser-dependent (MediaRecorder quirks); either feature-detect and disable custom recording on web, or accept WebM and document the limitation.
- [ ] Build a simple marketing landing route; export with `expo export -p web`.
- [ ] Deploy to **EAS Hosting** and point marshallis.com at it (apex: A record per EAS Hosting custom-domain docs; or a subdomain CNAME).

## Phase 6 — Optional backend / family sync (only when wanted)

Expand into its own plan (do NOT build until there's a real need — YAGNI). Decision recorded:
- [ ] Start **local-first** (no backend). When cross-device family history sync is actually desired:
  - **Supabase** (managed Postgres + auth) — gentlest on-ramp, most AI-legible; or
  - **PocketBase** (single self-hosted Go binary + SQLite) — cheapest self-host given the user runs servers.
- [ ] Add a `sync` boundary in `src/state/` so stores can push/pull without screens knowing. Keep the app fully functional offline.

---

## Self-review (against the brief)

- **"Seriously evaluate alternatives"** → covered in the recommendation doc; this plan executes the chosen stack (RN/Expo) with the reasons it won.
- **iOS + Android (+ web)** → Phases 2–4 (native), Phase 5 (web).
- **Clean best-practices rebuild** → TypeScript, Expo Router, Biome, Jest/RNTL, Maestro, CI, small files, AGENTS.md.
- **Audio dev/prod parity (the blocker)** → Phase 2 directly fixes both root causes; Task 13 verifies on-device.
- **12-year-old + AI contributors** → AGENTS.md conventions, thin screens, pure tested logic, branch-protected CI.
- **Placeholder scan** → Phases 1–2 contain full code + commands; Phases 3–6 are intentionally outlines to be expanded into their own plans at execution time (flagged in the decomposition note), using the existing `src/screens/*.js` as the behavior spec.
- **Type consistency** → `PracticeConfig`/`ScheduledCue`/`CueKind` defined in Task 7 are used consistently in Tasks 8–12; `AudioEngine.scheduleSequence`/`stopAll` match the `EngineLike` interface in the runner.
