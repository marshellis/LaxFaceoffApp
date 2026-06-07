import type { DelayRange } from './types';

/** Mulberry32 — tiny, deterministic PRNG. Returns a function yielding [0,1). */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomDelay(range: DelayRange, rng: () => number = Math.random): number {
  return range.min + rng() * (range.max - range.min);
}
