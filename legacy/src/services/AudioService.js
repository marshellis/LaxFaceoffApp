import * as Speech from 'expo-speech';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

class AudioService {
  constructor() {
    this.whistlePlayer = null;
    this.downPlayer = null;
    this.setPlayer = null;
    this.isInitialized = false;
    this.settings = null;
  }

  async initialize(settings = null) {
    if (this.isInitialized && !settings) return;

    try {
      console.log('AudioService: Initializing with expo-audio');
      
      // Store settings for custom sound usage
      if (settings) {
        this.settings = settings;
      }
      
      // Set audio mode for playback
      await setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      // Load all sounds
      await this.loadAllSounds();
      
      this.isInitialized = true;
      console.log('AudioService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AudioService:', error);
    }
  }

  async loadAllSounds() {
    try {
      console.log('AudioService: Loading all sounds');
      
      // Load whistle sound (custom or default)
      if (this.settings?.customWhistleUri) {
        console.log('Loading custom whistle:', this.settings.customWhistleUri);
        try {
          this.whistlePlayer = createAudioPlayer(this.settings.customWhistleUri);
          console.log('Custom whistle loaded successfully');
        } catch (error) {
          console.error('Failed to load custom whistle, falling back to default:', error);
          this.whistlePlayer = createAudioPlayer(require('../../assets/sounds/whistle.mp3'));
        }
      } else {
        console.log('Loading default whistle');
        try {
          this.whistlePlayer = createAudioPlayer(require('../../assets/sounds/whistle.mp3'));
          console.log('Default whistle loaded successfully');
        } catch (error) {
          console.error('Failed to load default whistle:', error);
          this.whistlePlayer = null;
        }
      }
      
      // Load custom Down sound if available
      if (this.settings?.customDownUri) {
        console.log('Loading custom Down sound:', this.settings.customDownUri);
        try {
          this.downPlayer = createAudioPlayer(this.settings.customDownUri);
          console.log('Custom Down sound loaded successfully');
        } catch (error) {
          console.error('Failed to load custom Down sound:', error);
          this.downPlayer = null;
        }
      }
      
      // Load custom Set sound if available
      if (this.settings?.customSetUri) {
        console.log('Loading custom Set sound:', this.settings.customSetUri);
        try {
          this.setPlayer = createAudioPlayer(this.settings.customSetUri);
          console.log('Custom Set sound loaded successfully');
        } catch (error) {
          console.error('Failed to load custom Set sound:', error);
          this.setPlayer = null;
        }
      }
      
      console.log('All sounds loading completed');
    } catch (error) {
      console.error('Failed to load sounds:', error);
    }
  }

  async playDown() {
    try {
      await this.initialize();
      
      if (this.downPlayer) {
        // Play custom Down sound
        this.downPlayer.pause();
        this.downPlayer.seekTo(0);
        this.downPlayer.play();
        console.log('Played custom "Down" sound');
      } else {
        // Fallback to text-to-speech
        console.log('🔊 Using TTS for "Down" command');
        console.log('🔊 TTS available:', Speech.getAvailableVoicesAsync ? 'Yes' : 'No');
        
        await Speech.speak('Down', {
          language: 'en-US',
          pitch: 1.0,
          rate: 1.0,
          volume: 1.0,
        });
        console.log('✅ Played TTS "Down" command');
      }
    } catch (error) {
      console.error('Failed to play "Down" command:', error);
    }
  }

  async playSet() {
    try {
      await this.initialize();
      
      if (this.setPlayer) {
        // Play custom Set sound
        this.setPlayer.pause();
        this.setPlayer.seekTo(0);
        this.setPlayer.play();
        console.log('Played custom "Set" sound');
      } else {
        // Fallback to text-to-speech
        console.log('🔊 Using TTS for "Set" command');
        
        await Speech.speak('Set', {
          language: 'en-US',
          pitch: 1.0,
          rate: 1.0,
          volume: 1.0,
        });
        console.log('✅ Played TTS "Set" command');
      }
    } catch (error) {
      console.error('Failed to play "Set" command:', error);
    }
  }

  async playWhistle() {
    try {
      await this.initialize();
      
      if (this.whistlePlayer) {
        // Stop any current playback and reset to beginning
        this.whistlePlayer.pause();
        this.whistlePlayer.seekTo(0);
        
        // Play the real whistle sound and wait for it to finish
        this.whistlePlayer.play();
        console.log('Started playing real whistle sound');
        
        // Wait for the whistle to finish playing with a timeout
        await new Promise((resolve) => {
          let resolved = false;
          const maxWaitTime = 5000; // 5 second timeout
          let checkCount = 0;
          const maxChecks = maxWaitTime / 100; // Maximum number of status checks
          
          const checkStatus = () => {
            checkCount++;
            
            if (resolved) return;
            
            // Check if we've exceeded our timeout or max checks
            if (checkCount >= maxChecks) {
              console.log('Whistle playback timeout reached, continuing...');
              resolved = true;
              resolve();
              return;
            }
            
            try {
              if (this.whistlePlayer && this.whistlePlayer.playing) {
                // Still playing, check again in 100ms
                setTimeout(checkStatus, 100);
              } else {
                // Finished playing or player is null
                console.log('Whistle finished playing');
                resolved = true;
                resolve();
              }
            } catch (error) {
              console.log('Error checking whistle player status, continuing...', error);
              resolved = true;
              resolve();
            }
          };
          
          // Start checking after a small delay to ensure playback started
          setTimeout(checkStatus, 100);
          
          // Also set a hard timeout as a fallback
          setTimeout(() => {
            if (!resolved) {
              console.log('Hard timeout reached for whistle playback');
              resolved = true;
              resolve();
            }
          }, maxWaitTime);
        });
      } else {
        // Fallback to TTS if whistle sound failed to load
        console.log('Whistle player not available, using TTS fallback');
        await Speech.speak('Whistle', {
          language: 'en-US',
          pitch: 2.0,
          rate: 0.8,
          volume: 1.0,
        });
      }
    } catch (error) {
      console.error('Failed to play whistle sound:', error);
      // Final fallback to TTS
      try {
        await Speech.speak('Whistle', {
          language: 'en-US',
          pitch: 2.0,
          rate: 0.8,
          volume: 1.0,
        });
      } catch (fallbackError) {
        console.error('Even TTS fallback failed:', fallbackError);
      }
    }
  }

  // Method to update settings and reload custom sounds
  async updateSettings(newSettings) {
    this.settings = newSettings;
    await this.loadAllSounds();
    console.log('AudioService: Settings updated and sounds reloaded');
  }

  // Utility method to stop any current speech and sounds
  async stopSpeech() {
    try {
      await Speech.stop();
      
      // Stop all audio players
      if (this.whistlePlayer) {
        this.whistlePlayer.pause();
        this.whistlePlayer.seekTo(0);
      }
      if (this.downPlayer) {
        this.downPlayer.pause();
        this.downPlayer.seekTo(0);
      }
      if (this.setPlayer) {
        this.setPlayer.pause();
        this.setPlayer.seekTo(0);
      }
    } catch (error) {
      console.error('Failed to stop speech/sounds:', error);
    }
  }

  // Cleanup method to unload sounds
  async cleanup() {
    try {
      if (this.whistlePlayer) {
        // AudioPlayer cleanup if needed
        this.whistlePlayer = null;
      }
    } catch (error) {
      console.error('Failed to cleanup audio resources:', error);
    }
  }

  // Method to check if speech is available
  async isSpeechAvailable() {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      return voices.length > 0;
    } catch (error) {
      console.error('Failed to check speech availability:', error);
      return false;
    }
  }
}

// Export a singleton instance
export default new AudioService();
