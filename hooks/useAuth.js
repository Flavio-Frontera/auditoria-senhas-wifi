import { useEffect, useState, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isAuthConfigured, setIsAuthConfigured] = useState(false);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    await checkBiometricSupport();
    await refreshAuthConfigured();
    setIsLoading(false);
  }

  async function checkBiometricSupport() {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    setIsBiometricSupported(compatible);
    return compatible;
  }

  const refreshAuthConfigured = useCallback(async () => {
    const configured = await AsyncStorage.getItem('auth_configured');
    const value = configured === 'true';
    setIsAuthConfigured(value);
    return value;
  }, []);

  async function authenticate(promptMessage = 'Autentique-se para acessar') {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Usar senha do dispositivo',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.log('Erro na autenticação:', error);
      return false;
    }
  }

  async function setupBiometric(promptMessage = 'Configure a autenticação biométrica') {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Usar senha do dispositivo',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });

      if (result.success) {
        await AsyncStorage.setItem('auth_configured', 'true');
        setIsAuthConfigured(true);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.log('Erro na configuração:', error);
      return false;
    }
  }

  async function disableBiometric() {
    await AsyncStorage.removeItem('auth_configured');
    setIsAuthConfigured(false);
  }

  async function lockApp() {
    setIsAuthenticated(false);
  }

  return {
    isAuthenticated,
    isLoading,
    isBiometricSupported,
    isAuthConfigured,
    authenticate,
    setupBiometric,
    disableBiometric,
    refreshAuthConfigured,
    lockApp,
  };
}