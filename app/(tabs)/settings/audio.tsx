import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { CustomSounds } from '../../../src/state/settingsStore';
import { useSettingsStore } from '../../../src/state/settingsStore';
import { Colors } from '../../../src/theme/colors';

type SoundKind = keyof CustomSounds;

const SOUND_KINDS: { kind: SoundKind; label: string }[] = [
  { kind: 'down', label: 'Down' },
  { kind: 'set', label: 'Set' },
  { kind: 'whistle', label: 'Whistle' },
];

export default function AudioScreen() {
  const router = useRouter();
  const customSounds = useSettingsStore((s) => s.customSounds);
  const setCustomSound = useSettingsStore((s) => s.setCustomSound);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>{'‹ Settings'}</Text>
          </Pressable>
          <Text style={styles.title}>Custom Sounds</Text>
        </View>

        <View testID="settings-audio-screen" style={styles.section}>
          <Text style={styles.sectionSubtitle}>
            Record custom audio cues for each voice command. Tap "Record" to create a new recording.
          </Text>

          {SOUND_KINDS.map(({ kind, label }) => {
            const hasCustom = Boolean(customSounds[kind]);
            return (
              <View key={kind} style={styles.soundRow}>
                <View style={styles.soundInfo}>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name={hasCustom ? 'mic' : 'mic-outline'}
                      size={24}
                      color={hasCustom ? Colors.accent : Colors.textSecondary}
                    />
                  </View>
                  <View>
                    <Text style={styles.soundLabel}>{label}</Text>
                    <Text style={styles.soundStatus}>
                      {hasCustom ? 'Custom recording set' : 'Default'}
                    </Text>
                  </View>
                </View>

                <View style={styles.soundActions}>
                  <Pressable
                    testID={`audio-${kind}-record`}
                    style={styles.recordButton}
                    onPress={() => router.push(`/(tabs)/settings/record?kind=${kind}`)}
                  >
                    <Ionicons name="mic-outline" size={16} color={Colors.primary} />
                    <Text style={styles.recordButtonText}>Record</Text>
                  </Pressable>

                  {hasCustom && (
                    <Pressable
                      testID={`audio-${kind}-reset`}
                      style={styles.resetButton}
                      onPress={() => setCustomSound(kind, undefined)}
                    >
                      <Text style={styles.resetButtonText}>Reset</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Info card */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>About Custom Sounds</Text>
            <Text style={styles.infoText}>
              Custom recordings replace the default text-to-speech audio for each cue. Each
              recording should be a short, clear command (1–2 seconds). Tap "Reset" to restore the
              default voice for that cue.
            </Text>
          </View>
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
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSecondary,
  },
  backButton: {
    marginBottom: 4,
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
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  soundRow: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  soundInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  soundLabel: {
    fontSize: 17,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  soundStatus: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  soundActions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    backgroundColor: Colors.background,
    gap: 4,
  },
  recordButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  resetButton: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.error,
    backgroundColor: Colors.background,
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.error,
  },
  infoSection: {
    marginTop: 12,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
