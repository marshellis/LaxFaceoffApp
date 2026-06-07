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
import AudioService from '../services/AudioService';
import SegmentedControl from '../components/SegmentedControl';

export default function SettingsScreen({ navigation }) {
  const { 
    settings, 
    updateSetting, 
    updateMultipleSettings, 
    resetToDefaults,
    updatePracticeType,
    updatePracticeTypeSettings,
    getCurrentPracticeSettings,
    resetPracticeTypeToDefaults
  } = useSettings();
  
  console.log('🔧 SettingsScreen loaded, current settings:', settings);
  
  // Modal state for numeric input
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalValue, setModalValue] = useState('');
  const [modalCallback, setModalCallback] = useState(null);
  const inputRef = useRef(null);

  // Get current practice settings
  const currentPracticeSettings = getCurrentPracticeSettings();
  
  // Segmented control data
  const practiceTypeSegments = [
    'Down Set Whistle',
    'Rapid Clamp', 
    'Three Whistle'
  ];
  
  const practiceTypeValues = [
    PRACTICE_TYPES.DOWN_SET_WHISTLE,
    PRACTICE_TYPES.RAPID_CLAMP,
    PRACTICE_TYPES.THREE_WHISTLE
  ];
  
  const selectedSegmentIndex = practiceTypeValues.indexOf(settings.selectedPracticeType);

  // Function to play current sounds
  const playCurrentSound = async (soundType) => {
    try {
      console.log(`🔊 Playing current ${soundType} sound`);
      console.log('Current settings:', {
        customDownUri: settings.customDownUri,
        customSetUri: settings.customSetUri,
        customWhistleUri: settings.customWhistleUri
      });
      
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

  // Auto-focus and select text when modal opens
  useEffect(() => {
    if (modalVisible && inputRef.current) {
      // Small delay to ensure modal is fully rendered
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
      updatePracticeTypeSettings(settings.selectedPracticeType, {
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
          {/* Min and Max values on same line - clickable for numeric input */}
          <View style={styles.rangeRow}>
            <TouchableOpacity 
              style={styles.valueButton}
              onPress={() => {
                showInputModal(
                  `Set Minimum (0-30)`,
                  minValue || 0,
                  (value) => {
                    const num = parseFloat(value);
                    if (!isNaN(num) && num >= 0 && num < maxValue && num <= 30) {
                      updateSetting(minKey, Math.round(num));
                    } else {
                      Alert.alert('Invalid Value', `Please enter a number between 0 and ${Math.min(maxValue.toFixed(0), 30)}`);
                    }
                  }
                );
              }}
            >
              <Text style={styles.rangeLabel}>Min: {(minValue || 0).toFixed(0)}</Text>
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
                    if (!isNaN(num) && num <= 30 && num > minValue && num >= 0) {
                      updateSetting(maxKey, Math.round(num));
                    } else {
                      Alert.alert('Invalid Value', `Please enter a number between ${Math.max(minValue.toFixed(0), 0)} and 30`);
                    }
                  }
                );
              }}
            >
              <Text style={styles.rangeLabel}>Max: {(maxValue || 0).toFixed(0)}</Text>
            </TouchableOpacity>
          </View>
          
          {/* Single Range Slider with two thumbs */}
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
              onValuesChange={handleValuesChange}
              onValuesChangeFinish={handleValuesChange}
            />
            
            {/* Number line with ticks */}
            <View style={styles.numberLine}>
              {Array.from({ length: 11 }, (_, i) => {
                const value = i;
                return (
                  <View key={value} style={styles.tickContainer}>
                    <View style={styles.tick} />
                    <Text style={styles.tickLabel}>{value}</Text>
                  </View>
                );
              })}
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
            const newValue = Math.max(1, currentPracticeSettings.numberOfReps - 1);
            updatePracticeTypeSettings(settings.selectedPracticeType, { numberOfReps: newValue });
          }}
        >
          <Ionicons name="remove" size={24} color={Colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.counterValueButton}
          onPress={() => {
            showInputModal(
              'Set Number of Reps (1-50)',
              currentPracticeSettings.numberOfReps || 5,
              (value) => {
                const num = parseInt(value);
                if (!isNaN(num) && num >= 1 && num <= 50) {
                  updatePracticeTypeSettings(settings.selectedPracticeType, { numberOfReps: num });
                } else {
                  Alert.alert('Invalid Value', 'Please enter a number between 1 and 50');
                }
              }
            );
          }}
        >
          <Text style={styles.counterValue}>{currentPracticeSettings.numberOfReps}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.counterButton}
          onPress={() => {
            const newValue = Math.min(50, currentPracticeSettings.numberOfReps + 1);
            updatePracticeTypeSettings(settings.selectedPracticeType, { numberOfReps: newValue });
          }}
        >
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const SettingRow = ({ label, value, onPress, icon }) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={24} color={Colors.primary} />
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <View style={styles.settingRight}>
        <Text style={styles.settingValue}>{value}</Text>
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
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Practice Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Practice Type</Text>
          
          <SegmentedControl
            segments={practiceTypeSegments}
            selectedIndex={selectedSegmentIndex}
            onChange={(index) => {
              const selectedPracticeType = practiceTypeValues[index];
              updatePracticeType(selectedPracticeType);
            }}
            style={styles.practiceTypeSegmentedControl}
          />
          
          {/* Practice Type Description */}
          <View style={styles.practiceTypeDescription}>
            <Text style={styles.practiceTypeDescriptionText}>
              {PRACTICE_TYPE_CONFIGS[settings.selectedPracticeType]?.description || ''}
            </Text>
          </View>
        </View>

        {/* Timing Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {PRACTICE_TYPE_CONFIGS[settings.selectedPracticeType]?.name || 'Practice'} Settings
          </Text>
          
          {/* Down-Set-Whistle Settings */}
          {settings.selectedPracticeType === PRACTICE_TYPES.DOWN_SET_WHISTLE && (
            <>
              <TimingSliderRow
                label="Down to Set (seconds)"
                icon="timer-outline"
                minValue={currentPracticeSettings.downMin}
                maxValue={currentPracticeSettings.downMax}
                minKey="downMin"
                maxKey="downMax"
                absoluteMin={0}
                absoluteMax={10}
              />
              
              <TimingSliderRow
                label="Set to Whistle (seconds)"
                icon="timer-outline"
                minValue={currentPracticeSettings.setMin}
                maxValue={currentPracticeSettings.setMax}
                minKey="setMin"
                maxKey="setMax"
                absoluteMin={0}
                absoluteMax={10}
              />
              
              <TimingSliderRow
                label="Rest Between Reps (seconds)"
                icon="pause-outline"
                minValue={currentPracticeSettings.restBetweenMin}
                maxValue={currentPracticeSettings.restBetweenMax}
                minKey="restBetweenMin"
                maxKey="restBetweenMax"
                absoluteMin={0}
                absoluteMax={10}
              />
            </>
          )}
          
          {/* Rapid Clamp Settings */}
          {settings.selectedPracticeType === PRACTICE_TYPES.RAPID_CLAMP && (
            <>
              <TimingSliderRow
                label="Rest Between Reps (seconds)"
                icon="pause-outline"
                minValue={currentPracticeSettings.restBetweenMin}
                maxValue={currentPracticeSettings.restBetweenMax}
                minKey="restBetweenMin"
                maxKey="restBetweenMax"
                absoluteMin={0.5}
                absoluteMax={10}
              />
            </>
          )}
          
          {/* Three Whistle Settings */}
          {settings.selectedPracticeType === PRACTICE_TYPES.THREE_WHISTLE && (
            <>
              <TimingSliderRow
                label="Clamp to Pull (seconds)"
                icon="timer-outline"
                minValue={currentPracticeSettings.clampToPullMin}
                maxValue={currentPracticeSettings.clampToPullMax}
                minKey="clampToPullMin"
                maxKey="clampToPullMax"
                absoluteMin={0.1}
                absoluteMax={3}
              />
              
              <TimingSliderRow
                label="Pull to Pop (seconds)"
                icon="timer-outline"
                minValue={currentPracticeSettings.pullToPopMin}
                maxValue={currentPracticeSettings.pullToPopMax}
                minKey="pullToPopMin"
                maxKey="pullToPopMax"
                absoluteMin={0.1}
                absoluteMax={3}
              />
              
              <TimingSliderRow
                label="Reset Pause (seconds)"
                icon="pause-outline"
                minValue={currentPracticeSettings.resetPauseMin}
                maxValue={currentPracticeSettings.resetPauseMax}
                minKey="resetPauseMin"
                maxKey="resetPauseMax"
                absoluteMin={1}
                absoluteMax={10}
              />
            </>
          )}
          
          <RepCounterRow />
        </View>

        {/* Audio Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio Settings</Text>
          
          <SettingRow
            label="Record Custom Audio"
            value=""
            icon="mic-outline"
            onPress={() => navigation.navigate('Recording')}
          />
          
          {/* Play Current Sounds */}
          <View style={styles.playCurrentSounds}>
            <Text style={styles.playCurrentTitle}>🔊 Preview Current Sounds</Text>
            {console.log('🎯 Rendering preview buttons section')}
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

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <SettingRow
            label="App Version"
            value="1.0.0"
            icon="information-circle-outline"
            onPress={() => {}}
          />
          
          <SettingRow
            label="Help & Support"
            value=""
            icon="help-circle-outline"
            onPress={() => {
              console.log('Show help');
            }}
          />
        </View>

        {/* Reset Button */}
        <View style={styles.resetSection}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetToDefaults}
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
              returnKeyType="done"
              onSubmitEditing={handleModalSubmit}
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
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 12,
  },
  // Slider Components
  sliderSection: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 12,
  },
  sliderContainer: {
    paddingHorizontal: 8,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
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
  sliderSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 8,
    fontWeight: '500',
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 16,
  },
  halfSlider: {
    width: '100%',
    height: 40,
  },
  // Range Slider Styles
  rangeSliderContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  rangeSlider: {
    width: '100%',
    height: 60,
  },
  rangeThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.accent,
    borderWidth: 2,
    borderColor: Colors.background,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  rangeRail: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.backgroundSecondary,
  },
  rangeRailSelected: {
    height: 4,
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  // Number line and ticks
  numberLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 12,
    width: 280,
  },
  tickContainer: {
    alignItems: 'center',
  },
  tick: {
    width: 2,
    height: 6,
    backgroundColor: Colors.textSecondary,
    marginBottom: 2,
  },
  tickLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  sliderThumb: {
    backgroundColor: Colors.accent,
    width: 20,
    height: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 120,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 2,
    borderColor: Colors.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    backgroundColor: Colors.backgroundSecondary,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.backgroundSecondary,
  },
  confirmButton: {
    backgroundColor: Colors.accent,
  },
  cancelButtonText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
  rangeDisplay: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginTop: 8,
    paddingVertical: 8,
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  // Counter Components
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  counterButton: {
    backgroundColor: Colors.background,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  counterValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    minWidth: 60,
    textAlign: 'center',
  },
  counterValueButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.backgroundSecondary,
    minWidth: 80,
    alignItems: 'center',
  },
  // Regular Setting Rows
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    marginBottom: 6,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: Colors.textPrimary,
    marginLeft: 12,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginRight: 8,
  },
  resetSection: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: 12,
  },
  resetButtonText: {
    fontSize: 16,
    color: Colors.error,
    marginLeft: 8,
    fontWeight: '600',
  },
  playCurrentSounds: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  playCurrentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 8,
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.background,
  },
  playButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  // Practice Type Selector Styles
  practiceTypeSegmentedControl: {
    marginBottom: 8,
  },
  practiceTypeDescription: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  practiceTypeDescriptionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSecondary,
  },
  modalBackButton: {
    padding: 8,
    marginRight: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
});
