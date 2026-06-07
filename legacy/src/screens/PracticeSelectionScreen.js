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

export default function PracticeSelectionScreen({ navigation }) {
  const { updatePracticeType } = useSettings();

  const handlePracticeTypeSelect = (practiceType) => {
    updatePracticeType(practiceType);
    navigation.navigate('PracticeSession');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Select Practice Type</Text>
          <Text style={styles.subtitle}>Choose your training focus</Text>
        </View>
        
        {/* Practice Type Options */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.practiceTypeButtons}>
            {Object.values(PRACTICE_TYPES).map((practiceType) => {
              const config = PRACTICE_TYPE_CONFIGS[practiceType];
              
              return (
                <TouchableOpacity
                  key={practiceType}
                  style={styles.practiceTypeButton}
                  onPress={() => handlePracticeTypeSelect(practiceType)}
                  activeOpacity={0.7}
                >
                  <View style={styles.practiceButtonContent}>
                    <View style={styles.practiceButtonIcon}>
                      <Ionicons 
                        name={config.icon} 
                        size={32} 
                        color={Colors.primary} 
                      />
                    </View>
                    <View style={styles.practiceButtonText}>
                      <Text style={styles.practiceButtonTitle}>
                        {config.name}
                      </Text>
                      <Text style={styles.practiceButtonDescription}>
                        {config.description}
                      </Text>
                    </View>
                    <Ionicons 
                      name="chevron-forward" 
                      size={20} 
                      color={Colors.textSecondary} 
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
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
  practiceTypeButtons: {
    paddingVertical: 20,
  },
  practiceTypeButton: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  practiceButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  practiceButtonIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  practiceButtonText: {
    flex: 1,
  },
  practiceButtonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 6,
  },
  practiceButtonDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
