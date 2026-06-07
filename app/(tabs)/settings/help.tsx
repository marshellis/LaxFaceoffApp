import { useRouter } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../../src/theme/colors';

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoCardTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function HelpScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>{'‹ Settings'}</Text>
          </Pressable>
          <Text style={styles.title}>Help & About</Text>
        </View>

        <View testID="settings-help-screen">
          {/* App Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Information</Text>

            <InfoCard title="Version">
              <Text style={styles.infoText}>1.0.0</Text>
            </InfoCard>

            <InfoCard title="About">
              <Text style={styles.infoText}>
                Lacrosse Face-off Trainer helps players practice face-off timing and reaction speed
                with customizable drills and variable timing sequences.
              </Text>
            </InfoCard>
          </View>

          {/* How to Use */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How to Use</Text>

            <InfoCard title="Getting Started">
              <Text style={styles.infoText}>
                {'1. Choose a practice type from the home screen\n'}
                {'2. Adjust timing settings for each practice type\n'}
                {'3. Record custom audio or use the default voice\n'}
                {'4. Start practicing and improve your reaction time!'}
              </Text>
            </InfoCard>

            <InfoCard title="Practice Types">
              <Text style={styles.infoText}>
                <Text style={styles.boldText}>Down Set Whistle: </Text>
                {'Traditional face-off sequence. You hear "Down", then "Set", then a whistle. '}
                {'React to the whistle as fast as possible.\n\n'}
                <Text style={styles.boldText}>Rapid Clamp: </Text>
                {'Continuous clamping practice. A whistle fires repeatedly '}
                {'with a randomized rest between each rep. Build muscle memory through volume.\n\n'}
                <Text style={styles.boldText}>Three Whistle Drill: </Text>
                {'Clamp-Pull-Pop sequence. Three distinct whistles fire in quick succession. '}
                {'A reset pause gives you time to reset between reps.'}
              </Text>
            </InfoCard>
          </View>

          {/* Tips */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Training Tips</Text>

            <InfoCard title="Timing Variation">
              <Text style={styles.infoText}>
                {'Use min/max ranges to keep your training unpredictable. '}
                {
                  'If you always train with fixed timing, you will react to the pattern — not the cue. '
                }
                {'Wider ranges force you to stay alert.'}
              </Text>
            </InfoCard>

            <InfoCard title="Reps">
              <Text style={styles.infoText}>
                {'Start with fewer reps (5–8) to focus on quality. '}
                {'Increase reps as your technique becomes consistent. '}
                {'Fatigue late in a set reveals bad habits — that is where growth happens.'}
              </Text>
            </InfoCard>

            <InfoCard title="Custom Sounds">
              <Text style={styles.infoText}>
                {
                  "Record your coach's voice or a real whistle for the most game-realistic training. "
                }
                {'Go to Settings > Custom Sounds to record each cue.'}
              </Text>
            </InfoCard>
          </View>

          {/* Troubleshooting */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Troubleshooting</Text>

            <InfoCard title="Audio Issues">
              <Text style={styles.infoText}>
                {'• Make sure your device volume is turned up\n'}
                {'• Check that silent mode is disabled\n'}
                {'• Try recording new custom audio\n'}
                {'• Restart the app if audio stops working'}
              </Text>
            </InfoCard>

            <InfoCard title="Performance Issues">
              <Text style={styles.infoText}>
                {'• Close other apps running in the background\n'}
                {'• Restart your device\n'}
                {'• Make sure you have enough storage space\n'}
                {'• Update to the latest app version'}
              </Text>
            </InfoCard>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Made with love for lacrosse players</Text>
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
    marginTop: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: 'bold',
    color: Colors.primary,
  },
  footer: {
    marginTop: 32,
    marginBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});
