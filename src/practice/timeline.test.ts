import { makeRng } from './random';
import { buildTimeline } from './timeline';
import type { PracticeConfig } from './types';

const dsw: PracticeConfig = {
  type: 'downSetWhistle',
  numberOfReps: 2,
  downToSet: { min: 1, max: 1 },
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
  expect(cues[3].at).toBeCloseTo(4);
});

test('rapidClamp: one whistle per rep separated by restBetween', () => {
  const cfg: PracticeConfig = {
    type: 'rapidClamp',
    numberOfReps: 3,
    restBetween: { min: 1, max: 1 },
  };
  const cues = buildTimeline(cfg, makeRng(1));
  expect(cues.map((c) => c.kind)).toEqual(['whistle', 'whistle', 'whistle']);
  expect(cues[1].at - cues[0].at).toBeCloseTo(1);
});

test('threeWhistle: clamp,pull,pop per rep', () => {
  const cfg: PracticeConfig = {
    type: 'threeWhistle',
    numberOfReps: 1,
    clampToPull: { min: 1, max: 1 },
    pullToPop: { min: 1, max: 1 },
    resetPause: { min: 1, max: 1 },
    restBetween: { min: 1, max: 1 },
  };
  const cues = buildTimeline(cfg, makeRng(1));
  expect(cues.map((c) => c.label)).toEqual(['CLAMP!', 'PULL!', 'POP!']);
  expect(cues[1].at).toBeCloseTo(1);
  expect(cues[2].at).toBeCloseTo(2);
});
