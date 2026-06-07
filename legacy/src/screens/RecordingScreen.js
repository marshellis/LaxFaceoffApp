import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useAudioRecorder, createAudioPlayer, requestRecordingPermissionsAsync } from 'expo-audio';
import { useSettings } from '../contexts/SettingsContext';

export default function RecordingScreen({ navigation }) {
  const { updateSetting } = useSettings();
  const [selectedSound, setSelectedSound] = useState('down'); // 'down', 'set', 'whistle'
  const [recordingState, setRecordingState] = useState('idle'); // 'idle', 'recording', 'recorded'
  const [previewPlayer, setPreviewPlayer] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [currentRecordingUri, setCurrentRecordingUri] = useState(null);

  // Recording options
  const recordingOptions = {
    android: {
      extension: '.m4a',
      outputFormat: 'mpeg4',
      audioEncoder: 'aac',
      sampleRate: 44100,
      numberOfChannels: 2,
      bitRate: 128000,
    },
    ios: {
      extension: '.m4a',
      outputFormat: 'mp4',
      audioQuality: 'high',
      sampleRate: 44100,
      numberOfChannels: 2,
      bitRate: 128000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
  };

  const recorder = useAudioRecorder(recordingOptions);

  // Request permissions on component mount
  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      console.log('Requesting recording permissions...');
      const { status } = await requestRecordingPermissionsAsync();
      
      if (status === 'granted') {
        setHasPermission(true);
        console.log('Recording permission granted');
      } else {
        setHasPermission(false);
        console.log('Recording permission denied');
        Alert.alert(
          'Permission Required',
          'This app needs microphone access to record custom sounds. Please enable microphone permission in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              // On iOS/Android, this would open app settings
              console.log('Open app settings');
            }},
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setHasPermission(false);
    }
  };

  const soundTypes = [
    { id: 'down', label: 'Down Command', icon: 'play-forward' },
    { id: 'set', label: 'Set Command', icon: 'play-forward' },
    { id: 'whistle', label: 'Whistle Sound', icon: 'musical-notes' },
  ];

  const startRecording = async () => {
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Microphone permission is required to record audio. Please grant permission and try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Request Permission', onPress: requestPermissions },
        ]
      );
      return;
    }

    try {
      console.log('Starting recording for:', selectedSound);
      console.log('Recorder state before start:', {
        isRecording: recorder.isRecording,
        currentTime: recorder.currentTime,
        uri: recorder.uri
      });
      
      // Prepare the recorder first
      console.log('Preparing recorder...');
      await recorder.prepareToRecordAsync(recordingOptions);
      console.log('Recorder prepared successfully');
      
      // Start recording
      recorder.record();
      setRecordingState('recording');
      console.log('Recording started successfully');
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      console.log('Stopping recording');
      console.log('Recorder state before stop:', {
        isRecording: recorder.isRecording,
        currentTime: recorder.currentTime,
        uri: recorder.uri
      });
      
      await recorder.stop();
      
      // Get the URI from the recorder object
      const recordingUri = recorder.uri;
      console.log('Recording URI after stop:', recordingUri);
      
      if (recordingUri && recordingUri.startsWith('file://')) {
        setRecordingState('recorded');
        setCurrentRecordingUri(recordingUri);
        const player = createAudioPlayer(recordingUri);
        setPreviewPlayer(player);
        console.log('Recording saved successfully to:', recordingUri);
      } else {
        console.error('No valid recording URI found:', recordingUri);
        Alert.alert('Recording Error', 'Recording failed. Please try again.');
        setRecordingState('idle');
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Recording Error', 'Failed to stop recording. Please try again.');
      setRecordingState('idle');
    }
  };

  const playPreview = () => {
    if (previewPlayer) {
      console.log('Playing preview with player:', previewPlayer);
      previewPlayer.pause();
      previewPlayer.seekTo(0);
      previewPlayer.play();
      console.log('Preview playback started');
    } else {
      console.log('No preview player available');
    }
  };

  const saveRecording = () => {
    if (!currentRecordingUri) {
      Alert.alert('Error', 'No recording to save');
      return;
    }

    Alert.alert(
      'Save Recording',
      `Save this recording as your custom ${selectedSound} sound?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async () => {
            try {
              // Save the recording URI to settings
              const settingKey = `custom${selectedSound.charAt(0).toUpperCase() + selectedSound.slice(1)}Uri`;
              await updateSetting(settingKey, currentRecordingUri);
              
              console.log(`Saved ${selectedSound} recording:`, currentRecordingUri);
              Alert.alert('Success', `Custom ${selectedSound} sound saved!`);
              
              // Reset state
              setRecordingState('idle');
              setPreviewPlayer(null);
              setCurrentRecordingUri(null);
            } catch (error) {
              console.error('Failed to save recording:', error);
              Alert.alert('Error', 'Failed to save recording. Please try again.');
            }
          },
        },
      ]
    );
  };

  const discardRecording = () => {
    setRecordingState('idle');
    setPreviewPlayer(null);
    setCurrentRecordingUri(null);
    console.log('Recording discarded');
  };

  const getRecordingButtonStyle = () => {
    switch (recordingState) {
      case 'recording':
        return [styles.recordButton, styles.recordButtonActive];
      case 'recorded':
        return [styles.recordButton, styles.recordButtonRecorded];
      default:
        return styles.recordButton;
    }
  };

  const getRecordingButtonIcon = () => {
    switch (recordingState) {
      case 'recording':
        return 'stop';
      case 'recorded':
        return 'checkmark';
      default:
        return 'mic';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Record Custom Sounds</Text>
        </View>

        {/* Sound Type Selection */}
        <View style={styles.soundTypeContainer}>
          <Text style={styles.sectionTitle}>Select Sound Type</Text>
          <View style={styles.soundTypeGrid}>
            {soundTypes.map((sound) => (
              <TouchableOpacity
                key={sound.id}
                style={[
                  styles.soundTypeButton,
                  selectedSound === sound.id && styles.soundTypeButtonActive,
                ]}
                onPress={() => {
                  setSelectedSound(sound.id);
                  setRecordingState('idle');
                  setPreviewPlayer(null);
                }}
              >
                <Ionicons
                  name={sound.icon}
                  size={32}
                  color={
                    selectedSound === sound.id ? Colors.textLight : Colors.primary
                  }
                />
                <Text
                  style={[
                    styles.soundTypeText,
                    selectedSound === sound.id && styles.soundTypeTextActive,
                  ]}
                >
                  {sound.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recording Controls */}
        <View style={styles.recordingContainer}>
          <Text style={styles.sectionTitle}>
            Recording: {soundTypes.find(s => s.id === selectedSound)?.label}
          </Text>
          
          <View style={styles.recordingControls}>
            <TouchableOpacity
              style={getRecordingButtonStyle()}
              onPress={recordingState === 'recording' ? stopRecording : startRecording}
              disabled={recordingState === 'recorded' || !hasPermission}
            >
              <Ionicons
                name={getRecordingButtonIcon()}
                size={48}
                color={Colors.textLight}
              />
            </TouchableOpacity>
            
            <Text style={styles.recordingStatus}>
              {!hasPermission && 'Microphone permission required'}
              {hasPermission && recordingState === 'idle' && 'Tap to start recording'}
              {hasPermission && recordingState === 'recording' && 'Recording... Tap to stop'}
              {hasPermission && recordingState === 'recorded' && 'Recording complete!'}
            </Text>
          </View>

          {/* Preview and Save Controls */}
          {recordingState === 'recorded' && (
            <View style={styles.previewControls}>
              <TouchableOpacity
                style={styles.previewButton}
                onPress={playPreview}
              >
                <Ionicons name="play" size={24} color={Colors.primary} />
                <Text style={styles.previewButtonText}>Preview</Text>
              </TouchableOpacity>

              <View style={styles.saveControls}>
                <TouchableOpacity
                  style={styles.discardButton}
                  onPress={discardRecording}
                >
                  <Text style={styles.discardButtonText}>Discard</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveRecording}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Recording Tips:</Text>
          <Text style={styles.instructionsText}>
            • Hold your device close to your mouth
          </Text>
          <Text style={styles.instructionsText}>
            • Speak clearly and loudly
          </Text>
          <Text style={styles.instructionsText}>
            • Keep recordings short (1-2 seconds)
          </Text>
          <Text style={styles.instructionsText}>
            • Record in a quiet environment
          </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 16,
  },
  soundTypeContainer: {
    marginTop: 30,
  },
  soundTypeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  soundTypeButton: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 5,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.backgroundSecondary,
    backgroundColor: Colors.background,
  },
  soundTypeButtonActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent,
  },
  soundTypeText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
    textAlign: 'center',
  },
  soundTypeTextActive: {
    color: Colors.textLight,
  },
  recordingContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  recordingControls: {
    alignItems: 'center',
    marginTop: 20,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
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
  recordButtonActive: {
    backgroundColor: Colors.error,
  },
  recordButtonRecorded: {
    backgroundColor: Colors.success,
  },
  recordingStatus: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  previewControls: {
    marginTop: 30,
    alignItems: 'center',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: 20,
  },
  previewButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  saveControls: {
    flexDirection: 'row',
    gap: 16,
  },
  discardButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.error,
  },
  discardButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: Colors.accent,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textLight,
  },
  instructionsContainer: {
    marginTop: 40,
    padding: 20,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
});
