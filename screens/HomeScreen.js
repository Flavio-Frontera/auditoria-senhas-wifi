import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { globalStyles, COLORS, SPACING, BORDER_RADIUS } from '../styles/GlobalStyles';
import { useAuth } from '../hooks/useAuth';

export default function HomeScreen({ navigation }) {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { isAuthConfigured, refreshAuthConfigured, setupBiometric, disableBiometric, authenticate } = useAuth();

  function lockApp() {
    setShowSettingsModal(false);
    navigation.replace('Auth');
  }

  async function toggleBiometricAuth() {
    setIsAuthenticating(true);
    try {
      if (isAuthConfigured) {
        const confirmed = await authenticate('Autentique-se para desativar a proteção biométrica');
        if (!confirmed) {
          Alert.alert('Não autenticado', 'É necessário confirmar sua identidade para desativar a proteção.');
          return;
        }

        Alert.alert(
          'Desativar autenticação',
          'Tem certeza? Suas senhas ficarão menos protegidas.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Desativar',
              style: 'destructive',
              onPress: async () => {
                await disableBiometric();
                Alert.alert('Sucesso', 'Autenticação desativada');
                setShowSettingsModal(false);
              },
            },
          ]
        );
      } else {
        const success = await setupBiometric('Configure a autenticação biométrica');
        if (success) {
          Alert.alert('Sucesso', 'Autenticação ativada');
          setShowSettingsModal(false);
        } else {
          Alert.alert('Erro', 'Falha ao configurar autenticação');
        }
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro');
    } finally {
      setIsAuthenticating(false);
    }
  }

  React.useEffect(() => {
    if (showSettingsModal) {
      refreshAuthConfigured();
    }
  }, [showSettingsModal]);

  function renderSettingsModal() {
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSettingsModal}
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <Text style={modalStyles.title}>Configurações de Segurança</Text>

            <TouchableOpacity
              style={modalStyles.option}
              onPress={toggleBiometricAuth}
              disabled={isAuthenticating}
            >
              <View style={modalStyles.optionRow}>
                <Text style={modalStyles.optionText}>Autenticação Biométrica</Text>
                <View style={[modalStyles.badge, isAuthConfigured ? modalStyles.badgeActive : modalStyles.badgeInactive]}>
                  <Text style={modalStyles.badgeText}>{isAuthConfigured ? 'ATIVADO' : 'DESATIVADO'}</Text>
                </View>
              </View>
              <Text style={modalStyles.optionDesc}>
                {isAuthConfigured ? 'App protegido por biometria' : 'Ative para proteger suas senhas'}
              </Text>
            </TouchableOpacity>

            <View style={modalStyles.divider} />

            <TouchableOpacity
              style={modalStyles.option}
              onPress={lockApp}
              disabled={isAuthenticating}
            >
              <Text style={[modalStyles.optionText, { color: COLORS.danger }]}>Bloquear agora</Text>
              <Text style={modalStyles.optionDesc}>Bloqueia o app exigindo autenticação</Text>
            </TouchableOpacity>

            <View style={modalStyles.divider} />

            <TouchableOpacity
              style={modalStyles.closeButton}
              onPress={() => setShowSettingsModal(false)}
            >
              <Text style={modalStyles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <ScrollView
      style={globalStyles.container}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.xxxl
      }}
    >
      <Text style={[globalStyles.title, { marginBottom: SPACING.xxxl }]}>
        AUDITORIA DE SENHAS WiFi
      </Text>

      <TouchableOpacity
        style={globalStyles.buttonPrimary}
        onPress={() => navigation.navigate('Scanner')}
      >
        <Text style={globalStyles.buttonText}>ESCANEAR QR CODE</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={globalStyles.buttonPrimary}
        onPress={() => navigation.navigate('Password')}
      >
        <Text style={globalStyles.buttonText}>INSERIR MANUALMENTE</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={globalStyles.buttonPrimary}
        onPress={() => navigation.navigate('Generator')}
      >
        <Text style={globalStyles.buttonText}>GERADOR DE SENHAS</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={globalStyles.buttonPrimary}
        onPress={() => navigation.navigate('Compare')}
      >
        <Text style={globalStyles.buttonText}>COMPARAR SENHAS</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={globalStyles.buttonPrimary}
        onPress={() => navigation.navigate('Reports')}
      >
        <Text style={globalStyles.buttonText}>VER RELATÓRIOS</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={globalStyles.buttonPrimary}
        onPress={() => navigation.navigate('Backup')}
      >
        <Text style={globalStyles.buttonText}>BACKUP E RESTAURAÇÃO</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[globalStyles.button, { marginTop: SPACING.xxl, borderColor: COLORS.secondary }]}
        onPress={() => setShowSettingsModal(true)}
      >
        <Text style={[globalStyles.buttonText, { color: COLORS.secondary }]}>
          CONFIGURAÇÕES DE SEGURANÇA
        </Text>
      </TouchableOpacity>

      {renderSettingsModal()}
    </ScrollView>
  );
}

const modalStyles = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  content: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.xxl,
    width: '85%',
    borderWidth: 2,
    borderColor: COLORS.border
  },
  title: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.xl
  },
  option: {
    paddingVertical: SPACING.md
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs
  },
  optionText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold'
  },
  optionDesc: {
    color: COLORS.textSecondary,
    fontSize: 12
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm
  },
  badgeActive: {
    backgroundColor: COLORS.successDark
  },
  badgeInactive: {
    backgroundColor: COLORS.textMuted
  },
  badgeText: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: 'bold'
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderDark,
    marginVertical: SPACING.md
  },
  closeButton: {
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.xxl,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md
  },
  closeButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold'
  },
};
