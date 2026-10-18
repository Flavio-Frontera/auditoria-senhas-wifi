import React, { useEffect, useState, useRef } from 'react';
import { View, Text, AppState, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ErrorBoundary from './components/ErrorBoundary';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import ScannerScreen from './screens/ScannerScreen';
import PasswordScreen from './screens/PasswordScreen';
import AttackScreen from './screens/AttackScreen';
import ReportsScreen from './screens/ReportsScreen';
import GeneratorScreen from './screens/GeneratorScreen';
import CompareScreen from './screens/CompareScreen';
import BackupScreen from './screens/BackupScreen';
import { COLORS } from './styles/GlobalStyles';

const Stack = createNativeStackNavigator();

SplashScreen.preventAutoHideAsync();

const HIDDEN_STATES = ['background', 'inactive'];

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPrivacyOverlayVisible, setIsPrivacyOverlayVisible] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    async function prepare() {
      try {
        const authConfigured = await AsyncStorage.getItem('auth_configured');
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  function handleAppStateChange(nextAppState) {
 
    if (HIDDEN_STATES.includes(nextAppState)) {
      setIsPrivacyOverlayVisible(true);
    } else if (nextAppState === 'active') {
      setIsPrivacyOverlayVisible(false);
    }

    appState.current = nextAppState;
  }

  if (!appIsReady) {
    return null;
  }

  return (
    <ErrorBoundary>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Auth"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Scanner" component={ScannerScreen} />
          <Stack.Screen name="Password" component={PasswordScreen} />
          <Stack.Screen name="Attack" component={AttackScreen} />
          <Stack.Screen name="Reports" component={ReportsScreen} />
          <Stack.Screen name="Generator" component={GeneratorScreen} />
          <Stack.Screen name="Compare" component={CompareScreen} />
          <Stack.Screen name="Backup" component={BackupScreen} />
        </Stack.Navigator>
      </NavigationContainer>

      {isPrivacyOverlayVisible && (
        <View style={styles.overlay}>
          <Text style={styles.overlayTitle}>AUDITORIA DE SENHAS WiFi</Text>
          <Text style={styles.overlaySubtitle}>Conteúdo protegido</Text>
        </View>
      )}
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 999,
  },
  overlayTitle: {
    color: COLORS.primary,
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  overlaySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 8,
  },
});
