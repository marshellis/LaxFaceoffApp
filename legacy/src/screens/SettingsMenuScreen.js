import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useSettings, PRACTICE_TYPE_CONFIGS, PRACTICE_TYPES } from '../contexts/SettingsContext';

export default function SettingsMenuScreen({ navigation }) {
  const { settings } = useSettings();

  const MenuSection = ({ title, items }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.menuItem}
          onPress={item.onPress}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name={item.icon} size={24} color={Colors.primary} />
            </View>
            <View style={styles.menuItemText}>
              <Text style={styles.menuItemTitle}>{item.title}</Text>
              {item.subtitle && (
                <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
              )}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      ))}
    </View>
  );

  const practiceTypeItems = [
    {
      title: 'Down Set Whistle',
      subtitle: 'Traditional face-off sequence',
      icon: 'play-circle',
      onPress: () => navigation.navigate('PracticeTypeSettings', { 
        practiceType: PRACTICE_TYPES.DOWN_SET_WHISTLE 
      })
    },
    {
      title: 'Rapid Clamp',
      subtitle: 'Continuous clamping practice',
      icon: 'timer',
      onPress: () => navigation.navigate('PracticeTypeSettings', { 
        practiceType: PRACTICE_TYPES.RAPID_CLAMP 
      })
    },
    {
      title: 'Three Whistle Drill',
      subtitle: 'Clamp, Pull, Pop sequence',
      icon: 'repeat',
      onPress: () => navigation.navigate('PracticeTypeSettings', { 
        practiceType: PRACTICE_TYPES.THREE_WHISTLE 
      })
    }
  ];

  const generalItems = [
    {
      title: 'Developer Mode',
      subtitle: 'Testing and debugging tools',
      icon: 'code-slash-outline',
      onPress: () => navigation.navigate('DeveloperMode')
    }
  ];

  const otherItems = [
    {
      title: 'Audio Settings',
      subtitle: 'Record custom sounds',
      icon: 'mic-outline',
      onPress: () => navigation.navigate('AudioSettings')
    },
    {
      title: 'Help & Support',
      subtitle: 'App info and troubleshooting',
      icon: 'help-circle-outline',
      onPress: () => navigation.navigate('HelpSupport')
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <MenuSection title="Practice Types" items={practiceTypeItems} />
        <MenuSection title="General" items={generalItems} />
        <MenuSection title="Other" items={otherItems} />
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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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

