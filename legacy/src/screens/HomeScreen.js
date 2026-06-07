import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function HomeScreen({ navigation }) {

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground 
        source={require('../../assets/home_background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🥍 Lacrosse</Text>
          <Text style={styles.subtitle}>Face-off Trainer</Text>
        </View>

        {/* Main Action Button */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => navigation.navigate('Practice', { screen: 'PracticeSelection' })}
          activeOpacity={0.8}
        >
          <Ionicons name="play-circle" size={60} color={Colors.textLight} />
          <Text style={styles.startButtonText}>START PRACTICE</Text>
        </TouchableOpacity>

        {/* Settings Button */}
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={24} color={Colors.primary} />
          <Text style={styles.settingsButtonText}>Settings</Text>
        </TouchableOpacity>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 24,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  startButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 30,
    paddingHorizontal: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.accent,
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
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
  startButtonText: {
    color: Colors.textLight,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.accent,
    backgroundColor: Colors.background,
    marginTop: 20,
  },
  settingsButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
