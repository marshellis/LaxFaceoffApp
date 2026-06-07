import { randomDelay } from './random';
import type { PracticeConfig, ScheduledCue } from './types';

export function buildTimeline(
  cfg: PracticeConfig,
  rng: () => number = Math.random,
): ScheduledCue[] {
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
