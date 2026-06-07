import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useSettings } from '../contexts/SettingsContext';

export default function HelpSupportScreen({ navigation }) {
  const { resetToDefaults } = useSettings();

  const handleResetToDefaults = () => {
    Alert.alert(
      'Reset All Settings',
      'This will reset all practice types and audio settings to their default values. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset All', 
          style: 'destructive',
          onPress: () => {
            resetToDefaults();
            Alert.alert('Settings Reset', 'All settings have been reset to defaults.');
          }
        }
      ]
    );
  };

  const handleEmailSupport = () => {
    const email = 'support@marshellis.com';
    const subject = 'Lacrosse Face-off Trainer - Support Request';
    const body = 'Please describe your issue or question:\n\n';
    
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.openURL(mailtoUrl).catch(() => {
      Alert.alert(
        'Email Not Available',
        `Please send your support request to:\n${email}`,
        [{ text: 'OK' }]
      );
    });
  };

  const SettingRow = ({ label, value, onPress, icon, iconColor = Colors.primary }) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={24} color={iconColor} />
        <Text style={[styles.settingLabel, iconColor === Colors.error && { color: Colors.error }]}>
          {label}
        </Text>
      </View>
      <View style={styles.settingRight}>
        {value && <Text style={styles.settingValue}>{value}</Text>}
        <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  const InfoCard = ({ title, children }) => (
    <View style={styles.infoCard}>
      <Text style={styles.infoCardTitle}>{title}</Text>
      {children}
    </View>
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
          <Text style={styles.title}>Help & Support</Text>
        </View>

        {/* App Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          
          <InfoCard title="Version">
            <Text style={styles.infoText}>1.0.0</Text>
          </InfoCard>

          <InfoCard title="About">
            <Text style={styles.infoText}>
              Lacrosse Face-off Trainer helps players practice face-off timing and reaction speed with customizable drills and variable timing sequences.
            </Text>
          </InfoCard>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <SettingRow
            label="Contact Support"
            value=""
            icon="mail-outline"
            onPress={handleEmailSupport}
          />
        </View>

        {/* How to Use */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Use</Text>
          
          <InfoCard title="Getting Started">
            <Text style={styles.infoText}>
              1. Choose a practice type from the home screen{'\n'}
              2. Adjust timing settings for each practice type{'\n'}
              3. Record custom audio or use text-to-speech{'\n'}
              4. Start practicing and improve your reaction time!
            </Text>
          </InfoCard>

          <InfoCard title="Practice Types">
            <Text style={styles.infoText}>
              <Text style={styles.boldText}>Down Set Whistle:</Text> Traditional face-off sequence{'\n'}
              <Text style={styles.boldText}>Rapid Clamp:</Text> Continuous clamping practice{'\n'}
              <Text style={styles.boldText}>Three Whistle:</Text> Clamp-Pull-Pop sequence
            </Text>
          </InfoCard>
        </View>

        {/* Troubleshooting */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Troubleshooting</Text>
          
          <InfoCard title="Audio Issues">
            <Text style={styles.infoText}>
              • Make sure your device volume is turned up{'\n'}
              • Check that silent mode is disabled{'\n'}
              • Try recording new custom audio{'\n'}
              • Restart the app if audio stops working
            </Text>
          </InfoCard>

          <InfoCard title="Performance Issues">
            <Text style={styles.infoText}>
              • Close other apps running in the background{'\n'}
              • Restart your device{'\n'}
              • Make sure you have enough storage space{'\n'}
              • Update to the latest app version
            </Text>
          </InfoCard>
        </View>

        {/* Reset Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reset</Text>
          
          <SettingRow
            label="Reset All Settings"
            value=""
            icon="refresh-outline"
            iconColor={Colors.error}
            onPress={handleResetToDefaults}
          />
          
          <Text style={styles.resetWarning}>
            This will reset all practice types and audio settings to their default values. This action cannot be undone.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with ❤️ for lacrosse players
          </Text>
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
    marginBottom: 16,
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
  resetWarning: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  footer: {
    marginTop: 32,
    marginBottom: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});
