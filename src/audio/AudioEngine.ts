import { type AudioBuffer, AudioContext } from 'react-native-audio-api';
import type { CueKind, ScheduledCue } from '@/src/practice/types';

type Buffers = Partial<Record<CueKind, AudioBuffer>>;

export class AudioEngine {
  private ctx: AudioContext;
  private buffers: Buffers = {};
  private scheduled: Array<{ stop: () => void }> = [];

  constructor(ctx?: AudioContext) {
    this.ctx = ctx ?? new AudioContext({ sampleRate: 44100 });
  }

  /** Decode each source into an AudioBuffer once (no cold-start latency at play time). */
  async load(sources: { kind: CueKind; arrayBuffer: ArrayBuffer }[]): Promise<void> {
    for (const s of sources) {
      this.buffers[s.kind] = await this.ctx.decodeAudioData(s.arrayBuffer);
    }
  }

  /** Schedule every cue on the audio clock. Sample-accurate; immune to JS-thread jitter. */
  scheduleSequence(cues: ScheduledCue[]): void {
    const t0 = this.ctx.currentTime;
    for (const cue of cues) {
      const buffer = this.buffers[cue.kind];
      if (!buffer) continue;
      const node = this.ctx.createBufferSource();
      node.buffer = buffer;
      node.connect(this.ctx.destination);
      node.start(t0 + cue.at);
      this.scheduled.push({ stop: () => node.stop() });
    }
  }

  /** Stop everything scheduled/playing immediately. */
  stopAll(): void {
    for (const s of this.scheduled) {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    }
    this.scheduled = [];
  }

  async suspend(): Promise<void> {
    await this.ctx.suspend();
  }
  async resume(): Promise<void> {
    await this.ctx.resume();
  }
  get currentTime(): number {
    return this.ctx.currentTime;
  }
}
