import type { PracticeConfig, PracticeType } from '@/src/practice/types';

/**
 * Default configurations ported from legacy/src/contexts/SettingsContext.js
 * Legacy key mapping:
 *   downMin/downMax          -> downToSet.{min,max}
 *   setMin/setMax            -> setToWhistle.{min,max}
 *   restBetweenMin/Max       -> restBetween.{min,max}
 *   clampToPullMin/Max       -> clampToPull.{min,max}
 *   pullToPopMin/Max         -> pullToPop.{min,max}
 *   resetPauseMin/Max        -> resetPause.{min,max}
 */
export const DEFAULT_CONFIGS: Record<PracticeType, PracticeConfig> = {
  downSetWhistle: {
    type: 'downSetWhistle',
    numberOfReps: 5,
    downToSet: { min: 0.5, max: 2.0 },
    setToWhistle: { min: 0.3, max: 1.5 },
    restBetween: { min: 2.0, max: 4.0 },
  },
  rapidClamp: {
    type: 'rapidClamp',
    numberOfReps: 10,
    restBetween: { min: 1.0, max: 3.0 },
  },
  threeWhistle: {
    type: 'threeWhistle',
    numberOfReps: 5,
    clampToPull: { min: 0.3, max: 1.0 },
    pullToPop: { min: 0.3, max: 1.0 },
    resetPause: { min: 3.0, max: 5.0 },
  },
};

/** Returns a shallow copy of the default config for the given practice type. */
export function defaultConfigFor(type: PracticeType): PracticeConfig {
  return { ...DEFAULT_CONFIGS[type] };
}
