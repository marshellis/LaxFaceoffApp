import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '../../src/theme/colors';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View testID="home-screen" style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Lacrosse</Text>
          <Text style={styles.subtitle}>Face-off Trainer</Text>
        </View>

        {/* Intro */}
        <Text style={styles.intro}>
          Sharpen your face-off skills with precision timing drills. Choose a drill type, set your
          reps, and train with audio cues.
        </Text>

        {/* Start Practice Button */}
        <TouchableOpacity
          testID="home-start-button"
          style={styles.startButton}
          onPress={() => router.push('/(tabs)/practice')}
          activeOpacity={0.8}
        >
          <Ionicons name="play-circle" size={60} color={Colors.textLight} />
          <Text style={styles.startButtonText}>START PRACTICE</Text>
        </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 24,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  intro: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
    maxWidth: 320,
  },
  startButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 30,
    paddingHorizontal: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.accent,
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  startButtonText: {
    color: Colors.textLight,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
});
