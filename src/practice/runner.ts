import { cueAt } from './timeline';
import type { ScheduledCue } from './types';

export type Phase = 'ready' | 'running' | 'paused' | 'complete';
export interface RunnerState {
  phase: Phase;
  rep: number;
  label?: string;
}

/** Just the bits of AudioEngine the runner needs (so tests can fake it). */
interface EngineLike {
  scheduleSequence(cues: ScheduledCue[]): void;
  stopAll(): void;
  readonly currentTime: number;
}

/** How often the loop reads the audio clock to refresh the visible label (ms). */
const TICK_MS = 100;

export class PracticeRunner {
  private listeners: Array<(s: RunnerState) => void> = [];
  private interval: ReturnType<typeof setInterval> | null = null;
  private cues: ScheduledCue[] = [];
  private duration = 0;
  private t0 = 0;
  private state: RunnerState = { phase: 'ready', rep: 0 };

  constructor(private engine: EngineLike) {}

  on(fn: (s: RunnerState) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private emit(next: Partial<RunnerState>) {
    this.state = { ...this.state, ...next };
    for (const l of this.listeners) l(this.state);
  }

  /** Schedule the cues on the audio clock and start the UI loop that follows it. */
  start(cues: ScheduledCue[], duration: number): void {
    this.stop();
    this.cues = cues;
    this.duration = duration;
    this.t0 = this.engine.currentTime;
    this.engine.scheduleSequence(cues);
    this.emit({ phase: 'running', rep: cues[0]?.rep ?? 1, label: undefined });
    this.tick(); // paint the first cue immediately
    this.interval = setInterval(() => this.tick(), TICK_MS);
  }

  /** One read of the audio clock: update the label, or complete at the end. */
  private tick(): void {
    const elapsed = this.engine.currentTime - this.t0;
    if (elapsed >= this.duration) {
      this.clearLoop();
      // Natural finish: leave the last cue ringing — do NOT stopAll.
      this.emit({ phase: 'complete', label: undefined });
      return;
    }
    const cue = cueAt(this.cues, elapsed);
    if (cue) this.emit({ label: cue.label, rep: cue.rep });
  }

  private clearLoop(): void {
    if (this.interval !== null) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /** User-initiated stop: cut the audio and reset to ready. */
  stop(): void {
    this.clearLoop();
    this.engine.stopAll();
    this.emit({ phase: 'ready', rep: 0, label: undefined });
  }
}
