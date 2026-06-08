import { Ionicons } from '@expo/vector-icons';
import {
  AudioModule,
  type AudioPlayer,
  createAudioPlayer,
  RecordingPresets,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { configurePlaybackSession, configureRecordingSession } from '@/src/audio/session';
import { useSettingsStore } from '@/src/state/settingsStore';
import { Colors } from '@/src/theme/colors';

type SoundKind = 'down' | 'set' | 'whistle';

const KIND_LABELS: Record<SoundKind, string> = {
  down: 'Down Command',
  set: 'Set Command',
  whistle: 'Whistle Sound',
};

function isValidKind(value: unknown): value is SoundKind {
  return value === 'down' || value === 'set' || value === 'whistle';
}

export default function RecordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ kind?: string }>();
  const kind: SoundKind = isValidKind(params.kind) ? params.kind : 'down';
  const label = KIND_LABELS[kind];

  const setCustomSound = useSettingsStore((s) => s.setCustomSound);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder);

  // Preview player ref so we can clean up on unmount
  const previewPlayerRef = useRef<AudioPlayer | null>(null);

  const requestMicPermission = useCallback(async () => {
    try {
      const { granted } = await AudioModule.requestRecordingPermissionsAsync();
      setHasPermission(granted);
    } catch {
      setHasPermission(false);
    }
  }, []);

  // --- Permission request on mount + preview player cleanup on unmount ---
  useEffect(() => {
    requestMicPermission();
    return () => {
      if (previewPlayerRef.current) {
        previewPlayerRef.current.remove();
        previewPlayerRef.current = null;
      }
    };
  }, [requestMicPermission]);

  // --- Recording controls ---
  async function handleRecord() {
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Microphone access is needed to record audio. Please grant permission and try again.',
      );
      return;
    }
    try {
      // Fix: configure the iOS audio session for recording BEFORE starting
      await configureRecordingSession();
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (err) {
      console.error('Failed to start recording:', err);
      Alert.alert('Recording Error', 'Could not start recording. Please try again.');
    }
  }

  async function handleStop() {
    try {
      await recorder.stop();
      const uri = recorder.uri;
      // Fix: restore playback session (loud speaker) immediately after stopping
      await configurePlaybackSession();
      if (uri) {
        setRecordingUri(uri);
        // Create a fresh preview player
        if (previewPlayerRef.current) {
          previewPlayerRef.current.remove();
        }
        previewPlayerRef.current = createAudioPlayer(uri);
      } else {
        Alert.alert(
          'Recording Error',
          'Recording failed — no audio was captured. Please try again.',
        );
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
      Alert.alert('Recording Error', 'Could not stop recording. Please try again.');
      await configurePlaybackSession();
    }
  }

  // --- Preview ---
  function handlePreview() {
    const player = previewPlayerRef.current;
    if (!player) return;
    // Rewind and play
    player.seekTo(0).then(() => {
      player.play();
    });
  }

  // --- Save ---
  function handleSave() {
    if (!recordingUri) return;
    setCustomSound(kind, recordingUri);
    router.back();
  }

  // --- Discard ---
  function handleDiscard() {
    if (previewPlayerRef.current) {
      previewPlayerRef.current.remove();
      previewPlayerRef.current = null;
    }
    setRecordingUri(null);
  }

  // --- Derived UI state ---
  const isRecording = state.isRecording;
  const hasRecording = Boolean(recordingUri) && !isRecording;

  function getRecordButtonStyle() {
    if (isRecording) return [styles.recordButton, styles.recordButtonActive];
    if (hasRecording) return [styles.recordButton, styles.recordButtonRecorded];
    return styles.recordButton;
  }

  function getRecordIcon(): keyof typeof Ionicons.glyphMap {
    if (isRecording) return 'stop';
    if (hasRecording) return 'checkmark';
    return 'mic';
  }

  function getStatusText() {
    if (!hasPermission) return 'Microphone permission required';
    if (isRecording) return 'Recording… tap to stop';
    if (hasRecording) return 'Recording complete!';
    return 'Tap to start recording';
  }

  // --- Permission denied screen ---
  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container} testID="record-screen">
        <View style={styles.permissionContainer}>
          <Ionicons name="mic-off-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.permissionTitle}>Microphone Access Required</Text>
          <Text style={styles.permissionText}>
            This screen needs microphone access to record custom audio cues.
          </Text>
          <Pressable
            testID="record-permission"
            style={styles.permissionButton}
            onPress={requestMicPermission}
          >
            <Text style={styles.permissionButtonText}>Request Permission</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} testID="record-screen">
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>{'‹ Custom Sounds'}</Text>
          </Pressable>
          <Text style={styles.title}>Record Custom Sound</Text>
          <Text style={styles.subtitle}>{label}</Text>
        </View>

        {/* Record button */}
        <View style={styles.recordingSection}>
          <Pressable
            testID="record-button"
            style={getRecordButtonStyle()}
            onPress={isRecording ? handleStop : hasRecording ? undefined : handleRecord}
            disabled={hasRecording}
            accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
          >
            <Ionicons name={getRecordIcon()} size={52} color={Colors.textLight} />
          </Pressable>

          <Text style={styles.recordingStatus}>{getStatusText()}</Text>

          {isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingDotText}>REC</Text>
            </View>
          )}
        </View>

        {/* Post-recording controls */}
        {hasRecording && (
          <View style={styles.postRecordingSection}>
            <Pressable
              testID="record-preview"
              style={styles.previewButton}
              onPress={handlePreview}
              accessibilityLabel="Preview recording"
            >
              <Ionicons name="play" size={22} color={Colors.primary} />
              <Text style={styles.previewButtonText}>Preview</Text>
            </Pressable>

            <View style={styles.saveDiscardRow}>
              <Pressable
                testID="record-discard"
                style={styles.discardButton}
                onPress={handleDiscard}
                accessibilityLabel="Discard recording"
              >
                <Text style={styles.discardButtonText}>Discard</Text>
              </Pressable>

              <Pressable
                testID="record-save"
                style={styles.saveButton}
                onPress={handleSave}
                accessibilityLabel="Save recording"
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Recording Tips:</Text>
          {[
            'Hold your device close to your mouth',
            'Speak clearly and loudly',
            'Keep recordings short (1–2 seconds)',
            'Record in a quiet environment',
          ].map((tip) => (
            <Text key={tip} style={styles.tipText}>
              {'• '}
              {tip}
            </Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // Permission screen
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionButton: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
    backgroundColor: Colors.accent,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textLight,
  },
  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSecondary,
  },
  backButton: {
    marginBottom: 8,
  },
  backText: {
    fontSize: 16,
    color: Colors.accent,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  // Recording section
  recordingSection: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 20,
  },
  recordButton: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: Colors.error,
  },
  recordButtonRecorded: {
    backgroundColor: Colors.success,
  },
  recordingStatus: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.error,
  },
  recordingDotText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.error,
    letterSpacing: 1,
  },
  // Post-recording controls
  postRecordingSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 20,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  saveDiscardRow: {
    flexDirection: 'row',
    gap: 16,
  },
  discardButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.error,
  },
  discardButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
    backgroundColor: Colors.accent,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textLight,
  },
  // Tips
  tipsContainer: {
    marginTop: 40,
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 14,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
