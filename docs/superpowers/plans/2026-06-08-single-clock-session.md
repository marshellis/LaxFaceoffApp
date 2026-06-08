# Single-Clock Practice Session Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a running practice session read time from exactly one source — the audio hardware clock — so the on-screen cue label always matches the sound, and the "complete" event + saved duration are exact (fixes the visual-label drift, plus follow-ups M5 and M6).

**Architecture:** Today a session reads time from three places: the audio clock (cues — correct), `setTimeout` (the visual label + completion — JS-thread, can drift), and `Date.now()` (the saved `durationSec` — wall-clock, skews if backgrounded). This plan collapses all three onto the audio clock. `buildTimeline` starts returning the timeline's total `duration`. A new pure function `cueAt(cues, t)` answers "which cue is showing at elapsed time t". `PracticeRunner` drops its per-cue `setTimeout` array and instead runs one interval that reads `engine.currentTime`, derives the label via `cueAt`, and completes when elapsed ≥ `duration`. The screen saves `durationSec` from the timeline, not the wall clock.

**Tech Stack:** TypeScript · Jest (jest-expo) · react-native-audio-api (`AudioContext.currentTime`) · Expo Router screen. No new dependencies.

---

## Why this is also simpler (and more testable)

- **One concept to teach a beginner:** "everything reads the same clock." The runner no longer juggles an array of timers.
- **`cueAt` is a pure function** → trivially unit-tested with plain numbers, no fake timers.
- **The runner test gets deterministic:** we drive a fake engine whose `currentTime` we set by hand, instead of racing `setTimeout` against fake timers.
- **M5 and M6 dissolve:** completion at the timeline's true end includes `threeWhistle`'s `resetPause` tail (M5); `durationSec` comes from that same exact number (M6).

## File structure (what each change is responsible for)

- `src/practice/timeline.ts` — `buildTimeline` returns `{ cues, duration }`; add pure `cueAt(cues, t)`.
- `src/practice/timeline.test.ts` — update destructuring; add `duration` + `cueAt` tests.
- `src/practice/runner.ts` — `EngineLike` gains `currentTime`; `start(cues, duration)` runs one clock-reading interval; natural completion lets the sound ring out (no `stopAll`), user STOP still cuts it.
- `src/practice/runner.test.ts` — rewrite around a controllable-clock fake engine.
- `app/(tabs)/practice/session.tsx` — destructure `{ cues, duration }`, pass `duration` to `runner.start`, save `durationSec` from `duration`, drop the wall-clock `startTimeRef`.
- `docs/FOLLOWUPS.md` — remove M5 + M6 (now fixed).

**Out of scope (YAGNI):** implementing the `'paused'` phase, a post-cue display "tail", history pruning, the `@/` import alias, and the load-error UI state. Those are noted as future work, not done here.

---

## Task 1: `buildTimeline` returns the timeline duration

**Files:**
- Modify: `src/practice/timeline.ts`
- Test: `src/practice/timeline.test.ts`

- [ ] **Step 1: Update the existing tests to the new return shape and add a duration test**

In `src/practice/timeline.test.ts`, change every `const cues = buildTimeline(...)` to
`const { cues } = buildTimeline(...)` (lines using it: the `dsw` tests and the `rapidClamp` /
`threeWhistle` tests). Then add these two tests at the end of the file:

```typescript
test('returns duration = end of timeline including threeWhistle reset pause', () => {
  const cfg: PracticeConfig = {
    type: 'threeWhistle',
    numberOfReps: 1,
    clampToPull: { min: 1, max: 1 },
    pullToPop: { min: 1, max: 1 },
    resetPause: { min: 3, max: 3 },
    restBetween: { min: 1, max: 1 },
  };
  // CLAMP@0, PULL@1, POP@2, then a 3s reset pause → duration 5 (last rep adds no restBetween).
  const { duration } = buildTimeline(cfg, makeRng(1));
  expect(duration).toBeCloseTo(5);
});

test('downSetWhistle duration ends at the final whistle', () => {
  const { cues, duration } = buildTimeline(dsw, makeRng(1));
  expect(duration).toBeCloseTo(cues[cues.length - 1].at); // whistle@... is the last event
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/practice/timeline.test.ts`
Expected: FAIL — `duration` is `undefined` (buildTimeline still returns an array), and the
destructured `cues` is `undefined` so the kind/`at` assertions throw.

- [ ] **Step 3: Change `buildTimeline` to return `{ cues, duration }`**

In `src/practice/timeline.ts`, change the signature and the final `return`. The running `t`
already accumulates the trailing `resetPause` (threeWhistle) and skips `restBetween` after the
last rep, so `t` at the end of the loop IS the true timeline end:

```typescript
export function buildTimeline(
  cfg: PracticeConfig,
  rng: () => number = Math.random,
): { cues: ScheduledCue[]; duration: number } {
```

and replace the final `return cues;` with:

```typescript
  return { cues, duration: t };
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- src/practice/timeline.test.ts`
Expected: PASS (all timeline tests, including the two new ones).

- [ ] **Step 5: Commit**

```bash
git add src/practice/timeline.ts src/practice/timeline.test.ts
git commit -m "feat(timeline): return total duration from buildTimeline"
```

---

## Task 2: `cueAt(cues, t)` — pure "current cue at elapsed time" lookup

**Files:**
- Modify: `src/practice/timeline.ts`
- Test: `src/practice/timeline.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to `src/practice/timeline.test.ts` (and add `cueAt` to the existing
`import { buildTimeline } from './timeline';` so it reads
`import { buildTimeline, cueAt } from './timeline';`):

```typescript
test('cueAt returns undefined before the first cue', () => {
  const { cues } = buildTimeline(dsw, makeRng(1)); // down@0, set@1, whistle@2, ...
  expect(cueAt(cues, -0.5)).toBeUndefined();
});

test('cueAt returns the latest cue whose time has passed', () => {
  const { cues } = buildTimeline(dsw, makeRng(1));
  expect(cueAt(cues, 0)?.label).toBe('Down!'); // exactly at down@0
  expect(cueAt(cues, 1.5)?.label).toBe('Set!'); // between set@1 and whistle@2
  expect(cueAt(cues, 100)?.label).toBe(cues[cues.length - 1].label); // past the end
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/practice/timeline.test.ts -t cueAt`
Expected: FAIL with "cueAt is not a function" / import error.

- [ ] **Step 3: Implement `cueAt`**

Append to `src/practice/timeline.ts`. Cues are sorted ascending by `at` (buildTimeline emits
them in order; the existing "strictly increasing" test guards that), so a single forward scan
that stops early is correct and O(n):

```typescript
/**
 * The cue that should be showing at elapsed time `t` (seconds): the latest cue
 * whose `at <= t`. Returns undefined before the first cue. Pure — drives the UI
 * label off the same clock the audio plays on. Assumes cues are sorted by `at`.
 */
export function cueAt(cues: ScheduledCue[], t: number): ScheduledCue | undefined {
  let current: ScheduledCue | undefined;
  for (const cue of cues) {
    if (cue.at <= t) current = cue;
    else break;
  }
  return current;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- src/practice/timeline.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/practice/timeline.ts src/practice/timeline.test.ts
git commit -m "feat(timeline): add pure cueAt(cues, t) lookup"
```

---

## Task 3: `PracticeRunner` drives the UI off the audio clock

**Files:**
- Modify: `src/practice/runner.ts`
- Test: `src/practice/runner.test.ts`

- [ ] **Step 1: Rewrite the runner test around a controllable clock**

Replace the entire contents of `src/practice/runner.test.ts` with:

```typescript
import { PracticeRunner } from './runner';
import type { ScheduledCue } from './types';

/** Fake engine whose audio clock we advance by hand. */
function makeFakeEngine() {
  return {
    now: 0,
    get currentTime() {
      return this.now;
    },
    scheduleSequence: jest.fn(),
    stopAll: jest.fn(),
  };
}

const cues: ScheduledCue[] = [
  { kind: 'down', at: 0, rep: 1, label: 'Down!' },
  { kind: 'whistle', at: 1, rep: 1, label: 'GO!' },
];

test('schedules the cues and shows the first label immediately', () => {
  jest.useFakeTimers();
  const engine = makeFakeEngine();
  const states: string[] = [];
  const runner = new PracticeRunner(engine as never);
  runner.on((s) => states.push(s.label ?? s.phase));

  runner.start(cues, 2);
  expect(engine.scheduleSequence).toHaveBeenCalledWith(cues);
  expect(states).toContain('Down!'); // first paint, no timer wait
  jest.useRealTimers();
});

test('label follows the audio clock and completes at duration', () => {
  jest.useFakeTimers();
  const engine = makeFakeEngine();
  const states: string[] = [];
  const runner = new PracticeRunner(engine as never);
  runner.on((s) => states.push(s.label ?? s.phase));

  runner.start(cues, 2);
  engine.now = 1; // audio clock reaches the whistle
  jest.advanceTimersByTime(100); // one tick of the runner loop
  expect(states).toContain('GO!');

  engine.now = 2; // reached the timeline end
  jest.advanceTimersByTime(100);
  expect(states).toContain('complete');
  // Natural completion lets the sound ring out — it must NOT cut the audio.
  expect(engine.stopAll).not.toHaveBeenCalled();
  jest.useRealTimers();
});

test('user stop cuts the audio and returns to ready', () => {
  jest.useFakeTimers();
  const engine = makeFakeEngine();
  const states: string[] = [];
  const runner = new PracticeRunner(engine as never);
  runner.on((s) => states.push(s.phase));

  runner.start(cues, 2);
  runner.stop();
  expect(engine.stopAll).toHaveBeenCalled();
  expect(states[states.length - 1]).toBe('ready');
  jest.useRealTimers();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/practice/runner.test.ts`
Expected: FAIL — `start` currently takes one arg and uses `setTimeout`; there's no clock loop,
so `GO!`/`complete` won't appear on the controllable-clock schedule and `stopAll` expectations
won't line up.

- [ ] **Step 3: Rewrite the runner to read the clock**

Replace the entire contents of `src/practice/runner.ts` with:

```typescript
import { cueAt } from './timeline';
import type { ScheduledCue } from './types';

export type Phase = 'ready' | 'running' | 'paused' | 'complete';
export interface RunnerState {
  phase: Phase;
  rep: number;
  label?: string;
}

/** Just the bits of AudioEngine the runner needs (so tests can fake it). */
interface EngineLike {
  scheduleSequence(cues: ScheduledCue[]): void;
  stopAll(): void;
  readonly currentTime: number;
}

/** How often the loop reads the audio clock to refresh the visible label (ms). */
const TICK_MS = 100;

export class PracticeRunner {
  private listeners: Array<(s: RunnerState) => void> = [];
  private interval: ReturnType<typeof setInterval> | null = null;
  private cues: ScheduledCue[] = [];
  private duration = 0;
  private t0 = 0;
  private state: RunnerState = { phase: 'ready', rep: 0 };

  constructor(private engine: EngineLike) {}

  on(fn: (s: RunnerState) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private emit(next: Partial<RunnerState>) {
    this.state = { ...this.state, ...next };
    for (const l of this.listeners) l(this.state);
  }

  /** Schedule the cues on the audio clock and start the UI loop that follows it. */
  start(cues: ScheduledCue[], duration: number): void {
    this.stop();
    this.cues = cues;
    this.duration = duration;
    this.t0 = this.engine.currentTime;
    this.engine.scheduleSequence(cues);
    this.emit({ phase: 'running', rep: cues[0]?.rep ?? 1, label: undefined });
    this.tick(); // paint the first cue immediately
    this.interval = setInterval(() => this.tick(), TICK_MS);
  }

  /** One read of the audio clock: update the label, or complete at the end. */
  private tick(): void {
    const elapsed = this.engine.currentTime - this.t0;
    if (elapsed >= this.duration) {
      this.clearLoop();
      // Natural finish: leave the last cue ringing — do NOT stopAll.
      this.emit({ phase: 'complete', label: undefined });
      return;
    }
    const cue = cueAt(this.cues, elapsed);
    if (cue) this.emit({ label: cue.label, rep: cue.rep });
  }

  private clearLoop(): void {
    if (this.interval !== null) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /** User-initiated stop: cut the audio and reset to ready. */
  stop(): void {
    this.clearLoop();
    this.engine.stopAll();
    this.emit({ phase: 'ready', rep: 0, label: undefined });
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/practice/runner.test.ts`
Expected: PASS (all three tests).

- [ ] **Step 5: Commit**

```bash
git add src/practice/runner.ts src/practice/runner.test.ts
git commit -m "feat(runner): drive UI off the audio clock; let cues ring out on finish"
```

---

## Task 4: Wire the screen to the timeline duration (drop the wall clock)

**Files:**
- Modify: `app/(tabs)/practice/session.tsx`

- [ ] **Step 1: Destructure the new return and pass duration through**

In `app/(tabs)/practice/session.tsx`, in `handleStart`, change:

```typescript
    const cues = buildTimeline(config, makeRng(seed));

    startTimeRef.current = Date.now();
```

to:

```typescript
    const { cues, duration } = buildTimeline(config, makeRng(seed));
```

(Delete the `startTimeRef.current = Date.now();` line.)

- [ ] **Step 2: Save durationSec from the timeline, and update the runner.start call**

Still in `handleStart`, in the `runner.on` callback change the completion block:

```typescript
      if (state.phase === 'complete') {
        const durationSec = Math.round((Date.now() - startTimeRef.current) / 1000);
        addSession({
```

to:

```typescript
      if (state.phase === 'complete') {
        const durationSec = Math.round(duration);
        addSession({
```

and change the start call near the end of `handleStart`:

```typescript
    runner.start(cues);
```

to:

```typescript
    runner.start(cues, duration);
```

- [ ] **Step 3: Remove the now-unused `startTimeRef`**

Delete this line from the component body (near the other refs):

```typescript
  const startTimeRef = useRef<number>(0);
```

- [ ] **Step 4: Typecheck, lint, and run the full suite**

Run: `npm run typecheck && npm run lint && npm test`
Expected: PASS — no `tsc` errors (no unused `startTimeRef`, `duration` in scope where used),
Biome clean, all unit tests green.

- [ ] **Step 5: Commit**

```bash
git add "app/(tabs)/practice/session.tsx"
git commit -m "feat(session): complete + record durationSec from the timeline, not Date.now"
```

---

## Task 5: Retire the fixed follow-ups

**Files:**
- Modify: `docs/FOLLOWUPS.md`

- [ ] **Step 1: Delete the M5 and M6 bullets**

In `docs/FOLLOWUPS.md`, remove the entire **M5** bullet and the entire **M6** bullet under
"Accepted minors (from the final code review)" — both are fixed by this change (completion now
honors the threeWhistle reset-pause tail; `durationSec` comes from the timeline). Leave the
"Residual setup" and "Bigger optional directions" sections untouched.

- [ ] **Step 2: Commit**

```bash
git add docs/FOLLOWUPS.md
git commit -m "docs: retire M5 + M6 follow-ups (fixed by single-clock session)"
```

---

## Self-review notes (author)

- **Spec coverage:** visual-label drift → Task 3 (label from `cueAt(engine.currentTime)`); M5 →
  Task 1 (`duration` includes the reset-pause tail) + Task 3 (complete at `duration`); M6 → Task 4
  (`durationSec = Math.round(duration)`). Follow-ups doc updated in Task 5.
- **Type consistency:** `buildTimeline` returns `{ cues, duration }` (Task 1) and every caller —
  the timeline tests (Task 1), and `session.tsx` (Task 4) — destructures that shape. `cueAt`
  (Task 2) is consumed by the runner (Task 3). `start(cues, duration)` (Task 3) matches the call
  site (Task 4). `EngineLike.currentTime` (Task 3) is satisfied by `AudioEngine.currentTime`
  (already a getter) and by the fake engine in the test.
- **No new deps; no screen-API or testID changes** → Maestro flows unaffected.
