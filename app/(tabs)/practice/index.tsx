import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { PracticeType } from '../../../src/practice/types';
import { useSettingsStore } from '../../../src/state/settingsStore';
import { Colors } from '../../../src/theme/colors';

interface DrillOption {
  type: PracticeType;
  name: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

const DRILL_OPTIONS: DrillOption[] = [
  {
    type: 'downSetWhistle',
    name: 'Down-Set-Whistle',
    description:
      'Classic face-off sequence. Practice reacting to the Down, Set, and Whistle commands with randomized timing.',
    icon: 'flag',
  },
  {
    type: 'rapidClamp',
    name: 'Rapid Clamp',
    description:
      'Train explosive clamp speed. Focuses on fast reaction and top-hand clamping technique.',
    icon: 'flash',
  },
  {
    type: 'threeWhistle',
    name: 'Three Whistle',
    description:
      'Full three-whistle sequence: Clamp, Pull, and Pop. Builds complete face-off movement patterns.',
    icon: 'musical-notes',
  },
];

export default function PracticeSelectionScreen() {
  const router = useRouter();
  const setSelectedType = useSettingsStore((s) => s.setSelectedType);

  function handleSelect(type: PracticeType) {
    setSelectedType(type);
    router.push('/(tabs)/practice/session');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View testID="practice-selection" style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Select Practice Type</Text>
          <Text style={styles.subtitle}>Choose your training focus</Text>
        </View>

        {/* Practice Type Options */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.optionList}>
            {DRILL_OPTIONS.map((drill) => (
              <Pressable
                key={drill.type}
                testID={`select-${drill.type}`}
                style={({ pressed }) => [styles.optionCard, pressed && styles.optionCardPressed]}
                onPress={() => handleSelect(drill.type)}
              >
                <View style={styles.optionContent}>
                  <View style={styles.iconContainer}>
                    <Ionicons name={drill.icon} size={32} color={Colors.primary} />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.optionName}>{drill.name}</Text>
                    <Text style={styles.optionDescription}>{drill.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
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
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSecondary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  optionList: {
    paddingVertical: 20,
  },
  optionCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionCardPressed: {
    opacity: 0.75,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  textContainer: {
    flex: 1,
  },
  optionName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 6,
  },
  optionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
