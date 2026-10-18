import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { globalStyles, COLORS, SPACING, getScoreColor, getScoreStatus } from '../styles/GlobalStyles';
import { scorePassword } from '../utils/PasswordScore';
import {
  getAllSavedPasswords,
  addSavedPassword,
  deleteSavedPassword,
} from '../utils/SecurePasswordStore';

export default function PasswordScreen({ navigation, route }) {
  const prefillSsid = route?.params?.ssid || '';
  const prefillPassword = route?.params?.password || '';

  const [ssid, setSsid] = useState(prefillSsid);
  const [password, setPassword] = useState(prefillPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [savedPasswords, setSavedPasswords] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const preview = password.length > 0 ? scorePassword(password, { ssid }) : null;

  const loadSavedPasswords = useCallback(async () => {
    setLoadingSaved(true);
    try {
      const entries = await getAllSavedPasswords();
      setSavedPasswords(entries);
    } catch (error) {
      console.log('Erro ao carregar senhas salvas:', error);
    } finally {
      setLoadingSaved(false);
    }
  }, []);

  useEffect(() => {
    if (showSaved) {
      loadSavedPasswords();
    }
  }, [showSaved, loadSavedPasswords]);

  function handleAnalyze() {
    const trimmedSsid = ssid.trim();

    if (!trimmedSsid) {
      Alert.alert('Campo obrigatório', 'Informe o nome da rede (SSID)');
      return;
    }

    if (!password) {
      Alert.alert('Campo obrigatório', 'Informe a senha da rede');
      return;
    }

    navigation.navigate('Attack', { ssid: trimmedSsid, password });
  }

  async function handleSavePassword() {
    const trimmedSsid = ssid.trim();

    if (!trimmedSsid || !password) {
      Alert.alert('Campo obrigatório', 'Preencha o SSID e a senha antes de salvar');
      return;
    }

    try {
      await addSavedPassword({ ssid: trimmedSsid, password, savedAt: new Date().toISOString() });
      Alert.alert('Sucesso', 'Rede salva com sucesso');
      if (showSaved) {
        loadSavedPasswords();
      }
    } catch (error) {
      console.log('Erro ao salvar senha:', error);
      Alert.alert('Erro', 'Falha ao salvar a senha');
    }
  }

  function handleSelectSaved(entry) {
    setSsid(entry.ssid || entry.name || '');
    setPassword(entry.password || '');
    setShowSaved(false);
  }

  function confirmDeleteSaved(entry) {
    Alert.alert(
      'Remover rede salva',
      `Deseja remover "${entry.ssid || entry.name || 'Sem nome'}" das redes salvas?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSavedPassword(entry.id);
              loadSavedPasswords();
            } catch (error) {
              Alert.alert('Erro', 'Falha ao remover a rede salva');
            }
          },
        },
      ]
    );
  }

  function renderSavedItem({ item }) {
    return (
      <View style={savedStyles.item}>
        <TouchableOpacity style={{ flex: 1 }} onPress={() => handleSelectSaved(item)}>
          <Text style={savedStyles.itemSsid} numberOfLines={1}>{item.ssid || item.name || 'Sem nome'}</Text>
          <Text style={savedStyles.itemPassword}>{'•'.repeat(Math.min(item.password?.length || 0, 16))}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={savedStyles.deleteButton} onPress={() => confirmDeleteSaved(item)}>
          <Text style={savedStyles.deleteButtonText}>X</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={globalStyles.scrollContainer}
      contentContainerStyle={globalStyles.contentContainer}
    >
      <Text style={globalStyles.title}>INSERIR SENHA</Text>

      <View style={globalStyles.card}>
        <Text style={globalStyles.sectionTitle}>NOME DA REDE (SSID)</Text>
        <TextInput
          style={globalStyles.input}
          placeholder="Ex: MinhaRedeWiFi"
          placeholderTextColor={COLORS.textMuted}
          value={ssid}
          onChangeText={setSsid}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={globalStyles.sectionTitle}>SENHA</Text>
        <View style={globalStyles.passwordContainer}>
          <TextInput
            style={globalStyles.passwordInput}
            placeholder="Digite a senha"
            placeholderTextColor={COLORS.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Text style={{ color: COLORS.secondary, fontWeight: 'bold' }}>
              {showPassword ? 'OCULTAR' : 'MOSTRAR'}
            </Text>
          </TouchableOpacity>
        </View>

        {preview && (
          <View style={{ marginTop: SPACING.sm, marginBottom: SPACING.md }}>
            <View style={globalStyles.progressBar}>
              <View
                style={[
                  globalStyles.progressFill,
                  {
                    width: `${((preview.score + 100) / 200) * 100}%`,
                    backgroundColor: getScoreColor(preview.score),
                  },
                ]}
              />
            </View>
            <Text style={[globalStyles.progressText, { color: getScoreColor(preview.score) }]}>
              {getScoreStatus(preview.score)} ({preview.score}/100)
            </Text>
          </View>
        )}

        <TouchableOpacity style={globalStyles.buttonPrimary} onPress={handleAnalyze}>
          <Text style={globalStyles.buttonText}>ANALISAR SENHA</Text>
        </TouchableOpacity>

        <TouchableOpacity style={globalStyles.buttonSecondary} onPress={handleSavePassword}>
          <Text style={globalStyles.buttonText}>SALVAR REDE</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[globalStyles.button, { borderColor: COLORS.secondary }]}
        onPress={() => setShowSaved(!showSaved)}
      >
        <Text style={[globalStyles.buttonText, { color: COLORS.secondary }]}>
          {showSaved ? 'OCULTAR REDES SALVAS' : 'VER REDES SALVAS'}
        </Text>
      </TouchableOpacity>

      {showSaved && (
        <View style={globalStyles.card}>
          <Text style={globalStyles.sectionTitle}>REDES SALVAS</Text>
          {loadingSaved ? (
            <Text style={{ color: COLORS.textSecondary, textAlign: 'center' }}>Carregando...</Text>
          ) : savedPasswords.length === 0 ? (
            <Text style={globalStyles.emptyText}>Nenhuma rede salva ainda</Text>
          ) : (
            savedPasswords.map((item) => (
              <React.Fragment key={String(item.id)}>{renderSavedItem({ item })}</React.Fragment>
            ))
          )}
        </View>
      )}

      <TouchableOpacity style={globalStyles.button} onPress={() => navigation.goBack()}>
        <Text style={globalStyles.buttonText}>VOLTAR</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const savedStyles = {
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  itemSsid: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemPassword: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  deleteButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  deleteButtonText: {
    color: COLORS.danger,
    fontWeight: 'bold',
    fontSize: 16,
  },
};