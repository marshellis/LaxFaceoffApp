import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PracticeHistoryContext = createContext();

// Achievement definitions
export const ACHIEVEMENTS = {
  REPS_100_DAY: {
    id: 'reps_100_day',
    title: '100 Reps in a Day',
    description: 'Complete 100 reps in a single day',
    icon: 'trophy',
    color: '#FFD700'
  },
  STREAK_3_DAYS: {
    id: 'streak_3_days',
    title: '3-Day Streak',
    description: 'Practice 3 days in a row',
    icon: 'flame',
    color: '#FF6B35'
  },
  STREAK_5_DAYS: {
    id: 'streak_5_days',
    title: '5-Day Streak',
    description: 'Practice 5 days in a row',
    icon: 'flame',
    color: '#FF4500'
  },
  WEEKLY_3_DAYS: {
    id: 'weekly_3_days',
    title: '3 Days This Week',
    description: 'Practice 3 days in a week',
    icon: 'calendar',
    color: '#4CAF50'
  },
  WEEKLY_5_DAYS: {
    id: 'weekly_5_days',
    title: '5 Days This Week',
    description: 'Practice 5 days in a week',
    icon: 'calendar',
    color: '#2E7D32'
  },
  MONTHLY_3_DAYS: {
    id: 'monthly_3_days',
    title: '3 Days This Month',
    description: 'Practice 3 days in a month',
    icon: 'medal',
    color: '#9C27B0'
  },
  MONTHLY_5_DAYS: {
    id: 'monthly_5_days',
    title: '5 Days This Month',
    description: 'Practice 5 days in a month',
    icon: 'medal',
    color: '#673AB7'
  },
  FIRST_PRACTICE: {
    id: 'first_practice',
    title: 'First Practice',
    description: 'Complete your first practice session',
    icon: 'star',
    color: '#FFC107'
  },
  PRACTICE_10: {
    id: 'practice_10',
    title: '10 Practices',
    description: 'Complete 10 practice sessions',
    icon: 'ribbon',
    color: '#FF9800'
  },
  PRACTICE_50: {
    id: 'practice_50',
    title: '50 Practices',
    description: 'Complete 50 practice sessions',
    icon: 'medal',
    color: '#FF5722'
  },
  PRACTICE_100: {
    id: 'practice_100',
    title: '100 Practices',
    description: 'Complete 100 practice sessions',
    icon: 'trophy',
    color: '#E91E63'
  },
  PRACTICE_250: {
    id: 'practice_250',
    title: '250 Practices',
    description: 'Complete 250 practice sessions',
    icon: 'diamond',
    color: '#9C27B0'
  },
  PRACTICE_500: {
    id: 'practice_500',
    title: '500 Practices',
    description: 'Complete 500 practice sessions',
    icon: 'diamond',
    color: '#673AB7'
  },
  PRACTICE_1000: {
    id: 'practice_1000',
    title: '1000 Practices',
    description: 'Complete 1000 practice sessions - Ultimate Master!',
    icon: 'diamond',
    color: '#3F51B5'
  }
};

export const PracticeHistoryProvider = ({ children }) => {
  const [practiceHistory, setPracticeHistory] = useState({});
  const [achievements, setAchievements] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load practice history from storage on app start
  useEffect(() => {
    loadPracticeHistory();
  }, []);

  const loadPracticeHistory = async () => {
    try {
      const [historyData, achievementsData] = await Promise.all([
        AsyncStorage.getItem('lacrosse_practice_history'),
        AsyncStorage.getItem('lacrosse_achievements')
      ]);
      
      if (historyData) {
        setPracticeHistory(JSON.parse(historyData));
      }
      
      if (achievementsData) {
        setAchievements(JSON.parse(achievementsData));
      }
    } catch (error) {
      console.log('Error loading practice history:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const savePracticeHistory = async (newHistory) => {
    try {
      await AsyncStorage.setItem('lacrosse_practice_history', JSON.stringify(newHistory));
    } catch (error) {
      console.log('Error saving practice history:', error);
    }
  };

  const saveAchievements = async (newAchievements) => {
    try {
      await AsyncStorage.setItem('lacrosse_achievements', JSON.stringify(newAchievements));
    } catch (error) {
      console.log('Error saving achievements:', error);
    }
  };

  // Add a completed practice session
  const addPracticeSession = (practiceType, reps, duration) => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const session = {
      id: Date.now().toString(),
      practiceType,
      reps,
      duration,
      timestamp: new Date().toISOString(),
      date: today
    };

    const newHistory = {
      ...practiceHistory,
      [today]: practiceHistory[today] ? [...practiceHistory[today], session] : [session]
    };

    setPracticeHistory(newHistory);
    savePracticeHistory(newHistory);

    // Check for new achievements
    checkAchievements(newHistory);
  };

      // Check and unlock achievements
  const checkAchievements = (history) => {
    const newAchievements = [...achievements];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Calculate total practice sessions
    const totalSessions = Object.values(history).flat().length;

    // Check milestone achievements
    const milestones = [
      { count: 1, achievement: ACHIEVEMENTS.FIRST_PRACTICE },
      { count: 10, achievement: ACHIEVEMENTS.PRACTICE_10 },
      { count: 50, achievement: ACHIEVEMENTS.PRACTICE_50 },
      { count: 100, achievement: ACHIEVEMENTS.PRACTICE_100 },
      { count: 250, achievement: ACHIEVEMENTS.PRACTICE_250 },
      { count: 500, achievement: ACHIEVEMENTS.PRACTICE_500 },
      { count: 1000, achievement: ACHIEVEMENTS.PRACTICE_1000 }
    ];

    milestones.forEach(({ count, achievement }) => {
      if (totalSessions >= count && !achievements.includes(achievement.id)) {
        newAchievements.push(achievement.id);
      }
    });

    // Check 100 reps in a day
    if (history[todayStr]) {
      const todayReps = history[todayStr].reduce((total, session) => total + session.reps, 0);
      if (todayReps >= 100 && !achievements.includes(ACHIEVEMENTS.REPS_100_DAY.id)) {
        newAchievements.push(ACHIEVEMENTS.REPS_100_DAY.id);
      }
    }

    // Check streaks and weekly/monthly goals
    const dates = Object.keys(history).sort();
    if (dates.length > 0) {
      // Calculate current streak
      const currentStreak = calculateCurrentStreak(dates, todayStr);
      
      // Check streak achievements
      if (currentStreak >= 3 && !achievements.includes(ACHIEVEMENTS.STREAK_3_DAYS.id)) {
        newAchievements.push(ACHIEVEMENTS.STREAK_3_DAYS.id);
      }
      if (currentStreak >= 5 && !achievements.includes(ACHIEVEMENTS.STREAK_5_DAYS.id)) {
        newAchievements.push(ACHIEVEMENTS.STREAK_5_DAYS.id);
      }

      // Check weekly achievements
      const thisWeekDays = getThisWeekDays(today);
      const thisWeekPracticeDays = dates.filter(date => thisWeekDays.includes(date)).length;
      
      if (thisWeekPracticeDays >= 3 && !achievements.includes(ACHIEVEMENTS.WEEKLY_3_DAYS.id)) {
        newAchievements.push(ACHIEVEMENTS.WEEKLY_3_DAYS.id);
      }
      if (thisWeekPracticeDays >= 5 && !achievements.includes(ACHIEVEMENTS.WEEKLY_5_DAYS.id)) {
        newAchievements.push(ACHIEVEMENTS.WEEKLY_5_DAYS.id);
      }

      // Check monthly achievements
      const thisMonthDays = getThisMonthDays(today);
      const thisMonthPracticeDays = dates.filter(date => thisMonthDays.includes(date)).length;
      
      if (thisMonthPracticeDays >= 3 && !achievements.includes(ACHIEVEMENTS.MONTHLY_3_DAYS.id)) {
        newAchievements.push(ACHIEVEMENTS.MONTHLY_3_DAYS.id);
      }
      if (thisMonthPracticeDays >= 5 && !achievements.includes(ACHIEVEMENTS.MONTHLY_5_DAYS.id)) {
        newAchievements.push(ACHIEVEMENTS.MONTHLY_5_DAYS.id);
      }
    }

    if (newAchievements.length > achievements.length) {
      setAchievements(newAchievements);
      saveAchievements(newAchievements);
    }
  };

  // Calculate current streak of consecutive practice days
  const calculateCurrentStreak = (dates, todayStr) => {
    if (dates.length === 0) return 0;
    
    const sortedDates = dates.sort().reverse(); // Most recent first
    let streak = 0;
    let currentDate = new Date(todayStr);
    
    for (const dateStr of sortedDates) {
      const practiceDate = new Date(dateStr);
      const daysDiff = Math.floor((currentDate - practiceDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Get all dates in current week
  const getThisWeekDays = (date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day; // First day is Sunday
    startOfWeek.setDate(diff);
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const weekDay = new Date(startOfWeek);
      weekDay.setDate(startOfWeek.getDate() + i);
      weekDays.push(weekDay.toISOString().split('T')[0]);
    }
    
    return weekDays;
  };

  // Get all dates in current month
  const getThisMonthDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const monthDays = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const monthDay = new Date(year, month, day);
      monthDays.push(monthDay.toISOString().split('T')[0]);
    }
    
    return monthDays;
  };

  // Get practice sessions for a specific date
  const getPracticeSessionsForDate = (date) => {
    return practiceHistory[date] || [];
  };

  // Get marked dates for calendar (dates with practice sessions)
  const getMarkedDates = () => {
    const marked = {};
    Object.keys(practiceHistory).forEach(date => {
      marked[date] = {
        customStyles: {
          container: {
            backgroundColor: '#4CAF50',
            borderRadius: 16,
          },
          text: {
            color: 'white',
            fontWeight: 'bold',
          },
        },
      };
    });
    return marked;
  };

  // Get statistics
  const getStatistics = () => {
    const allSessions = Object.values(practiceHistory).flat();
    const totalSessions = allSessions.length;
    const totalReps = allSessions.reduce((total, session) => total + session.reps, 0);
    const totalDuration = allSessions.reduce((total, session) => total + (session.duration || 0), 0);
    
    const dates = Object.keys(practiceHistory);
    const currentStreak = dates.length > 0 ? calculateCurrentStreak(dates, new Date().toISOString().split('T')[0]) : 0;
    
    return {
      totalSessions,
      totalReps,
      totalDuration,
      currentStreak,
      totalDays: dates.length
    };
  };

  // Developer mode functions
  const clearAllData = async () => {
    try {
      await AsyncStorage.multiRemove(['lacrosse_practice_history', 'lacrosse_achievements']);
      setPracticeHistory({});
      setAchievements([]);
      console.log('All practice data cleared');
    } catch (error) {
      console.log('Error clearing data:', error);
    }
  };

  const generateSampleData = async () => {
    const practiceTypes = ['down-set-whistle', 'rapid-clamp', 'three-whistle'];
    const sampleHistory = {};
    const today = new Date();
    
    // Generate 20 random sessions over the last 30 days (excluding today)
    for (let i = 0; i < 20; i++) {
      // Random day between 1-30 days ago (excluding today)
      const daysAgo = Math.floor(Math.random() * 30) + 1;
      const sessionDate = new Date(today);
      sessionDate.setDate(today.getDate() - daysAgo);
      const dateStr = sessionDate.toISOString().split('T')[0];
      
      // Random practice type and reps
      const practiceType = practiceTypes[Math.floor(Math.random() * practiceTypes.length)];
      const reps = Math.floor(Math.random() * 15) + 5; // 5-20 reps
      const duration = Math.floor(Math.random() * 300) + 60; // 1-6 minutes
      
      // Random time during the day
      const sessionTime = new Date(sessionDate);
      sessionTime.setHours(
        Math.floor(Math.random() * 12) + 8, // 8 AM to 8 PM
        Math.floor(Math.random() * 60),
        Math.floor(Math.random() * 60)
      );
      
      const session = {
        id: `sample_${Date.now()}_${i}`,
        practiceType,
        reps,
        duration,
        timestamp: sessionTime.toISOString(),
        date: dateStr
      };
      
      if (!sampleHistory[dateStr]) {
        sampleHistory[dateStr] = [];
      }
      sampleHistory[dateStr].push(session);
    }
    
    // Merge with existing data
    const newHistory = { ...practiceHistory, ...sampleHistory };
    setPracticeHistory(newHistory);
    await savePracticeHistory(newHistory);
    
    // Check achievements with new data
    checkAchievements(newHistory);
    
    console.log('Sample data generated: 20 sessions over last 30 days');
  };

  const value = {
    practiceHistory,
    achievements,
    isLoaded,
    addPracticeSession,
    getPracticeSessionsForDate,
    getMarkedDates,
    getStatistics,
    clearAllData,
    generateSampleData,
    ACHIEVEMENTS
  };

  return (
    <PracticeHistoryContext.Provider value={value}>
      {children}
    </PracticeHistoryContext.Provider>
  );
};

export const usePracticeHistory = () => {
  const context = useContext(PracticeHistoryContext);
  if (!context) {
    throw new Error('usePracticeHistory must be used within a PracticeHistoryProvider');
  }
  return context;
};
