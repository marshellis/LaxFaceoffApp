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
