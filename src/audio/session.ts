import { setAudioModeAsync } from 'expo-audio';
import { AudioManager } from 'react-native-audio-api';

/** Configure the session for PLAYBACK of cues (loud, plays in silent mode, not earpiece). */
export async function configurePlaybackSession(): Promise<void> {
  AudioManager.setAudioSessionOptions({
    iosCategory: 'playback',
    iosMode: 'default',
    iosOptions: [],
  });
  await AudioManager.setAudioSessionActivity(true);
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    interruptionMode: 'mixWithOthers',
  });
}

/** Configure the session for RECORDING a custom sound. */
export async function configureRecordingSession(): Promise<void> {
  AudioManager.setAudioSessionOptions({
    iosCategory: 'playAndRecord',
    iosMode: 'default',
    iosOptions: [],
  });
  await AudioManager.setAudioSessionActivity(true);
  await setAudioModeAsync({
    allowsRecording: true,
    playsInSilentMode: true,
  });
}
