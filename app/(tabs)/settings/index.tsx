import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../../src/theme/colors';

interface MenuItemProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  testID: string;
  onPress: () => void;
}

function MenuItem({ title, subtitle, icon, testID, onPress }: MenuItemProps) {
  return (
    <Pressable testID={testID} style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={24} color={Colors.primary} />
        </View>
        <View style={styles.menuItemText}>
          <Text style={styles.menuItemTitle}>{title}</Text>
          <Text style={styles.menuItemSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
    </Pressable>
  );
}

export default function SettingsIndexScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View testID="settings-screen" style={styles.section}>
          <MenuItem
            testID="settings-practice-types"
            title="Practice Timing"
            subtitle="Adjust timing for each drill"
            icon="timer-outline"
            onPress={() => router.push('/(tabs)/settings/practice-types')}
          />
          <MenuItem
            testID="settings-audio"
            title="Custom Sounds"
            subtitle="Record custom audio cues"
            icon="mic-outline"
            onPress={() => router.push('/(tabs)/settings/audio')}
          />
          <MenuItem
            testID="settings-help"
            title="Help & About"
            subtitle="App info and how-to guides"
            icon="help-circle-outline"
            onPress={() => router.push('/(tabs)/settings/help')}
          />
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSecondary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 20,
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
