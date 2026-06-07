import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsContext = createContext();

// Practice type definitions
export const PRACTICE_TYPES = {
  DOWN_SET_WHISTLE: 'down-set-whistle',
  RAPID_CLAMP: 'rapid-clamp',
  THREE_WHISTLE: 'three-whistle'
};

export const PRACTICE_TYPE_CONFIGS = {
  [PRACTICE_TYPES.DOWN_SET_WHISTLE]: {
    name: 'Down Set Whistle',
    description: 'Traditional face-off sequence with Down, Set, and Whistle commands',
    icon: 'play-circle',
    defaultSettings: {
      downMin: 0.5,
      downMax: 2.0,
      setMin: 0.3,
      setMax: 1.5,
      restBetweenMin: 2.0,
      restBetweenMax: 4.0,
      numberOfReps: 5,
    }
  },
  [PRACTICE_TYPES.RAPID_CLAMP]: {
    name: 'Rapid Clamp',
    description: 'Repetitive whistle sounds for continuous clamping practice',
    icon: 'timer',
    defaultSettings: {
      restBetweenMin: 1.0,
      restBetweenMax: 3.0,
      numberOfReps: 10,
    }
  },
  [PRACTICE_TYPES.THREE_WHISTLE]: {
    name: 'Three Whistle Drill',
    description: 'Clamp, Pull, Pop sequence with pause for reset',
    icon: 'repeat',
    defaultSettings: {
      clampToPullMin: 0.3,
      clampToPullMax: 1.0,
      pullToPopMin: 0.3,
      pullToPopMax: 1.0,
      resetPauseMin: 3.0,
      resetPauseMax: 5.0,
      numberOfReps: 5,
    }
  }
};

const defaultSettings = {
  // Current selected practice type
  selectedPracticeType: PRACTICE_TYPES.DOWN_SET_WHISTLE,
  
  // Audio settings (shared across all practice types)
  audioType: 'tts', // 'tts' or 'recorded'
  hasCustomVoice: false,
  hasCustomWhistle: false,
  customDownUri: null,
  customSetUri: null,
  customWhistleUri: null,
  
  // Practice type specific settings
  practiceSettings: {
    [PRACTICE_TYPES.DOWN_SET_WHISTLE]: {
      ...PRACTICE_TYPE_CONFIGS[PRACTICE_TYPES.DOWN_SET_WHISTLE].defaultSettings
    },
    [PRACTICE_TYPES.RAPID_CLAMP]: {
      ...PRACTICE_TYPE_CONFIGS[PRACTICE_TYPES.RAPID_CLAMP].defaultSettings
    },
    [PRACTICE_TYPES.THREE_WHISTLE]: {
      ...PRACTICE_TYPE_CONFIGS[PRACTICE_TYPES.THREE_WHISTLE].defaultSettings
    }
  }
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from storage on app start
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('lacrosse_settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        // Merge with defaults to ensure all practice types have settings
        const mergedSettings = {
          ...defaultSettings,
          ...parsedSettings,
          practiceSettings: {
            ...defaultSettings.practiceSettings,
            ...parsedSettings.practiceSettings
          }
        };
        setSettings(mergedSettings);
      }
    } catch (error) {
      console.log('Error loading settings:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('lacrosse_settings', JSON.stringify(newSettings));
    } catch (error) {
      console.log('Error saving settings:', error);
    }
  };

  const updateSetting = (key, value) => {
    const newSettings = {
      ...settings,
      [key]: value
    };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const updateMultipleSettings = (updates) => {
    const newSettings = {
      ...settings,
      ...updates
    };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
    saveSettings(defaultSettings);
  };

  // Update practice type selection
  const updatePracticeType = (practiceType) => {
    if (!Object.values(PRACTICE_TYPES).includes(practiceType)) {
      console.error('Invalid practice type:', practiceType);
      return;
    }
    updateSetting('selectedPracticeType', practiceType);
  };

  // Update settings for a specific practice type
  const updatePracticeTypeSetting = (practiceType, key, value) => {
    const newSettings = {
      ...settings,
      practiceSettings: {
        ...settings.practiceSettings,
        [practiceType]: {
          ...settings.practiceSettings[practiceType],
          [key]: value
        }
      }
    };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Update multiple settings for a specific practice type
  const updatePracticeTypeSettings = (practiceType, updates) => {
    const newSettings = {
      ...settings,
      practiceSettings: {
        ...settings.practiceSettings,
        [practiceType]: {
          ...settings.practiceSettings[practiceType],
          ...updates
        }
      }
    };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Get current practice type settings
  const getCurrentPracticeSettings = () => {
    return settings.practiceSettings[settings.selectedPracticeType] || {};
  };

  // Get settings for a specific practice type
  const getPracticeTypeSettings = (practiceType) => {
    return settings.practiceSettings[practiceType] || {};
  };

  // Reset specific practice type to defaults
  const resetPracticeTypeToDefaults = (practiceType) => {
    const defaultConfig = PRACTICE_TYPE_CONFIGS[practiceType];
    if (defaultConfig) {
      updatePracticeTypeSettings(practiceType, defaultConfig.defaultSettings);
    }
  };

  const getRandomDelay = (minKey, maxKey, practiceType = null) => {
    const targetSettings = practiceType 
      ? settings.practiceSettings[practiceType] 
      : getCurrentPracticeSettings();
    
    const min = targetSettings[minKey];
    const max = targetSettings[maxKey];
    
    if (min === undefined || max === undefined) {
      console.warn(`Missing delay settings: ${minKey}, ${maxKey} for practice type:`, practiceType || settings.selectedPracticeType);
      return 1; // Default 1 second
    }
    
    return Math.random() * (max - min) + min;
  };

  const value = {
    settings,
    isLoaded,
    updateSetting,
    updateMultipleSettings,
    resetToDefaults,
    getRandomDelay,
    // New practice type methods
    updatePracticeType,
    updatePracticeTypeSetting,
    updatePracticeTypeSettings,
    getCurrentPracticeSettings,
    getPracticeTypeSettings,
    resetPracticeTypeToDefaults,
    // Constants for easy access
    PRACTICE_TYPES,
    PRACTICE_TYPE_CONFIGS,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
