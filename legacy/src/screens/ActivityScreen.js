import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { usePracticeHistory, ACHIEVEMENTS } from '../contexts/PracticeHistoryContext';
import { PRACTICE_TYPE_CONFIGS } from '../contexts/SettingsContext';

export default function ActivityScreen({ navigation }) {
  const { 
    practiceHistory, 
    achievements, 
    getPracticeSessionsForDate, 
    getMarkedDates, 
    getStatistics,
    ACHIEVEMENTS: achievementDefs
  } = usePracticeHistory();
  
  const [selectedDate, setSelectedDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState('calendar'); // 'calendar' or 'achievements'

  const statistics = getStatistics();
  const markedDates = getMarkedDates();

  const handleDayPress = (day) => {
    const sessions = getPracticeSessionsForDate(day.dateString);
    if (sessions.length > 0) {
      setSelectedDate(day.dateString);
      setModalVisible(true);
    }
  };



  const formatDate = (dateString) => {
    // Parse the date string (YYYY-MM-DD) manually to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed in Date constructor
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderSessionItem = ({ item }) => (
    <View style={styles.sessionItem}>
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionType}>
          {PRACTICE_TYPE_CONFIGS[item.practiceType]?.name || item.practiceType}
        </Text>
        <Text style={styles.sessionTime}>
          {new Date(item.timestamp).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
      <View style={styles.sessionDetails}>
        <Text style={styles.sessionDetail}>
          <Ionicons name="repeat" size={16} color={Colors.primary} /> {item.reps} reps
        </Text>
        {item.duration && (
          <Text style={styles.sessionDetail}>
            <Ionicons name="time" size={16} color={Colors.primary} /> {formatDuration(item.duration)}
          </Text>
        )}
      </View>
    </View>
  );

  const renderAchievementItem = ({ item }) => {
    const achievementKey = Object.keys(ACHIEVEMENTS).find(key => 
      ACHIEVEMENTS[key].id === item
    );
    const achievement = achievementKey ? ACHIEVEMENTS[achievementKey] : null;
    
    if (!achievement) return null;

    return (
      <View style={[styles.achievementItem, { borderLeftColor: achievement.color }]}>
        <View style={[styles.achievementIcon, { backgroundColor: achievement.color }]}>
          <Ionicons name={achievement.icon} size={24} color="white" />
        </View>
        <View style={styles.achievementText}>
          <Text style={styles.achievementTitle}>{achievement.title}</Text>
          <Text style={styles.achievementDescription}>{achievement.description}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Activity</Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'calendar' && styles.activeTab]}
            onPress={() => setSelectedTab('calendar')}
          >
            <Ionicons 
              name="calendar-outline" 
              size={20} 
              color={selectedTab === 'calendar' ? Colors.textLight : Colors.primary} 
            />
            <Text style={[styles.tabText, selectedTab === 'calendar' && styles.activeTabText]}>
              History
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'achievements' && styles.activeTab]}
            onPress={() => setSelectedTab('achievements')}
          >
            <Ionicons 
              name="trophy-outline" 
              size={20} 
              color={selectedTab === 'achievements' ? Colors.textLight : Colors.primary} 
            />
            <Text style={[styles.tabText, selectedTab === 'achievements' && styles.activeTabText]}>
              Achievements
            </Text>
          </TouchableOpacity>
        </View>

        {selectedTab === 'calendar' ? (
          <ScrollView style={styles.scrollContent}>
            {/* Statistics */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{statistics.totalSessions}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{statistics.totalReps}</Text>
                <Text style={styles.statLabel}>Total Reps</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{statistics.currentStreak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{statistics.totalDays}</Text>
                <Text style={styles.statLabel}>Practice Days</Text>
              </View>
            </View>

            {/* Calendar */}
            <View style={styles.calendarContainer}>
              <Calendar
                onDayPress={handleDayPress}
                markedDates={markedDates}
                markingType="custom"
                theme={{
                  backgroundColor: Colors.background,
                  calendarBackground: Colors.background,
                  textSectionTitleColor: Colors.primary,
                  selectedDayBackgroundColor: Colors.accent,
                  selectedDayTextColor: Colors.textLight,
                  todayTextColor: Colors.accent,
                  dayTextColor: Colors.text,
                  textDisabledColor: Colors.textSecondary,
                  dotColor: Colors.accent,
                  selectedDotColor: Colors.textLight,
                  arrowColor: Colors.primary,
                  monthTextColor: Colors.primary,
                  indicatorColor: Colors.primary,
                  textDayFontWeight: '500',
                  textMonthFontWeight: 'bold',
                  textDayHeaderFontWeight: '600',
                  textDayFontSize: 16,
                  textMonthFontSize: 18,
                  textDayHeaderFontSize: 14
                }}
              />
            </View>
          </ScrollView>
        ) : (
          <ScrollView style={styles.scrollContent}>
            {/* Achievements */}
            <View style={styles.achievementsContainer}>
              <Text style={styles.sectionTitle}>
                Unlocked Achievements ({achievements.length})
              </Text>
              {achievements.length > 0 ? (
                <FlatList
                  data={achievements}
                  renderItem={renderAchievementItem}
                  keyExtractor={(item) => item}
                  scrollEnabled={false}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="trophy-outline" size={60} color={Colors.textSecondary} />
                  <Text style={styles.emptyStateText}>No achievements yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Start practicing to unlock your first badge!
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}

        {/* Daily Sessions Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {formatDate(selectedDate)}
                </Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={Colors.primary} />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={getPracticeSessionsForDate(selectedDate)}
                renderItem={renderSessionItem}
                keyExtractor={(item) => item.id}
                style={styles.sessionsList}
              />
            </View>
          </View>
        </Modal>
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
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSecondary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  activeTabText: {
    color: Colors.textLight,
  },
  scrollContent: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.backgroundSecondary,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  calendarContainer: {
    backgroundColor: Colors.backgroundSecondary,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  achievementsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 16,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  achievementText: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSecondary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  closeButton: {
    padding: 4,
  },
  sessionsList: {
    paddingHorizontal: 20,
  },
  sessionItem: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionType: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  sessionTime: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  sessionDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  sessionDetail: {
    fontSize: 14,
    color: Colors.text,
    alignItems: 'center',
  },
});