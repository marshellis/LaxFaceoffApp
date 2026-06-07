import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useSettings, PRACTICE_TYPES, PRACTICE_TYPE_CONFIGS } from '../contexts/SettingsContext';
import { usePracticeHistory } from '../contexts/PracticeHistoryContext';
import AudioService from '../services/AudioService';

export default function PracticeScreen({ navigation }) {
  const { 
    settings, 
    isLoaded, 
    getCurrentPracticeSettings, 
    getRandomDelay: getContextRandomDelay 
  } = useSettings();
  const { addPracticeSession } = usePracticeHistory();
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentRep, setCurrentRep] = useState(0);
  const [status, setStatus] = useState('ready'); // ready, down, set, whistle, rest, complete, paused
  const [currentPhase, setCurrentPhase] = useState(''); // Current phase description
  const timeoutRefs = useRef([]); // Track all timeouts for cleanup
  const isActiveRef = useRef(false); // Ref to track active state for closures
  const isPausedRef = useRef(false); // Ref to track paused state for closures
  const pausedState = useRef(null); // Store state when paused for resuming
  const practiceStartTime = useRef(null); // Track when practice session started

  // Debug: Log settings when component mounts or settings change
  useEffect(() => {
    console.log('PracticeScreen - Settings loaded:', isLoaded, 'Settings:', settings);
  }, [settings, isLoaded]);

  // Handle navigation away from screen - stop practice if active
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (isActive) {
        console.log('Navigation detected - stopping practice');
        // Stop the practice when navigating away
        resetPractice();
      }
    });

    return unsubscribe;
  }, [navigation, isActive]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      console.log('PracticeScreen unmounting - cleaning up');
      // Clear timeouts but don't call resetPractice to avoid state updates on unmounted component
      timeoutRefs.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      timeoutRefs.current = [];
      AudioService.stopSpeech();
    };
  }, []);

  const getRandomDelay = (minKey, maxKey) => {
    return getContextRandomDelay(minKey, maxKey) * 1000; // Convert to milliseconds
  };

  // Get current practice settings
  const currentPracticeSettings = getCurrentPracticeSettings();

  // Helper function to wait with timeout tracking
  const waitWithTimeout = (delay) => {
    return new Promise(resolve => {
      const timeout = setTimeout(resolve, delay);
      timeoutRefs.current.push(timeout);
    });
  };

  // Helper function to check if practice should continue (not stopped or paused)
  const shouldContinue = () => {
    return isActiveRef.current && !isPausedRef.current;
  };

  // Down-Set-Whistle sequence (original)
  const runDownSetWhistleSequence = async (repNumber) => {
    console.log(`🏒 Starting Down-Set-Whistle sequence for rep ${repNumber}`);
    if (!shouldContinue()) return;
    
    // Initialize AudioService with current settings
    console.log('🔧 Initializing AudioService...');
    await AudioService.initialize(settings);
    console.log('✅ AudioService initialized');
    
    // Phase 1: "Down" command
    setStatus('down');
    setCurrentPhase('Down!');
    console.log('🔊 Phase 1: Playing "Down" command');
    await AudioService.playDown();
    console.log('✅ "Down" command completed');
    
    if (!shouldContinue()) return;
    
    // Wait random time between Down and Set
    const downToSetDelay = getRandomDelay('downMin', 'downMax');
    console.log(`⏱️ Waiting ${downToSetDelay}ms between Down and Set`);
    await waitWithTimeout(downToSetDelay);
    console.log('✅ Down-to-Set delay completed');
    
    if (!shouldContinue()) return;
    
    // Phase 2: "Set" command
    setStatus('set');
    setCurrentPhase('Set!');
    console.log('🔊 Phase 2: Playing "Set" command');
    await AudioService.playSet();
    console.log('✅ "Set" command completed');
    
    if (!shouldContinue()) return;
    
    // Wait random time between Set and Whistle
    const setToWhistleDelay = getRandomDelay('setMin', 'setMax');
    console.log(`⏱️ Waiting ${setToWhistleDelay}ms between Set and Whistle`);
    await waitWithTimeout(setToWhistleDelay);
    console.log('✅ Set-to-Whistle delay completed');
    
    if (!shouldContinue()) return;
    
    // Phase 3: Whistle
    setStatus('whistle');
    setCurrentPhase('GO!');
    console.log('🔊 Phase 3: Playing whistle - THIS IS WHERE HANGING MIGHT OCCUR');
    await AudioService.playWhistle();
    console.log('✅ Whistle completed - sequence finished successfully!');
  };

  // Rapid Clamp sequence
  const runRapidClampSequence = async (repNumber) => {
    if (!shouldContinue()) return;
    
    // Initialize AudioService with current settings
    await AudioService.initialize(settings);
    
    // Just play whistle immediately
    setStatus('whistle');
    setCurrentPhase('CLAMP!');
    console.log('Playing clamp whistle');
    await AudioService.playWhistle();
  };

  // Three Whistle sequence (Clamp-Pull-Pop)
  const runThreeWhistleSequence = async (repNumber) => {
    if (!shouldContinue()) return;
    
    // Initialize AudioService with current settings
    await AudioService.initialize(settings);
    
    // Phase 1: Clamp whistle
    setStatus('whistle');
    setCurrentPhase('CLAMP!');
    console.log('Playing clamp whistle');
    await AudioService.playWhistle();
    
    if (!shouldContinue()) return;
    
    // Wait between clamp and pull
    const clampToPullDelay = getRandomDelay('clampToPullMin', 'clampToPullMax');
    await waitWithTimeout(clampToPullDelay);
    
    if (!shouldContinue()) return;
    
    // Phase 2: Pull whistle
    setStatus('whistle');
    setCurrentPhase('PULL!');
    console.log('Playing pull whistle');
    await AudioService.playWhistle();
    
    if (!shouldContinue()) return;
    
    // Wait between pull and pop
    const pullToPopDelay = getRandomDelay('pullToPopMin', 'pullToPopMax');
    await waitWithTimeout(pullToPopDelay);
    
    if (!shouldContinue()) return;
    
    // Phase 3: Pop whistle
    setStatus('whistle');
    setCurrentPhase('POP!');
    console.log('Playing pop whistle');
    await AudioService.playWhistle();
    
    if (!shouldContinue()) return;
    
    // Reset pause (longer pause for player to reset)
    setStatus('rest');
    setCurrentPhase('Reset... Get ready for next sequence');
    const resetPause = getRandomDelay('resetPauseMin', 'resetPauseMax');
    await waitWithTimeout(resetPause);
  };

  // Main practice sequence runner
  const runPracticeSequence = async (repNumber) => {
    try {
      console.log(`Starting rep ${repNumber} of ${currentPracticeSettings.numberOfReps}, practice type: ${settings.selectedPracticeType}`);
      
      // Check if we should stop (user navigated away or paused)
      if (!shouldContinue()) {
        console.log('Practice stopped or paused, exiting sequence');
        return;
      }
      
      // Run the appropriate sequence based on practice type
      switch (settings.selectedPracticeType) {
        case PRACTICE_TYPES.DOWN_SET_WHISTLE:
          await runDownSetWhistleSequence(repNumber);
          break;
        case PRACTICE_TYPES.RAPID_CLAMP:
          await runRapidClampSequence(repNumber);
          break;
        case PRACTICE_TYPES.THREE_WHISTLE:
          await runThreeWhistleSequence(repNumber);
          break;
        default:
          console.error('Unknown practice type:', settings.selectedPracticeType);
          return;
      }
      
      if (!shouldContinue()) return;
      
      // Handle rest period and next rep
      if (repNumber < currentPracticeSettings.numberOfReps) {
        // Add rest period between reps for all practice types
        setStatus('rest');
        setCurrentPhase('Rest');
        
        const restDelay = getRandomDelay('restBetweenMin', 'restBetweenMax');
        await waitWithTimeout(restDelay);
        
        if (!shouldContinue()) return;
        
        // Start next rep
        setCurrentRep(repNumber + 1);
        await runPracticeSequence(repNumber + 1);
      } else {
        // Practice complete - record the session
        if (practiceStartTime.current) {
          const duration = Math.floor((Date.now() - practiceStartTime.current) / 1000);
          addPracticeSession(
            settings.selectedPracticeType,
            currentPracticeSettings.numberOfReps,
            duration
          );
          console.log('Practice session recorded:', {
            type: settings.selectedPracticeType,
            reps: currentPracticeSettings.numberOfReps,
            duration
          });
        }
        
        setStatus('complete');
        setCurrentPhase('Practice Complete!');
        setIsActive(false);
        isActiveRef.current = false;
        setIsPaused(false);
        isPausedRef.current = false;
      }
    } catch (error) {
      console.error('Error in practice sequence:', error);
      setStatus('ready');
      setIsActive(false);
      isActiveRef.current = false;
      setIsPaused(false);
      isPausedRef.current = false;
    }
  };

  const startPractice = async () => {
    if (!isLoaded) {
      console.log('Settings not loaded yet, waiting...');
      return;
    }
    
    console.log('Starting practice with settings:', settings);
    
    // Clear any existing timeouts first
    timeoutRefs.current.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    timeoutRefs.current = [];
    
    // Record practice start time
    practiceStartTime.current = Date.now();
    
    setIsActive(true);
    isActiveRef.current = true;
    setCurrentRep(1);
    setStatus('active');
    setCurrentPhase('Get ready...');
    
    console.log('Set isActive to true, starting timeout');
    
    // Small delay before starting first rep
    const startTimeout = setTimeout(() => {
      console.log('Timeout fired, calling runPracticeSequence');
      runPracticeSequence(1);
    }, 1000);
    
    timeoutRefs.current.push(startTimeout);
  };

  const resetPractice = async () => {
    console.log('Resetting practice - stopping all audio and timeouts');
    
    // Clear all timeouts first
    timeoutRefs.current.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    timeoutRefs.current = [];
    
    // Stop any ongoing audio
    await AudioService.stopSpeech();
    
    // Reset state
    setIsActive(false);
    isActiveRef.current = false;
    setIsPaused(false);
    isPausedRef.current = false;
    pausedState.current = null;
    practiceStartTime.current = null;
    setCurrentRep(0);
    setStatus('ready');
    setCurrentPhase('');
  };

  const pausePractice = async () => {
    console.log('Pausing practice');
    
    // Clear all timeouts
    timeoutRefs.current.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    timeoutRefs.current = [];
    
    // Stop any ongoing audio
    await AudioService.stopSpeech();
    
    // Store current state for resuming with more detail
    pausedState.current = {
      currentRep,
      status,
      currentPhase,
      practiceType: settings.selectedPracticeType,
      timestamp: Date.now() // For debugging
    };
    
    console.log('Paused at:', pausedState.current);
    
    // Set paused state
    setIsPaused(true);
    isPausedRef.current = true;
    setStatus('paused');
    setCurrentPhase('Practice Paused');
  };

  const resumePractice = async () => {
    console.log('Resuming practice from:', pausedState.current);
    
    // Restore paused state
    if (pausedState.current) {
      const savedRep = pausedState.current.currentRep;
      const savedStatus = pausedState.current.status;
      const savedPhase = pausedState.current.currentPhase;
      const savedPracticeType = pausedState.current.practiceType;
      
      setIsPaused(false);
      isPausedRef.current = false;
      setStatus(savedStatus);
      setCurrentPhase(savedPhase);
      
      // Continue from where we left off based on the status
      const resumeTimeout = setTimeout(async () => {
        await resumeFromStatus(savedRep, savedStatus, savedPracticeType, savedPhase);
      }, 1000);
      
      timeoutRefs.current.push(resumeTimeout);
      
      // Clear the paused state after setting up the resume
      pausedState.current = null;
    }
  };

  // Resume from specific status within a practice sequence
  const resumeFromStatus = async (repNumber, status, practiceType, savedPhase) => {
    console.log(`Resuming rep ${repNumber} from status: ${status}, phase: ${savedPhase}`);
    
    if (!shouldContinue()) return;
    
    // Initialize AudioService
    await AudioService.initialize(settings);
    
    switch (practiceType) {
      case PRACTICE_TYPES.DOWN_SET_WHISTLE:
        await resumeDownSetWhistleSequence(repNumber, status);
        break;
      case PRACTICE_TYPES.RAPID_CLAMP:
        await resumeRapidClampSequence(repNumber, status);
        break;
      case PRACTICE_TYPES.THREE_WHISTLE:
        await resumeThreeWhistleSequence(repNumber, status, savedPhase);
        break;
      default:
        console.error('Unknown practice type for resume:', practiceType);
        return;
    }
    
    // Continue with the rest of the practice sequence
    if (shouldContinue()) {
      await continueAfterCurrentRep(repNumber);
    }
  };

  // Continue with rest period and next rep after current rep is complete
  const continueAfterCurrentRep = async (repNumber) => {
    if (!shouldContinue()) return;
    
    // Handle rest period and next rep
    if (repNumber < currentPracticeSettings.numberOfReps) {
      // Add rest period between reps (except for Rapid Clamp which has its own timing)
      if (settings.selectedPracticeType !== PRACTICE_TYPES.RAPID_CLAMP) {
        setStatus('rest');
        setCurrentPhase(`Rest... Next rep in ${Math.ceil(currentPracticeSettings.restBetweenMin || 2)}s`);
        
        const restDelay = getRandomDelay('restBetweenMin', 'restBetweenMax');
        await waitWithTimeout(restDelay);
        
        if (!shouldContinue()) return;
      }
      
      // Start next rep
      setCurrentRep(repNumber + 1);
      await runPracticeSequence(repNumber + 1);
    } else {
      // Practice complete - record the session
      if (practiceStartTime.current) {
        const duration = Math.floor((Date.now() - practiceStartTime.current) / 1000);
        addPracticeSession(
          settings.selectedPracticeType,
          currentPracticeSettings.numberOfReps,
          duration
        );
        console.log('Practice session recorded from resume:', {
          type: settings.selectedPracticeType,
          reps: currentPracticeSettings.numberOfReps,
          duration
        });
      }
      
      setStatus('complete');
      setCurrentPhase('Practice Complete!');
      setIsActive(false);
      isActiveRef.current = false;
      setIsPaused(false);
      isPausedRef.current = false;
    }
  };

  const restartPractice = async () => {
    console.log('Restarting practice');
    
    // Reset everything first
    await resetPractice();
    
    // Start fresh
    setTimeout(() => {
      startPractice();
    }, 500);
  };

  // Resume Down-Set-Whistle sequence from specific status
  const resumeDownSetWhistleSequence = async (repNumber, status) => {
    switch (status) {
      case 'down':
        // We were in the down phase, continue to set after delay
        const downToSetDelay = getRandomDelay('downMin', 'downMax');
        await waitWithTimeout(downToSetDelay);
        
        if (!shouldContinue()) return;
        
        setStatus('set');
        setCurrentPhase('Set!');
        console.log('Playing "Set" command');
        await AudioService.playSet();
        
        if (!shouldContinue()) return;
        
        // Continue to whistle
        const setToWhistleDelay = getRandomDelay('setMin', 'setMax');
        await waitWithTimeout(setToWhistleDelay);
        
        if (!shouldContinue()) return;
        
        setStatus('whistle');
        setCurrentPhase('GO!');
        console.log('Playing whistle');
        await AudioService.playWhistle();
        break;
        
      case 'set':
        // We were in the set phase, continue to whistle after delay
        const setToWhistleDelay2 = getRandomDelay('setMin', 'setMax');
        await waitWithTimeout(setToWhistleDelay2);
        
        if (!shouldContinue()) return;
        
        setStatus('whistle');
        setCurrentPhase('GO!');
        console.log('Playing whistle');
        await AudioService.playWhistle();
        break;
        
      case 'whistle':
        // We were at whistle, this rep is essentially complete
        break;
        
      case 'rest':
        // We were in rest, continue rest period
        const restDelay = getRandomDelay('restBetweenMin', 'restBetweenMax');
        await waitWithTimeout(restDelay);
        break;
        
      default:
        console.log('Resuming from unknown status, restarting rep');
        await runDownSetWhistleSequence(repNumber);
    }
  };

  // Resume Rapid Clamp sequence from specific status
  const resumeRapidClampSequence = async (repNumber, status) => {
    switch (status) {
      case 'whistle':
        // Rapid clamp is just a whistle, so if we were at whistle, we're done
        break;
        
      case 'rest':
        // We were in rest, continue rest period
        const restDelay = getRandomDelay('restBetweenMin', 'restBetweenMax');
        await waitWithTimeout(restDelay);
        break;
        
      default:
        console.log('Resuming rapid clamp from unknown status, restarting rep');
        await runRapidClampSequence(repNumber);
    }
  };

  // Resume Three Whistle sequence from specific status
  const resumeThreeWhistleSequence = async (repNumber, status, savedPhase) => {
    // For three whistle, we need to track which whistle we're on
    // This is more complex since all phases are 'whistle' status
    // We'll use the savedPhase to determine position
    const phase = savedPhase;
    
    if (phase?.includes('CLAMP')) {
      // We were at clamp, continue to pull
      const clampToPullDelay = getRandomDelay('clampToPullMin', 'clampToPullMax');
      await waitWithTimeout(clampToPullDelay);
      
      if (!shouldContinue()) return;
      
      setStatus('whistle');
      setCurrentPhase('PULL!');
      console.log('Playing pull whistle');
      await AudioService.playWhistle();
      
      if (!shouldContinue()) return;
      
      // Continue to pop
      const pullToPopDelay = getRandomDelay('pullToPopMin', 'pullToPopMax');
      await waitWithTimeout(pullToPopDelay);
      
      if (!shouldContinue()) return;
      
      setStatus('whistle');
      setCurrentPhase('POP!');
      console.log('Playing pop whistle');
      await AudioService.playWhistle();
      
      if (!shouldContinue()) return;
      
      // Reset pause
      setStatus('rest');
      setCurrentPhase('Reset... Get ready for next sequence');
      const resetPause = getRandomDelay('resetPauseMin', 'resetPauseMax');
      await waitWithTimeout(resetPause);
      
    } else if (phase?.includes('PULL')) {
      // We were at pull, continue to pop
      const pullToPopDelay = getRandomDelay('pullToPopMin', 'pullToPopMax');
      await waitWithTimeout(pullToPopDelay);
      
      if (!shouldContinue()) return;
      
      setStatus('whistle');
      setCurrentPhase('POP!');
      console.log('Playing pop whistle');
      await AudioService.playWhistle();
      
      if (!shouldContinue()) return;
      
      // Reset pause
      setStatus('rest');
      setCurrentPhase('Reset... Get ready for next sequence');
      const resetPause = getRandomDelay('resetPauseMin', 'resetPauseMax');
      await waitWithTimeout(resetPause);
      
    } else if (phase?.includes('POP')) {
      // We were at pop, continue to reset pause
      setStatus('rest');
      setCurrentPhase('Reset... Get ready for next sequence');
      const resetPause = getRandomDelay('resetPauseMin', 'resetPauseMax');
      await waitWithTimeout(resetPause);
      
    } else if (status === 'rest') {
      // We were in rest/reset pause
      const resetPause = getRandomDelay('resetPauseMin', 'resetPauseMax');
      await waitWithTimeout(resetPause);
      
    } else {
      console.log('Resuming three whistle from unknown phase, restarting rep');
      await runThreeWhistleSequence(repNumber);
    }
  };

  const getStatusText = () => {
    const practiceConfig = PRACTICE_TYPE_CONFIGS[settings.selectedPracticeType];
    const practiceTypeName = practiceConfig ? practiceConfig.name : 'Practice';
    
    switch (status) {
      case 'ready':
        return `Ready for ${currentPracticeSettings.numberOfReps} reps - ${practiceTypeName}`;
      case 'active':
      case 'down':
      case 'set':
      case 'whistle':
      case 'rest':
        return currentPhase;
      case 'paused':
        return 'Practice Paused';
      case 'complete':
        return 'Practice Complete!';
      default:
        return 'Ready';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'ready':
        return Colors.ready;
      case 'active':
        return Colors.info;
      case 'down':
        return Colors.warning;
      case 'set':
        return Colors.active;
      case 'whistle':
        return Colors.success;
      case 'rest':
        return Colors.textSecondary;
      case 'paused':
        return Colors.warning;
      case 'complete':
        return Colors.success;
      default:
        return Colors.primary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Practice Session</Text>
        </View>

        {/* Status Display */}
        <View style={[styles.statusContainer, { borderColor: getStatusColor() }]}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>

        {/* Current Settings Display */}
        <View style={styles.settingsDisplay}>
          <Text style={styles.settingsTitle}>
            {PRACTICE_TYPE_CONFIGS[settings.selectedPracticeType]?.name || 'Practice'} Settings
          </Text>
          <View style={styles.settingsGrid}>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Reps</Text>
              <Text style={styles.settingValue}>{currentPracticeSettings.numberOfReps}</Text>
            </View>
            
            {/* Show different settings based on practice type */}
            {settings.selectedPracticeType === PRACTICE_TYPES.DOWN_SET_WHISTLE && (
              <>
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Down</Text>
                  <Text style={styles.settingValue}>
                    {currentPracticeSettings.downMin?.toFixed(1)}-{currentPracticeSettings.downMax?.toFixed(1)}s
                  </Text>
                </View>
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Set</Text>
                  <Text style={styles.settingValue}>
                    {currentPracticeSettings.setMin?.toFixed(1)}-{currentPracticeSettings.setMax?.toFixed(1)}s
                  </Text>
                </View>
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Rest</Text>
                  <Text style={styles.settingValue}>
                    {currentPracticeSettings.restBetweenMin?.toFixed(1)}-{currentPracticeSettings.restBetweenMax?.toFixed(1)}s
                  </Text>
                </View>
              </>
            )}
            
            {settings.selectedPracticeType === PRACTICE_TYPES.RAPID_CLAMP && (
              <>
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Rest</Text>
                  <Text style={styles.settingValue}>
                    {currentPracticeSettings.restBetweenMin?.toFixed(1)}-{currentPracticeSettings.restBetweenMax?.toFixed(1)}s
                  </Text>
                </View>
              </>
            )}
            
            {settings.selectedPracticeType === PRACTICE_TYPES.THREE_WHISTLE && (
              <>
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Clamp→Pull</Text>
                  <Text style={styles.settingValue}>
                    {currentPracticeSettings.clampToPullMin?.toFixed(1)}-{currentPracticeSettings.clampToPullMax?.toFixed(1)}s
                  </Text>
                </View>
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Pull→Pop</Text>
                  <Text style={styles.settingValue}>
                    {currentPracticeSettings.pullToPopMin?.toFixed(1)}-{currentPracticeSettings.pullToPopMax?.toFixed(1)}s
                  </Text>
                </View>
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Reset Pause</Text>
                  <Text style={styles.settingValue}>
                    {currentPracticeSettings.resetPauseMin?.toFixed(1)}-{currentPracticeSettings.resetPauseMax?.toFixed(1)}s
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Main Action Area */}
        <View style={styles.actionArea}>
          {status === 'ready' && (
            <TouchableOpacity
              style={[styles.startButton, !isLoaded && styles.disabledButton]}
              onPress={startPractice}
              activeOpacity={0.8}
              disabled={!isLoaded}
            >
              <Ionicons name="play" size={40} color={Colors.textLight} />
              <Text style={styles.startButtonText}>
                {isLoaded ? 'START' : 'LOADING...'}
              </Text>
            </TouchableOpacity>
          )}

          {(status === 'active' || status === 'down' || status === 'set' || status === 'whistle' || status === 'rest') && (
            <View style={styles.activeContainer}>
              <Text style={styles.activeText}>
                Rep {currentRep} of {currentPracticeSettings.numberOfReps}
              </Text>
              <Text style={[styles.phaseText, { color: getStatusColor() }]}>
                {currentPhase}
              </Text>
              <View style={styles.pulseContainer}>
                <View style={[styles.pulse, { backgroundColor: getStatusColor() }]} />
              </View>
              <View style={styles.controlButtons}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={pausePractice}
                  activeOpacity={0.7}
                >
                  <Ionicons name="pause" size={24} color={Colors.textLight} />
                  <Text style={styles.controlButtonText}>Pause</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.controlButton, styles.restartButton]}
                  onPress={restartPractice}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh" size={24} color={Colors.textLight} />
                  <Text style={styles.controlButtonText}>Restart</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {status === 'paused' && (
            <View style={styles.activeContainer}>
              <Text style={styles.activeText}>
                Rep {currentRep} of {currentPracticeSettings.numberOfReps}
              </Text>
              <Text style={[styles.phaseText, { color: getStatusColor() }]}>
                Practice Paused
              </Text>
              <View style={styles.pausedIcon}>
                <Ionicons name="pause-circle" size={80} color={Colors.warning} />
              </View>
              <View style={styles.controlButtons}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={resumePractice}
                  activeOpacity={0.7}
                >
                  <Ionicons name="play" size={24} color={Colors.textLight} />
                  <Text style={styles.controlButtonText}>Resume</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.controlButton, styles.restartButton]}
                  onPress={restartPractice}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh" size={24} color={Colors.textLight} />
                  <Text style={styles.controlButtonText}>Restart</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {status === 'complete' && (
            <View style={styles.completeContainer}>
              <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
              <Text style={styles.completeText}>Great job!</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={resetPractice}
                  activeOpacity={0.7}
                >
                  <Text style={styles.secondaryButtonText}>Practice Again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => navigation.goBack()}
                  activeOpacity={0.7}
                >
                  <Text style={styles.primaryButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>


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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSecondary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statusContainer: {
    marginTop: 20,
    marginHorizontal: 0,
    padding: 16,
    borderWidth: 2,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 24,
    paddingHorizontal: 40,
    borderRadius: 50,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  startButtonText: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 6,
  },
  activeContainer: {
    alignItems: 'center',
  },
  activeText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  phaseText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  pulseContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulse: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.active,
    opacity: 0.6,
  },
  completeContainer: {
    alignItems: 'center',
  },
  completeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.success,
    marginVertical: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    paddingVertical: 20,
  },
  progressText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  settingsDisplay: {
    backgroundColor: Colors.backgroundSecondary,
    marginHorizontal: 0,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  settingsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 8,
  },
  settingItem: {
    alignItems: 'center',
    minWidth: '22%',
    marginBottom: 4,
  },
  settingLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
    fontWeight: '500',
    textAlign: 'center',
  },
  settingValue: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  controlButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  controlButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  restartButton: {
    backgroundColor: Colors.accent,
  },
  controlButtonText: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  pausedIcon: {
    alignItems: 'center',
    marginVertical: 20,
  },
});
