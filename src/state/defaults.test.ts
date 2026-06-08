import type { PracticeType } from '@/src/practice/types';
import { DEFAULT_CONFIGS, defaultConfigFor } from './defaults';

const PRACTICE_TYPES: PracticeType[] = ['downSetWhistle', 'rapidClamp', 'threeWhistle'];

/** Assert a DelayRange is present and valid. */
function expectValidRange(range: { min: number; max: number } | undefined): void {
  expect(range).toBeDefined();
  if (!range) return; // narrow for TS
  expect(range.min).toBeLessThanOrEqual(range.max);
  expect(typeof range.min).toBe('number');
  expect(typeof range.max).toBe('number');
}

describe('DEFAULT_CONFIGS', () => {
  it('has an entry for every PracticeType', () => {
    for (const type of PRACTICE_TYPES) {
      expect(DEFAULT_CONFIGS[type]).toBeDefined();
    }
  });

  it('has numberOfReps > 0 for every type', () => {
    for (const type of PRACTICE_TYPES) {
      expect(DEFAULT_CONFIGS[type].numberOfReps).toBeGreaterThan(0);
    }
  });

  it('has type field matching the record key', () => {
    for (const type of PRACTICE_TYPES) {
      expect(DEFAULT_CONFIGS[type].type).toBe(type);
    }
  });

  describe('downSetWhistle', () => {
    const cfg = DEFAULT_CONFIGS.downSetWhistle;
    it('downToSet: min <= max', () => expectValidRange(cfg.downToSet));
    it('setToWhistle: min <= max', () => expectValidRange(cfg.setToWhistle));
    it('restBetween: min <= max', () => expectValidRange(cfg.restBetween));
  });

  describe('rapidClamp', () => {
    const cfg = DEFAULT_CONFIGS.rapidClamp;
    it('restBetween: min <= max', () => expectValidRange(cfg.restBetween));
  });

  describe('threeWhistle', () => {
    const cfg = DEFAULT_CONFIGS.threeWhistle;
    it('clampToPull: min <= max', () => expectValidRange(cfg.clampToPull));
    it('pullToPop: min <= max', () => expectValidRange(cfg.pullToPop));
    it('resetPause: min <= max', () => expectValidRange(cfg.resetPause));
  });
});

describe('defaultConfigFor', () => {
  it('returns the config for the given type', () => {
    for (const type of PRACTICE_TYPES) {
      expect(defaultConfigFor(type)).toEqual(DEFAULT_CONFIGS[type]);
    }
  });

  it('returns a copy (not the same reference)', () => {
    const cfg = defaultConfigFor('downSetWhistle');
    expect(cfg).not.toBe(DEFAULT_CONFIGS.downSetWhistle);
  });
});
