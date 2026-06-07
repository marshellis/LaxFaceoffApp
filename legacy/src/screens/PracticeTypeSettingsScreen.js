import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import Slider from '@react-native-community/slider';
import RangeSlider from 'react-native-fast-range-slider';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useSettings, PRACTICE_TYPES, PRACTICE_TYPE_CONFIGS } from '../contexts/SettingsContext';

export default function PracticeTypeSettingsScreen({ navigation, route }) {
  const { practiceType } = route.params;
  const { 
    settings,
    updatePracticeTypeSettings,
    getPracticeTypeSettings,
    resetPracticeTypeToDefaults
  } = useSettings();

  // Modal state for numeric input
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalValue, setModalValue] = useState('');
  const [modalCallback, setModalCallback] = useState(null);
  const inputRef = useRef(null);

  // Get practice type config and settings
  const practiceConfig = PRACTICE_TYPE_CONFIGS[practiceType];
  const practiceSettings = getPracticeTypeSettings(practiceType);

  // Auto-focus and select text when modal opens
  useEffect(() => {
    if (modalVisible && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
        inputRef.current.setSelection(0, modalValue.length);
      }, 100);
    }
  }, [modalVisible, modalValue]);

  // Helper function to show input modal
  const showInputModal = (title, currentValue, callback) => {
    setModalTitle(title);
    setModalValue(currentValue.toString());
    setModalCallback(() => callback);
    setModalVisible(true);
  };

  // Handle modal submit
  const handleModalSubmit = () => {
    if (modalCallback) {
      modalCallback(modalValue);
    }
    setModalVisible(false);
    setModalCallback(null);
  };

  const TimingSliderRow = ({ 
    label, 
    icon, 
    minValue, 
    maxValue, 
    minKey, 
    maxKey, 
    step = 0.1, 
    unit = 's',
    absoluteMin = 0.1,
    absoluteMax = 5.0
  }) => {
    
    const handleValuesChange = (values) => {
      console.log('Range slider values:', values); // Debug log
      
      // Multiple validation checks
      if (!values) {
        console.warn('No values received');
        return;
      }
      
      // Handle different possible value formats
      let minVal, maxVal;
      
      if (typeof values === 'object' && values.min !== undefined && values.max !== undefined) {
        minVal = values.min;
        maxVal = values.max;
      } else if (Array.isArray(values) && values.length >= 2) {
        minVal = values[0];
        maxVal = values[1];
      } else {
        console.warn('Unexpected values format:', values);
        return;
      }
      
      // Validate numbers
      if (typeof minVal !== 'number' || typeof maxVal !== 'number') {
        console.warn('Non-numeric values:', { minVal, maxVal });
        return;
      }
      
      // Check for NaN or invalid ranges
      if (isNaN(minVal) || isNaN(maxVal) || minVal > maxVal) {
        console.warn('Invalid range values:', { minVal, maxVal });
        return;
      }
      
      // Round values
      const roundedLow = Math.round(minVal * 10) / 10;
      const roundedHigh = Math.round(maxVal * 10) / 10;
      
      // Final NaN check
      if (isNaN(roundedLow) || isNaN(roundedHigh)) {
        console.warn('NaN after rounding:', { roundedLow, roundedHigh });
        return;
      }
      
      // Update both settings at once to prevent conflicts for current practice type
      console.log('Updating practice type settings:', { [minKey]: roundedLow, [maxKey]: roundedHigh });
      updatePracticeTypeSettings(practiceType, {
        [minKey]: roundedLow,
        [maxKey]: roundedHigh
      });
    };
    
    return (
      <View style={styles.sliderSection}>
        <View style={styles.sliderHeader}>
          <Ionicons name={icon} size={24} color={Colors.primary} />
          <Text style={styles.sliderLabel}>{label}</Text>
        </View>
        
        <View style={styles.sliderContainer}>
          <View style={styles.rangeRow}>
            <TouchableOpacity 
              style={styles.valueButton}
              onPress={() => {
                showInputModal(
                  `Set Minimum (0-30)`,
                  minValue || 0,
                  (value) => {
                    const num = parseFloat(value);
                    if (!isNaN(num) && num >= 0 && num < (maxValue || absoluteMax) && num <= 30) {
                      updatePracticeTypeSettings(practiceType, { [minKey]: num });
                    } else {
                      Alert.alert('Invalid Value', `Please enter a number between 0 and ${Math.min((maxValue || absoluteMax).toFixed(1), 30)}`);
                    }
                  }
                );
              }}
            >
              <Text style={styles.rangeLabel}>Min: {(minValue || 0).toFixed(1)}{unit}</Text>
            </TouchableOpacity>
            
            <Text style={styles.rangeSeparator}>-</Text>
            
            <TouchableOpacity 
              style={styles.valueButton}
              onPress={() => {
                showInputModal(
                  `Set Maximum (0-30)`,
                  maxValue || 0,
                  (value) => {
                    const num = parseFloat(value);
                    if (!isNaN(num) && num <= 30 && num > (minValue || absoluteMin) && num >= 0) {
                      updatePracticeTypeSettings(practiceType, { [maxKey]: num });
                    } else {
                      Alert.alert('Invalid Value', `Please enter a number between ${Math.max((minValue || absoluteMin).toFixed(1), 0)} and 30`);
                    }
                  }
                );
              }}
            >
              <Text style={styles.rangeLabel}>Max: {(maxValue || 0).toFixed(1)}{unit}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.rangeSliderContainer}>
            <RangeSlider
              key={`${minValue}-${maxValue}`}
              min={absoluteMin}
              max={absoluteMax}
              initialMinValue={minValue || absoluteMin}
              initialMaxValue={maxValue || absoluteMax}
              step={step}
              width={280}
              thumbSize={24}
              trackHeight={6}
              selectedTrackStyle={{ backgroundColor: Colors.accent }}
              unselectedTrackStyle={{ backgroundColor: Colors.backgroundSecondary }}
              thumbStyle={{ 
                backgroundColor: Colors.accent,
                borderWidth: 2,
                borderColor: Colors.background,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }}
              allowOverlap={false}
              minimumDistance={step * 2}
              onValuesChangeFinish={handleValuesChange}
            />
            
            {/* Tick marks and range labels */}
            <View style={styles.tickContainer}>
              <View style={styles.tickMark} />
              <View style={styles.tickMark} />
              <View style={styles.tickMark} />
              <View style={styles.tickMark} />
              <View style={styles.tickMark} />
            </View>
            <View style={styles.rangeLabels}>
              <Text style={styles.rangeLabelText}>{absoluteMin}{unit}</Text>
              <Text style={styles.rangeLabelText}>{absoluteMax}{unit}</Text>
            </View>
          </View>
          

        </View>
      </View>
    );
  };

  const RepCounterRow = () => (
    <View style={styles.sliderSection}>
      <View style={styles.sliderHeader}>
        <Ionicons name="repeat-outline" size={24} color={Colors.primary} />
        <Text style={styles.sliderLabel}>Number of Reps</Text>
      </View>
      
      <View style={styles.counterContainer}>
        <TouchableOpacity 
          style={styles.counterButton}
          onPress={() => {
            const newValue = Math.max(1, practiceSettings.numberOfReps - 1);
            updatePracticeTypeSettings(practiceType, { numberOfReps: newValue });
          }}
        >
          <Ionicons name="remove" size={24} color={Colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.counterValueButton}
          onPress={() => {
            showInputModal(
              'Set Number of Reps (1-50)',
              practiceSettings.numberOfReps || 5,
              (value) => {
                const num = parseInt(value);
                if (!isNaN(num) && num >= 1 && num <= 50) {
                  updatePracticeTypeSettings(practiceType, { numberOfReps: num });
                } else {
                  Alert.alert('Invalid Value', 'Please enter a number between 1 and 50');
                }
              }
            );
          }}
        >
          <Text style={styles.counterValue}>{practiceSettings.numberOfReps}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.counterButton}
          onPress={() => {
            const newValue = Math.min(50, practiceSettings.numberOfReps + 1);
            updatePracticeTypeSettings(practiceType, { numberOfReps: newValue });
          }}
        >
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPracticeTypeSettings = () => {
    switch (practiceType) {
      case PRACTICE_TYPES.DOWN_SET_WHISTLE:
        return (
          <>
            <TimingSliderRow
              label="Down to Set (seconds)"
              icon="timer-outline"
              minValue={practiceSettings.downMin}
              maxValue={practiceSettings.downMax}
              minKey="downMin"
              maxKey="downMax"
              absoluteMin={0}
              absoluteMax={10}
            />
            
            <TimingSliderRow
              label="Set to Whistle (seconds)"
              icon="timer-outline"
              minValue={practiceSettings.setMin}
              maxValue={practiceSettings.setMax}
              minKey="setMin"
              maxKey="setMax"
              absoluteMin={0}
              absoluteMax={10}
            />
            
            <TimingSliderRow
              label="Rest Between Reps (seconds)"
              icon="pause-outline"
              minValue={practiceSettings.restBetweenMin}
              maxValue={practiceSettings.restBetweenMax}
              minKey="restBetweenMin"
              maxKey="restBetweenMax"
              absoluteMin={0}
              absoluteMax={10}
            />
          </>
        );

      case PRACTICE_TYPES.RAPID_CLAMP:
        return (
          <>
            <TimingSliderRow
              label="Rest Between Reps (seconds)"
              icon="pause-outline"
              minValue={practiceSettings.restBetweenMin}
              maxValue={practiceSettings.restBetweenMax}
              minKey="restBetweenMin"
              maxKey="restBetweenMax"
              absoluteMin={0.5}
              absoluteMax={10}
            />
          </>
        );

      case PRACTICE_TYPES.THREE_WHISTLE:
        return (
          <>
            <TimingSliderRow
              label="Clamp to Pull (seconds)"
              icon="timer-outline"
              minValue={practiceSettings.clampToPullMin}
              maxValue={practiceSettings.clampToPullMax}
              minKey="clampToPullMin"
              maxKey="clampToPullMax"
              absoluteMin={0.1}
              absoluteMax={3}
            />
            
            <TimingSliderRow
              label="Pull to Pop (seconds)"
              icon="timer-outline"
              minValue={practiceSettings.pullToPopMin}
              maxValue={practiceSettings.pullToPopMax}
              minKey="pullToPopMin"
              maxKey="pullToPopMax"
              absoluteMin={0.1}
              absoluteMax={3}
            />
            
            <TimingSliderRow
              label="Reset Pause (seconds)"
              icon="pause-outline"
              minValue={practiceSettings.resetPauseMin}
              maxValue={practiceSettings.resetPauseMax}
              minKey="resetPauseMin"
              maxKey="resetPauseMax"
              absoluteMin={1}
              absoluteMax={10}
            />
          </>
        );

      default:
        return null;
    }
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
          <Text style={styles.title}>{practiceConfig?.name || 'Practice'}</Text>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              Drag sliders to adjust ranges • Tap values to enter manually • Use +/- for reps
            </Text>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timing Settings</Text>
          {renderPracticeTypeSettings()}
          <RepCounterRow />
        </View>

        {/* Reset Button */}
        <View style={styles.resetSection}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              Alert.alert(
                'Reset Settings',
                `Reset ${practiceConfig?.name} to default settings?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Reset', 
                    style: 'destructive',
                    onPress: () => resetPracticeTypeToDefaults(practiceType)
                  }
                ]
              );
            }}
          >
            <Ionicons name="refresh-outline" size={20} color={Colors.error} />
            <Text style={styles.resetButtonText}>Reset to Defaults</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Numeric Input Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            
            <TextInput
              ref={inputRef}
              style={styles.modalInput}
              value={modalValue}
              onChangeText={setModalValue}
              keyboardType="numeric"
              placeholder="Enter value"
              selectTextOnFocus={true}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleModalSubmit}
              >
                <Text style={styles.confirmButtonText}>Set</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingVertical: 12,
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
    marginTop: 12,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  instructionsContainer: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  instructionsText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  // Slider Components (reused from original SettingsScreen)
  sliderSection: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  sliderContainer: {
    paddingHorizontal: 8,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    paddingVertical: 4,
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  rangeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  valueButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.backgroundSecondary,
  },
  rangeSeparator: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginHorizontal: 16,
  },

  rangeSliderContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  tickContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginHorizontal: 12,
  },
  tickMark: {
    width: 1,
    height: 6,
    backgroundColor: Colors.textSecondary,
    opacity: 0.5,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
    marginHorizontal: 12,
  },
  rangeLabelText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  sliderSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  // Counter Components
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 6,
  },
  counterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValueButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 14,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
    minWidth: 70,
    alignItems: 'center',
  },
  counterValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  // Reset Button
  resetSection: {
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.error,
    backgroundColor: Colors.background,
  },
  resetButtonText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 120,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.backgroundSecondary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.backgroundSecondary,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
});

