import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../src/theme/colors';

export default function ActivityScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View testID="activity-screen" style={styles.content}>
        <Text style={styles.title}>Activity</Text>
        <Text style={styles.placeholder}>Coming soon</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 12,
  },
  placeholder: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
