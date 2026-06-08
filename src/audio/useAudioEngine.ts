import { useCallback, useEffect, useState } from 'react';
import type { CueKind } from '@/src/practice/types';
import { type CustomSounds, useSettingsStore } from '@/src/state/settingsStore';
import { AudioEngine } from './AudioEngine';
import { toArrayBuffer } from './loadAsset';
import { configurePlaybackSession } from './session';

// Bundled default cue assets. Each is pre-rendered audio so Down/Set/Whistle
// all play on the audio clock (no JS-thread setTimeout / TTS in the timing path).
/* eslint-disable @typescript-eslint/no-require-imports */
const DEFAULT_ASSETS: Record<CueKind, number> = {
  down: require('../../assets/sounds/down.wav') as number,
  set: require('../../assets/sounds/set.wav') as number,
  whistle: require('../../assets/sounds/whistle.mp3') as number,
};
/* eslint-enable @typescript-eslint/no-require-imports */

const CUE_KINDS: CueKind[] = ['down', 'set', 'whistle'];

// ---------------------------------------------------------------------------
// Module-level singleton: ONE AudioEngine, ONE AudioContext, ONE set of decoded
// buffers shared by every caller of useAudioEngine(). Lives here (not in a
// per-component ref) so navigating between screens reuses the same engine.
// ---------------------------------------------------------------------------
let sharedEngine: AudioEngine | null = null;
let sessionConfigured = false;
let loadPromise: Promise<void> | null = null;
// Bumped whenever buffers finish (re)loading so subscribed hooks re-render.
let loadVersion = 0;
let lastLoadedSounds: CustomSounds | null = null;
// Set when the most recent load failed; cleared on the next success. Lets the UI
// show a retry affordance instead of a button stuck on "LOADING…" forever.
let lastError: Error | null = null;
const readyListeners = new Set<() => void>();

function notifyReady(): void {
  loadVersion += 1;
  for (const l of readyListeners) l();
}

/** Create the engine + configure the playback session exactly once. */
async function ensureEngine(): Promise<AudioEngine> {
  if (!sharedEngine) {
    sharedEngine = new AudioEngine();
  }
  if (!sessionConfigured) {
    sessionConfigured = true;
    try {
      await configurePlaybackSession();
    } catch (err) {
      console.error('[useAudioEngine] Failed to configure playback session:', err);
    }
  }
  return sharedEngine;
}

/**
 * Load (or reload) every default cue buffer into the shared engine. A custom URI
 * in settingsStore.customSounds[kind] OVERRIDES the corresponding bundled default.
 * Guards against concurrent/double init by reusing the in-flight promise.
 */
function loadBuffers(force = false): Promise<void> {
  if (loadPromise && !force) return loadPromise;

  const sounds = useSettingsStore.getState().customSounds;

  loadPromise = (async () => {
    try {
      const engine = await ensureEngine();

      const sources = await Promise.all(
        CUE_KINDS.map(async (kind) => {
          // Custom URI overrides the bundled default for this cue.
          const source: number | string = sounds[kind] ?? DEFAULT_ASSETS[kind];
          return { kind, arrayBuffer: await toArrayBuffer(source) };
        }),
      );

      await engine.load(sources);
      lastLoadedSounds = sounds;
      lastError = null;
      notifyReady();
    } catch (err) {
      console.error('[useAudioEngine] Failed to load audio buffers:', err);
      // Surface a graceful error state so the screen can offer a retry.
      lastError = err instanceof Error ? err : new Error(String(err));
      notifyReady();
      throw err;
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}

export interface UseAudioEngineResult {
  /** The shared AudioEngine instance (null before first creation). */
  engine: AudioEngine | null;
  /** True once all cue buffers have been loaded successfully. */
  ready: boolean;
  /** Set when the most recent load failed (and not yet retried successfully). */
  error: Error | null;
  /**
   * Re-loads cue buffers from scratch (e.g. after a custom sound is saved, or to
   * retry after a failure). Safe to call multiple times; guards against concurrent loads.
   */
  reload: () => Promise<void>;
  /**
   * Passthrough to engine.resume(). Call inside a user-gesture handler on web
   * to satisfy autoplay policy.
   */
  resume: () => Promise<void>;
}

export function useAudioEngine(): UseAudioEngineResult {
  // Re-render whenever the shared buffers finish loading.
  const [, setTick] = useState(loadVersion);
  const customSounds = useSettingsStore((s) => s.customSounds);

  // Subscribe to ready notifications from the module singleton.
  useEffect(() => {
    const onReady = () => setTick(loadVersion);
    readyListeners.add(onReady);
    return () => {
      readyListeners.delete(onReady);
    };
  }, []);

  // Kick off the initial load once (idempotent at module scope).
  useEffect(() => {
    void loadBuffers().catch(() => {
      /* error already logged; ready stays false */
    });
  }, []);

  // I4: reload buffers when customSounds changes so a freshly recorded sound is
  // used without an app restart, even on an already-mounted screen.
  useEffect(() => {
    if (lastLoadedSounds === null) return; // initial load handles first paint
    if (lastLoadedSounds === customSounds) return; // unchanged reference
    void loadBuffers(true).catch(() => {
      /* error already logged */
    });
  }, [customSounds]);

  const reload = useCallback(async (): Promise<void> => {
    await loadBuffers(true);
  }, []);

  const resume = useCallback(async (): Promise<void> => {
    try {
      await sharedEngine?.resume();
    } catch (err) {
      console.error('[useAudioEngine] resume() failed:', err);
    }
  }, []);

  const ready = lastLoadedSounds !== null;

  return { engine: sharedEngine, ready, error: lastError, reload, resume };
}
