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
  jest.advanceTimersByTime(0);
  expect(states).toContain('Down!');
  jest.advanceTimersByTime(1000);
  expect(states).toContain('GO!');
  jest.advanceTimersByTime(10);
  expect(states).toContain('complete');
  jest.useRealTimers();
});
