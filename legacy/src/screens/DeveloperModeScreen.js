import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { usePracticeHistory } from '../contexts/PracticeHistoryContext';

export default function DeveloperModeScreen({ navigation }) {
  const { 
    clearAllData,
    generateSampleData,
    getStatistics,
    achievements
  } = usePracticeHistory();

  const statistics = getStatistics();

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all practice history and achievements. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: () => {
            clearAllData();
            Alert.alert('Success', 'All practice data has been cleared.');
          }
        }
      ]
    );
  };

  const handleGenerateSampleData = () => {
    Alert.alert(
      'Generate Sample Data',
      'This will create 20 random practice sessions over the last 30 days (excluding today). Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Generate', 
          onPress: () => {
            generateSampleData();
            Alert.alert('Success', '20 sample practice sessions have been generated!');
          }
        }
      ]
    );
  };

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
          <Text style={styles.title}>Developer Mode</Text>
        </View>

        {/* Warning */}
        <View style={styles.warningContainer}>
          <Ionicons name="warning" size={24} color="#FF6B35" />
          <Text style={styles.warningText}>
            Developer tools for testing and debugging. Use with caution!
          </Text>
        </View>

        {/* Current Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Data</Text>
          <View style={styles.dataContainer}>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Practice Sessions:</Text>
              <Text style={styles.dataValue}>{statistics.totalSessions}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Total Reps:</Text>
              <Text style={styles.dataValue}>{statistics.totalReps}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Achievements Unlocked:</Text>
              <Text style={styles.dataValue}>{achievements.length}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Practice Days:</Text>
              <Text style={styles.dataValue}>{statistics.totalDays}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Current Streak:</Text>
              <Text style={styles.dataValue}>{statistics.currentStreak} days</Text>
            </View>
          </View>
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Developer Actions</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleGenerateSampleData}
          >
            <View style={styles.actionButtonLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="flask" size={24} color={Colors.primary} />
              </View>
              <View style={styles.actionButtonText}>
                <Text style={styles.actionButtonTitle}>Generate Sample Data</Text>
                <Text style={styles.actionButtonSubtitle}>
                  Creates 20 random practice sessions over the last 30 days (excluding today)
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.dangerAction]}
            onPress={handleClearData}
          >
            <View style={styles.actionButtonLeft}>
              <View style={[styles.iconContainer, styles.dangerIconContainer]}>
                <Ionicons name="trash" size={24} color="#FF4444" />
              </View>
              <View style={styles.actionButtonText}>
                <Text style={[styles.actionButtonTitle, styles.dangerText]}>Clear All Data</Text>
                <Text style={styles.actionButtonSubtitle}>
                  Permanently deletes all practice history and achievements
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Developer Mode</Text>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              • Sample data helps test the calendar view and achievement system
            </Text>
            <Text style={styles.infoText}>
              • Generated sessions use random practice types, rep counts, and durations
            </Text>
            <Text style={styles.infoText}>
              • Clear data removes everything from local storage
            </Text>
            <Text style={styles.infoText}>
              • All actions are immediate and cannot be undone
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSecondary,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  warningText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#E65100',
    fontWeight: '500',
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
  dataContainer: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  dataLabel: {
    fontSize: 16,
    color: Colors.text,
  },
  dataValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  dangerAction: {
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  actionButtonLeft: {
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
  dangerIconContainer: {
    backgroundColor: '#FFEBEE',
  },
  actionButtonText: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  dangerText: {
    color: '#FF4444',
  },
  actionButtonSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  infoContainer: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
});

