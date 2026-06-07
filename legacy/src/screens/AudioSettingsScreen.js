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
import { useSettings } from '../contexts/SettingsContext';
import AudioService from '../services/AudioService';

export default function AudioSettingsScreen({ navigation }) {
  const { settings } = useSettings();

  // Function to play current sounds
  const playCurrentSound = async (soundType) => {
    try {
      console.log(`🔊 Playing current ${soundType} sound`);
      
      // Initialize AudioService with current settings
      await AudioService.initialize(settings);
      
      switch (soundType) {
        case 'down':
          console.log('🔊 Playing Down sound...');
          await AudioService.playDown();
          break;
        case 'set':
          console.log('🔊 Playing Set sound...');
          await AudioService.playSet();
          break;
        case 'whistle':
          console.log('🔊 Playing Whistle sound...');
          await AudioService.playWhistle();
          break;
        default:
          console.error('Unknown sound type:', soundType);
      }
      console.log(`✅ Finished playing ${soundType} sound`);
    } catch (error) {
      console.error(`❌ Failed to play ${soundType} sound:`, error);
    }
  };

  const SettingRow = ({ label, value, onPress, icon }) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={24} color={Colors.primary} />
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <View style={styles.settingRight}>
        {value && <Text style={styles.settingValue}>{value}</Text>}
        <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Audio Settings</Text>
        </View>

        {/* Custom Recording Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custom Audio</Text>
          
          <SettingRow
            label="Record Custom Audio"
            value=""
            icon="mic-outline"
            onPress={() => navigation.navigate('Recording')}
          />
        </View>

        {/* Test Current Sounds Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Current Sounds</Text>
          <Text style={styles.sectionSubtitle}>
            Play the sounds that will be used during practice
          </Text>
          
          <View style={styles.playCurrentSection}>
            <View style={styles.playButtonsRow}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={() => playCurrentSound('down')}
                activeOpacity={0.7}
              >
                <Ionicons name="play" size={16} color={Colors.primary} />
                <Text style={styles.playButtonText}>Down</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.playButton}
                onPress={() => playCurrentSound('set')}
                activeOpacity={0.7}
              >
                <Ionicons name="play" size={16} color={Colors.primary} />
                <Text style={styles.playButtonText}>Set</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.playButton}
                onPress={() => playCurrentSound('whistle')}
                activeOpacity={0.7}
              >
                <Ionicons name="play" size={16} color={Colors.primary} />
                <Text style={styles.playButtonText}>Whistle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Audio Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Audio Type:</Text>
              <Text style={styles.infoValue}>
                {settings.audioType === 'tts' ? 'Text-to-Speech' : 'Custom Recordings'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Custom Voice:</Text>
              <Text style={styles.infoValue}>
                {settings.hasCustomVoice ? 'Yes' : 'No'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Custom Whistle:</Text>
              <Text style={styles.infoValue}>
                {settings.hasCustomWhistle ? 'Yes' : 'No'}
              </Text>
            </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSecondary,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
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
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 12,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 8,
  },
  playCurrentSection: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  playButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  playButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.accent,
    backgroundColor: Colors.background,
  },
  playButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  infoCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
});
