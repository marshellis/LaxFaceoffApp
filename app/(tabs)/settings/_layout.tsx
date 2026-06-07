import { Stack } from 'expo-router';

export default function SettingsStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="practice-types" />
      <Stack.Screen name="audio" />
      <Stack.Screen name="help" />
      <Stack.Screen name="record" />
    </Stack>
  );
}
