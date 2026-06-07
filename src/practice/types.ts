export type CueKind = 'down' | 'set' | 'whistle';

export type PracticeType = 'downSetWhistle' | 'rapidClamp' | 'threeWhistle';

/** Min/max seconds for a randomized gap. */
export interface DelayRange {
  min: number;
  max: number;
}

export interface PracticeConfig {
  type: PracticeType;
  numberOfReps: number;
  /** Gaps used per practice type; keys are a superset, only the relevant ones are read. */
  downToSet?: DelayRange; // downSetWhistle
  setToWhistle?: DelayRange; // downSetWhistle
  restBetween?: DelayRange; // all
  clampToPull?: DelayRange; // threeWhistle
  pullToPop?: DelayRange; // threeWhistle
  resetPause?: DelayRange; // threeWhistle
}

/** One cue scheduled at an absolute offset (seconds) from sequence start. */
export interface ScheduledCue {
  kind: CueKind;
  at: number; // seconds from t0
  rep: number; // 1-based
  label: string; // 'Down!', 'Set!', 'GO!', 'CLAMP!', etc. (for UI)
}
