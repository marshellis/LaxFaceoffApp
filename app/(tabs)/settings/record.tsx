import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../../src/theme/colors';

export default function RecordScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View testID="record-screen" style={styles.content}>
        <Text style={styles.text}>Recording — coming soon</Text>
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
  text: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
});
