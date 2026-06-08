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
  engine.stopAll.mockClear(); // start() clears any prior playback; measure only the run itself
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
  engine.stopAll.mockClear(); // measure stop()'s own call, not start()'s reset
  runner.stop();
  expect(engine.stopAll).toHaveBeenCalled();
  expect(states[states.length - 1]).toBe('ready');
  jest.useRealTimers();
});
