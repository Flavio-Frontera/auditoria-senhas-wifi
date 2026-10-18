import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, AppState } from 'react-native';
import { globalStyles, COLORS, SPACING } from '../styles/GlobalStyles';
import { useAuth } from '../hooks/useAuth';

export default function AuthScreen({ navigation }) {
  const {
    isLoading,
    isBiometricSupported,
    isAuthConfigured,
    authenticate,
    setupBiometric,
  } = useAuth();

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showAuthButton, setShowAuthButton] = useState(false);
  const hasTriedAutoAuth = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    if (isAuthConfigured) {
      setShowAuthButton(false);
      if (!hasTriedAutoAuth.current) {
        hasTriedAutoAuth.current = true;
        setTimeout(runAuthenticate, 500);
      }
    } else {
      setShowAuthButton(true);
    }
  }, [isLoading, isAuthConfigured]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isAuthConfigured]);

  function handleAppStateChange(nextAppState) {
    if (nextAppState === 'active' && isAuthConfigured) {
      runAuthenticate();
    }
  }

  async function runAuthenticate() {
    setIsAuthenticating(true);
    try {
      const success = await authenticate('Autentique-se para acessar o aplicativo');
      if (success) {
        navigation.replace('Home');
      } else {
        Alert.alert('Falha na autenticação', 'Você precisa se autenticar para usar o aplicativo', [
          { text: 'Tentar novamente', onPress: runAuthenticate }
        ]);
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro na autenticação');
      setTimeout(runAuthenticate, 1000);
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function runSetupBiometric() {
    setIsAuthenticating(true);
    try {
      const success = await setupBiometric('Configure a autenticação biométrica');
      if (success) {
        navigation.replace('Home');
      } else {
        Alert.alert('Erro', 'Falha ao configurar autenticação');
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro');
    } finally {
      setIsAuthenticating(false);
    }
  }

  if (isLoading) {
    return (
      <View style={globalStyles.container}>
        <View style={{ flex: 1, justifyContent: 'center', padding: SPACING.xxl }}>
          <Text style={globalStyles.title}>AUDITORIA DE SENHAS WiFi</Text>
          <View style={globalStyles.card}>
            <Text style={{ color: COLORS.text, fontSize: 16, textAlign: 'center' }}>
              Verificando autenticação...
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (!isBiometricSupported) {
    return (
      <View style={globalStyles.container}>
        <View style={{ flex: 1, justifyContent: 'center', padding: SPACING.xxl }}>
          <Text style={globalStyles.title}>AUDITORIA DE SENHAS WiFi</Text>
          <View style={[globalStyles.card, { borderColor: COLORS.danger, marginTop: SPACING.xl }]}>
            <Text style={[globalStyles.sectionTitle, { textAlign: 'center', color: COLORS.danger }]}>
              Dispositivo não compatível
            </Text>
            <Text style={{ color: COLORS.text, fontSize: 16, textAlign: 'center', marginTop: SPACING.md }}>
              Seu dispositivo não suporta autenticação biométrica.
            </Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginTop: SPACING.md }}>
              Este aplicativo gerencia senhas sensíveis e requer autenticação para funcionar.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (showAuthButton) {
    return (
      <View style={globalStyles.container}>
        <View style={{ flex: 1, justifyContent: 'center', padding: SPACING.xxl }}>
          <Text style={globalStyles.title}>AUDITORIA DE SENHAS WiFi</Text>

          <View style={globalStyles.card}>
            <Text style={[globalStyles.sectionTitle, { textAlign: 'center', marginBottom: SPACING.lg }]}>
              Segurança em primeiro lugar
            </Text>

            <Text style={{ color: COLORS.text, fontSize: 16, textAlign: 'center', marginBottom: SPACING.md }}>
              Este aplicativo gerencia senhas e dados sensíveis.
            </Text>

            <Text style={{ color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: SPACING.lg }}>
              Para proteger suas informações, é obrigatório configurar a autenticação biométrica do seu dispositivo.
            </Text>

            <View style={{ backgroundColor: '#1A1A2A', padding: SPACING.md, borderRadius: 8, marginBottom: SPACING.xl }}>
              <Text style={{ color: COLORS.secondary, fontSize: 13, textAlign: 'center' }}>
                Impressão digital | Face ID | Senha do dispositivo
              </Text>
            </View>

            <TouchableOpacity
              style={globalStyles.buttonSuccess}
              onPress={runSetupBiometric}
              disabled={isAuthenticating}
            >
              <Text style={globalStyles.buttonText}>
                {isAuthenticating ? 'AUTENTICANDO...' : 'CONFIGURAR AUTENTICAÇÃO'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <View style={{ flex: 1, justifyContent: 'center', padding: SPACING.xxl }}>
        <Text style={globalStyles.title}>AUDITORIA DE SENHAS WiFi</Text>
        <View style={globalStyles.card}>
          <Text style={{ color: COLORS.text, fontSize: 16, textAlign: 'center', marginBottom: SPACING.md }}>
            Verificando autenticação...
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 14, textAlign: 'center' }}>
            Aguarde um momento
          </Text>
        </View>
      </View>
    </View>
  );
}
