import { useCallback, useEffect, useRef, useState } from 'react';
import type { CueKind } from '../practice/types';
import { useSettingsStore } from '../state/settingsStore';
import { AudioEngine } from './AudioEngine';
import { toArrayBuffer } from './loadAsset';
import { configurePlaybackSession } from './session';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const WHISTLE_ASSET = require('../../assets/sounds/whistle.mp3') as number;

export interface UseAudioEngineResult {
  /** The underlying AudioEngine instance (null before first load). */
  engine: AudioEngine | null;
  /** True once all cue buffers have been loaded successfully. */
  ready: boolean;
  /**
   * Re-loads cue buffers from scratch (e.g. after a custom sound is saved).
   * Safe to call multiple times; guards against concurrent loads.
   */
  reload: () => Promise<void>;
  /**
   * Passthrough to engine.resume(). Call inside a user-gesture handler on web
   * to satisfy autoplay policy. No-op when engine is not yet created.
   */
  resume: () => Promise<void>;
}

export function useAudioEngine(): UseAudioEngineResult {
  const engineRef = useRef<AudioEngine | null>(null);
  const initedRef = useRef(false);
  const loadingRef = useRef(false);

  const [ready, setReady] = useState(false);

  const customSounds = useSettingsStore((s) => s.customSounds);
  // Keep a ref so the load callback always sees the latest URIs without needing
  // to be part of the dependency array (avoids reload loops).
  const customSoundsRef = useRef(customSounds);
  customSoundsRef.current = customSounds;

  const loadBuffers = useCallback(async (): Promise<void> => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setReady(false);

    try {
      const engine = engineRef.current;
      if (!engine) return;

      const sounds = customSoundsRef.current;
      const sources: { kind: CueKind; arrayBuffer: ArrayBuffer }[] = [];

      // Whistle: custom URI overrides the bundled default.
      const whistleSource: number | string = sounds.whistle ?? WHISTLE_ASSET;
      sources.push({ kind: 'whistle', arrayBuffer: await toArrayBuffer(whistleSource) });

      // Down / Set: only load when a custom URI is configured (no bundled default).
      if (sounds.down) {
        sources.push({ kind: 'down', arrayBuffer: await toArrayBuffer(sounds.down) });
      }
      if (sounds.set) {
        sources.push({ kind: 'set', arrayBuffer: await toArrayBuffer(sounds.set) });
      }

      await engine.load(sources);
      setReady(true);
    } catch (err) {
      console.error('[useAudioEngine] Failed to load audio buffers:', err);
      // Leave ready=false; the app can surface a graceful error state.
    } finally {
      loadingRef.current = false;
    }
  }, []); // no deps — reads from refs

  // One-time init: create engine, configure session, load buffers.
  useEffect(() => {
    if (initedRef.current) return;
    initedRef.current = true;

    (async () => {
      try {
        engineRef.current = new AudioEngine();
        await configurePlaybackSession();
      } catch (err) {
        console.error('[useAudioEngine] Failed to create AudioEngine or configure session:', err);
        return;
      }
      await loadBuffers();
    })();
  }, [loadBuffers]);

  const reload = useCallback(async (): Promise<void> => {
    await loadBuffers();
  }, [loadBuffers]);

  const resume = useCallback(async (): Promise<void> => {
    try {
      await engineRef.current?.resume();
    } catch (err) {
      console.error('[useAudioEngine] resume() failed:', err);
    }
  }, []);

  return { engine: engineRef.current, ready, reload, resume };
}
