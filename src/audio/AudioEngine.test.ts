jest.mock('react-native-audio-api', () => ({
  AudioContext: class {},
  AudioManager: { setAudioSessionOptions: jest.fn(), setAudioSessionActivity: jest.fn() },
}));

import type { ScheduledCue } from '@/src/practice/types';
import { AudioEngine } from './AudioEngine';

function mockContext() {
  const started: Array<{ when: number }> = [];
  // biome-ignore lint/suspicious/noExplicitAny: intentional mock for test environment
  const ctx: any = {
    currentTime: 10,
    // biome-ignore lint/suspicious/noExplicitAny: intentional mock return type
    decodeAudioData: jest.fn(async () => ({}) as any),
    destination: {},
    createBufferSource() {
      return {
        buffer: null,
        connect() {},
        start(when: number) {
          started.push({ when });
        },
        stop() {},
      };
    },
  };
  return { ctx, started };
}

test('schedules each cue at currentTime + cue.at', () => {
  const { ctx, started } = mockContext();
  const engine = new AudioEngine(ctx);
  // biome-ignore lint/suspicious/noExplicitAny: accessing private field in test
  (engine as any).buffers = { down: {}, set: {}, whistle: {} };
  const cues: ScheduledCue[] = [
    { kind: 'down', at: 0, rep: 1, label: 'Down!' },
    { kind: 'set', at: 1.5, rep: 1, label: 'Set!' },
    { kind: 'whistle', at: 3, rep: 1, label: 'GO!' },
  ];
  engine.scheduleSequence(cues);
  expect(started.map((s) => s.when)).toEqual([10, 11.5, 13]);
});
