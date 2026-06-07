import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useSettings } from '../contexts/SettingsContext';

export default function SessionTypeSelector({ onSelect, selectedType = null }) {
  const { PRACTICE_TYPES, PRACTICE_TYPE_CONFIGS } = useSettings();

  const practiceTypes = Object.values(PRACTICE_TYPES);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Practice Type</Text>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {practiceTypes.map((practiceType) => {
          const config = PRACTICE_TYPE_CONFIGS[practiceType];
          const isSelected = selectedType === practiceType;
          
          return (
            <TouchableOpacity
              key={practiceType}
              style={[
                styles.typeCard,
                isSelected && styles.selectedCard
              ]}
              onPress={() => onSelect(practiceType)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={[
                  styles.iconContainer,
                  isSelected && styles.selectedIconContainer
                ]}>
                  <Ionicons 
                    name={config.icon} 
                    size={24} 
                    color={isSelected ? Colors.textLight : Colors.primary} 
                  />
                </View>
                <View style={styles.titleContainer}>
                  <Text style={[
                    styles.typeName,
                    isSelected && styles.selectedTypeName
                  ]}>
                    {config.name}
                  </Text>
                  <Text style={[
                    styles.typeDescription,
                    isSelected && styles.selectedTypeDescription
                  ]}>
                    {config.description}
                  </Text>
                </View>
                {isSelected && (
                  <Ionicons 
                    name="checkmark-circle" 
                    size={24} 
                    color={Colors.success} 
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  typeCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    backgroundColor: Colors.primary,
    borderColor: Colors.accent,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedIconContainer: {
    backgroundColor: Colors.accent,
  },
  titleContainer: {
    flex: 1,
  },
  typeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  selectedTypeName: {
    color: Colors.textLight,
  },
  typeDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  selectedTypeDescription: {
    color: Colors.textLight,
    opacity: 0.9,
  },
});

