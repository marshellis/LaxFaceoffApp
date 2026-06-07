import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';

// Import our screens
import HomeScreen from './src/screens/HomeScreen';
import PracticeScreen from './src/screens/PracticeScreen';
import PracticeSelectionScreen from './src/screens/PracticeSelectionScreen';
import SettingsMenuScreen from './src/screens/SettingsMenuScreen';
import ActivityScreen from './src/screens/ActivityScreen';
import PracticeTypeSettingsScreen from './src/screens/PracticeTypeSettingsScreen';
import AudioSettingsScreen from './src/screens/AudioSettingsScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';
import RecordingScreen from './src/screens/RecordingScreen';
import DeveloperModeScreen from './src/screens/DeveloperModeScreen';

// Import context providers
import { SettingsProvider } from './src/contexts/SettingsContext';
import { PracticeHistoryProvider } from './src/contexts/PracticeHistoryContext';
import { Colors } from './src/constants/Colors';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Practice Stack Navigator
function PracticeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="PracticeSelection" component={PracticeSelectionScreen} />
      <Stack.Screen name="PracticeSession" component={PracticeScreen} />
    </Stack.Navigator>
  );
}

// Settings Stack Navigator
function SettingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="SettingsMenu" component={SettingsMenuScreen} />
      <Stack.Screen name="PracticeTypeSettings" component={PracticeTypeSettingsScreen} />
      <Stack.Screen name="AudioSettings" component={AudioSettingsScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="Recording" component={RecordingScreen} />
      <Stack.Screen name="DeveloperMode" component={DeveloperModeScreen} />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Practice') {
            iconName = focused ? 'play-circle' : 'play-circle-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else if (route.name === 'Activity') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.backgroundSecondary,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Practice" component={PracticeStack} />
      <Tab.Screen name="Activity" component={ActivityScreen} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={{ 
      flex: 1, 
      paddingTop: insets.top,
      backgroundColor: Colors.background 
    }}>
      <SettingsProvider>
        <PracticeHistoryProvider>
          <NavigationContainer>
            <MainTabs />
            <StatusBar style="dark" />
          </NavigationContainer>
        </PracticeHistoryProvider>
      </SettingsProvider>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
