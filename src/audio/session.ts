import { setAudioModeAsync } from 'expo-audio';
import { Platform } from 'react-native';
import { AudioManager } from 'react-native-audio-api';

const isWeb = Platform.OS === 'web';

/** Configure the session for PLAYBACK of cues (loud, plays in silent mode, not earpiece). */
export async function configurePlaybackSession(): Promise<void> {
  // RNAA AudioManager has no web implementation; guard so it no-ops on web.
  if (!isWeb) {
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playback',
      iosMode: 'default',
      iosOptions: [],
    });
    await AudioManager.setAudioSessionActivity(true);
  }
  // setAudioModeAsync (expo-audio) is web-safe.
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    interruptionMode: 'mixWithOthers',
  });
}

/** Configure the session for RECORDING a custom sound. */
export async function configureRecordingSession(): Promise<void> {
  if (!isWeb) {
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playAndRecord',
      iosMode: 'default',
      iosOptions: [],
    });
    await AudioManager.setAudioSessionActivity(true);
  }
  await setAudioModeAsync({
    allowsRecording: true,
    playsInSilentMode: true,
  });
}
