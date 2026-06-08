import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAudioEngine } from '../../../src/audio/useAudioEngine';
import { makeRng } from '../../../src/practice/random';
import type { Phase } from '../../../src/practice/runner';
import { PracticeRunner } from '../../../src/practice/runner';
import { buildTimeline } from '../../../src/practice/timeline';
import { useHistoryStore } from '../../../src/state/historyStore';
import { getCurrentConfig, useSettingsStore } from '../../../src/state/settingsStore';
import { Colors } from '../../../src/theme/colors';

export default function PracticeScreen() {
  const config = useSettingsStore(getCurrentConfig);
  const addSession = useHistoryStore((s) => s.addSession);
  const router = useRouter();

  const { engine, ready, resume } = useAudioEngine();

  const [phase, setPhase] = useState<Phase>('ready');
  const [rep, setRep] = useState(0);
  const [label, setLabel] = useState<string | undefined>(undefined);

  const runnerRef = useRef<PracticeRunner | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const runCounterRef = useRef(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubRef.current?.();
      runnerRef.current?.stop();
    };
  }, []);

  async function handleStart() {
    // Tear down any previous runner
    unsubRef.current?.();
    runnerRef.current?.stop();

    await resume();

    runCounterRef.current += 1;
    const seed = Date.now() ^ (config.numberOfReps * 1000 + runCounterRef.current);
    const { cues, duration } = buildTimeline(config, makeRng(seed));

    if (!engine) return; // engine must be ready — guarded by the `ready` flag on the button
    const runner = new PracticeRunner(engine);
    runnerRef.current = runner;

    const unsub = runner.on((state) => {
      setPhase(state.phase);
      setRep(state.rep);
      setLabel(state.label);

      // All cues (Down / Set / Whistle, plus GO!, CLAMP!, PULL!, POP!) are played
      // by the engine on the audio clock, and the runner derives these label
      // updates from that same clock — so the on-screen word matches the sound.

      if (state.phase === 'complete') {
        const durationSec = Math.round(duration);
        addSession({
          type: config.type,
          reps: config.numberOfReps,
          durationSec,
          timestamp: Date.now(),
        });
      }
    });
    unsubRef.current = unsub;

    runner.start(cues, duration);
  }

  function handleStop() {
    runnerRef.current?.stop();
  }

  function handleReset() {
    setPhase('ready');
    setRep(0);
    setLabel(undefined);
  }

  const practiceTypeLabel: Record<string, string> = {
    downSetWhistle: 'Down-Set-Whistle',
    rapidClamp: 'Rapid Clamp',
    threeWhistle: 'Three Whistle',
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Back button */}
        <TouchableOpacity
          testID="session-back-button"
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Practice Session</Text>
          <Text style={styles.subtitle}>{practiceTypeLabel[config.type] ?? config.type}</Text>
        </View>

        {/* Main action area */}
        <View style={styles.actionArea}>
          {/* READY state */}
          {phase === 'ready' && (
            <View style={styles.centeredBlock}>
              <Text style={styles.readyText}>
                {config.numberOfReps} rep{config.numberOfReps !== 1 ? 's' : ''} ready
              </Text>
              <TouchableOpacity
                testID="start-practice-button"
                style={[styles.startButton, !ready && styles.disabledButton]}
                onPress={handleStart}
                activeOpacity={0.8}
                disabled={!ready}
              >
                <Ionicons name="play" size={40} color={Colors.textLight} />
                <Text style={styles.startButtonText}>{ready ? 'START' : 'LOADING…'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* RUNNING state */}
          {phase === 'running' && (
            <View testID="practice-running" style={styles.centeredBlock}>
              <Text style={styles.repText}>
                Rep {rep} of {config.numberOfReps}
              </Text>
              <Text style={styles.labelText}>{label ?? '…'}</Text>
              <TouchableOpacity
                testID="stop-practice-button"
                style={styles.stopButton}
                onPress={handleStop}
                activeOpacity={0.8}
              >
                <Ionicons name="stop" size={28} color={Colors.textLight} />
                <Text style={styles.stopButtonText}>STOP</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* COMPLETE state */}
          {phase === 'complete' && (
            <View testID="practice-complete" style={styles.centeredBlock}>
              <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
              <Text style={styles.completeText}>Practice complete!</Text>
              <TouchableOpacity
                style={styles.startButton}
                onPress={handleReset}
                activeOpacity={0.8}
              >
                <Text style={styles.startButtonText}>Practice Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSecondary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  actionArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredBlock: {
    alignItems: 'center',
    gap: 24,
  },
  readyText: {
    fontSize: 18,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 24,
    paddingHorizontal: 40,
    borderRadius: 50,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  startButtonText: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 6,
  },
  disabledButton: {
    opacity: 0.5,
  },
  repText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  labelText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
  },
  stopButton: {
    backgroundColor: Colors.error,
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stopButtonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  completeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.success,
    textAlign: 'center',
  },
});
