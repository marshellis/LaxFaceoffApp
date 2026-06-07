import type { ScheduledCue } from './types';

export type Phase = 'ready' | 'running' | 'paused' | 'complete';
export interface RunnerState {
  phase: Phase;
  rep: number;
  label?: string;
}

interface EngineLike {
  scheduleSequence(cues: ScheduledCue[]): void;
  stopAll(): void;
}

export class PracticeRunner {
  private listeners: Array<(s: RunnerState) => void> = [];
  private timers: ReturnType<typeof setTimeout>[] = [];
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

  start(cues: ScheduledCue[]): void {
    this.stop();
    this.engine.scheduleSequence(cues);
    this.emit({ phase: 'running', rep: 1 });
    for (const cue of cues) {
      this.timers.push(
        setTimeout(() => this.emit({ label: cue.label, rep: cue.rep }), cue.at * 1000),
      );
    }
    const end = cues.length ? cues[cues.length - 1].at * 1000 + 1 : 0;
    this.timers.push(setTimeout(() => this.emit({ phase: 'complete', label: undefined }), end));
  }

  stop(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.engine.stopAll();
    this.emit({ phase: 'ready', rep: 0, label: undefined });
  }
}
