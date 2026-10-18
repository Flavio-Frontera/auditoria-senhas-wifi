import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { globalStyles, COLORS, SPACING, BORDER_RADIUS, getScoreColor, getScoreStatus } from '../styles/GlobalStyles';
import {
  getAllSavedPasswords,
  addSavedPassword,
  deleteSavedPassword,
} from '../utils/SecurePasswordStore';
import { createSecureRandomPool } from '../utils/SecureRandom';
import { scorePassword } from '../utils/PasswordScore';

export default function GeneratorScreen({ navigation }) {
  const [length, setLength] = useState(16);
  const [useUppercase, setUseUppercase] = useState(true);
  const [useLowercase, setUseLowercase] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState('');

  const [passwordScore, setPasswordScore] = useState(null);
  const [savedPasswords, setSavedPasswords] = useState([]);
  const [saveLocation, setSaveLocation] = useState('');
  const [saveName, setSaveName] = useState('');
  const [generating, setGenerating] = useState(false);

  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  useEffect(() => {
    loadSavedPasswords();
  }, []);

  async function loadSavedPasswords() {
    try {
      const data = await getAllSavedPasswords();
      setSavedPasswords(data);
    } catch (error) {
      console.log(error);
    }
  }

  async function generatePassword() {
    const classes = [];
    if (useUppercase) classes.push({ regex: /[A-Z]/, chars: uppercase });
    if (useLowercase) classes.push({ regex: /[a-z]/, chars: lowercase });
    if (useNumbers) classes.push({ regex: /[0-9]/, chars: numbers });
    if (useSymbols) classes.push({ regex: /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/, chars: symbols });

    const chars = classes.map(c => c.chars).join('');

    if (chars.length === 0) {
      Alert.alert('Erro', 'Selecione pelo menos um tipo de caractere');
      return;
    }

    setGenerating(true);
    try {
      const pool = createSecureRandomPool();

      let passwordArray = [];
      for (let i = 0; i < length; i++) {
        const randomIndex = await pool.nextInt(chars.length);
        passwordArray.push(chars[randomIndex]);
      }

      const missingClasses = classes.filter(c => !passwordArray.some(ch => c.regex.test(ch)));

      if (missingClasses.length > 0) {
        const positions = Array.from({ length: passwordArray.length }, (_, i) => i);
        const positionsNeeded = missingClasses.length;

        for (let i = positions.length - 1; i >= positions.length - positionsNeeded; i--) {
          const j = await pool.nextInt(i + 1);
          [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        for (let i = 0; i < missingClasses.length; i++) {
          const pos = positions[positions.length - 1 - i];
          const { chars: classChars } = missingClasses[i];
          const charIndex = await pool.nextInt(classChars.length);
          passwordArray[pos] = classChars[charIndex];
        }
      }

      for (let i = passwordArray.length - 1; i > 0; i--) {
        const j = await pool.nextInt(i + 1);
        [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
      }

      const finalPassword = passwordArray.join('');
      setGeneratedPassword(finalPassword);
      calculateStrength(finalPassword);
    } catch (error) {
      console.log('Erro ao gerar senha:', error);
      Alert.alert('Erro', 'Falha ao gerar senha segura. Tente novamente.');
    } finally {
      setGenerating(false);
    }
  }

  function calculateStrength(password) {
    const { score } = scorePassword(password);
    setPasswordScore(score);
  }

  async function copyToClipboard() {
    if (!generatedPassword) {
      Alert.alert('Aviso', 'Gere uma senha primeiro');
      return;
    }
    try {
      await Clipboard.setStringAsync(generatedPassword);
      Alert.alert('Sucesso', 'Senha copiada para a área de transferência');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível copiar a senha');
    }
  }

  async function savePassword() {
    if (!generatedPassword) {
      Alert.alert('Erro', 'Gere uma senha primeiro');
      return;
    }
    if (!saveName.trim()) {
      Alert.alert('Erro', 'Digite um nome para identificar esta senha');
      return;
    }

    const newEntry = {
      name: saveName.trim(),
      password: generatedPassword,
      location: saveLocation.trim() || 'Não especificado',
      date: new Date().toLocaleString('pt-BR'),
      length: generatedPassword.length,
      score: passwordScore,
    };

    await addSavedPassword(newEntry);
    await loadSavedPasswords();
    setSaveName('');
    setSaveLocation('');
    Alert.alert('Sucesso', `Senha "${saveName}" arquivada com sucesso!`);
  }

  async function deletePassword(id) {
    Alert.alert(
      'Confirmar exclusão',
      'Deseja realmente excluir esta senha?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await deleteSavedPassword(id);
            await loadSavedPasswords();
            Alert.alert('Sucesso', 'Senha excluída!');
          },
        },
      ]
    );
  }

  async function copySavedPassword(password, name) {
    try {
      await Clipboard.setStringAsync(password);
      Alert.alert('Sucesso', `Senha de "${name}" copiada!`);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível copiar');
    }
  }

  function usePassword(item) {
    setGeneratedPassword(item.password);
    calculateStrength(item.password);
    Alert.alert('Carregado', `Senha de "${item.name || item.ssid || 'Sem nome'}" carregada. Use o botão TESTAR para auditar.`);
  }

  function testPassword() {
    if (!generatedPassword) {
      Alert.alert('Aviso', 'Gere uma senha ou selecione uma arquivada');
      return;
    }
    navigation.navigate('Password', {
      ssid: 'Senha Gerada',
      password: generatedPassword,
    });
  }

  return (
    <ScrollView 
      style={globalStyles.container} 
      contentContainerStyle={{ 
        flexGrow: 1, 
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.xxxl
      }}
    >
      <Text style={[globalStyles.titleSmall, { textAlign: 'center', marginBottom: SPACING.xxxl }]}>
        GERADOR DE SENHAS
      </Text>

      <View style={globalStyles.card}>
        <Text style={globalStyles.sectionTitle}>Comprimento: {length}</Text>
        <Text style={globalStyles.sectionSubtitle}>
          NIST SP 800-63B-4 e OWASP: mínimo de 15 caracteres quando não há MFA (o WiFi aceita até 63).
        </Text>
        <View style={styles.lengthContainer}>
          {[15, 16, 20, 24, 32, 48].map((l) => (
            <TouchableOpacity
              key={l}
              style={[styles.lengthButton, length === l && styles.lengthButtonActive]}
              onPress={() => setLength(l)}
            >
              <Text style={[styles.lengthButtonText, length === l && styles.lengthButtonTextActive]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[globalStyles.sectionTitle, { marginTop: SPACING.xl }]}>Incluir (opcional; NIST e OWASP não exigem tipos de caractere):</Text>
        
        <TouchableOpacity style={styles.option} onPress={() => setUseUppercase(!useUppercase)}>
          <View style={[styles.checkbox, useUppercase && styles.checkboxActive]} />
          <Text style={styles.optionText}>Letras Maiúsculas (A-Z)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.option} onPress={() => setUseLowercase(!useLowercase)}>
          <View style={[styles.checkbox, useLowercase && styles.checkboxActive]} />
          <Text style={styles.optionText}>Letras Minúsculas (a-z)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.option} onPress={() => setUseNumbers(!useNumbers)}>
          <View style={[styles.checkbox, useNumbers && styles.checkboxActive]} />
          <Text style={styles.optionText}>Números (0-9)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.option} onPress={() => setUseSymbols(!useSymbols)}>
          <View style={[styles.checkbox, useSymbols && styles.checkboxActive]} />
          <Text style={styles.optionText}>Símbolos (!@#$% etc.)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={globalStyles.buttonSuccess} onPress={generatePassword} disabled={generating}>
          <Text style={globalStyles.buttonText}>{generating ? 'GERANDO...' : 'GERAR SENHA'}</Text>
        </TouchableOpacity>
      </View>

      {generatedPassword !== '' && (
        <View style={[globalStyles.card, { borderColor: COLORS.success }]}>
          <Text style={globalStyles.label}>Senha gerada:</Text>
          <Text style={styles.password} selectable={true}>{generatedPassword}</Text>
          {passwordScore !== null && (
            <Text style={[styles.strength, { color: getScoreColor(passwordScore) }]}>
              Pontuação: {passwordScore}/100 — {getScoreStatus(passwordScore)}
            </Text>
          )}

          <View style={globalStyles.row}>
            <TouchableOpacity style={[globalStyles.buttonSuccess, { flex: 1 }]} onPress={copyToClipboard}>
              <Text style={globalStyles.buttonTextSmall}>COPIAR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[globalStyles.buttonPrimary, { flex: 1 }]} onPress={testPassword}>
              <Text style={globalStyles.buttonTextSmall}>TESTAR</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.saveSection}>
            <Text style={globalStyles.sectionTitle}>Arquivar esta senha</Text>
            <TextInput
              style={globalStyles.input}
              placeholder="Nome para identificar (ex: Banco, Email, WiFi Casa)"
              placeholderTextColor={COLORS.textMuted}
              value={saveName}
              onChangeText={setSaveName}
            />
            <TextInput
              style={globalStyles.input}
              placeholder="Local / Finalidade (opcional)"
              placeholderTextColor={COLORS.textMuted}
              value={saveLocation}
              onChangeText={setSaveLocation}
            />
            <TouchableOpacity style={globalStyles.buttonSuccess} onPress={savePassword}>
              <Text style={globalStyles.buttonTextSmall}>ARQUIVAR SENHA</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={globalStyles.card}>
        <Text style={globalStyles.sectionTitle}>SENHAS ARQUIVADAS ({savedPasswords.length})</Text>
        
        {savedPasswords.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={globalStyles.emptyText}>Nenhuma senha arquivada ainda.</Text>
            <Text style={globalStyles.sectionSubtitle}>Gere uma senha acima e clique em ARQUIVAR SENHA.</Text>
          </View>
        ) : (
          savedPasswords.map((item) => {
            const hasScore = typeof item.score === 'number';
            return (
              <View key={item.id} style={styles.savedItem}>
                <TouchableOpacity style={styles.savedItemContent} onPress={() => usePassword(item)}>
                  <View style={styles.savedHeader}>
                    <Text style={styles.savedName}>{item.name || item.ssid || 'Sem nome'}</Text>
                    <Text style={styles.savedLength}>{item.length ?? item.password.length} caracteres</Text>
                  </View>
                  <Text style={styles.savedLocation}>Local: {item.location || 'Não especificado'}</Text>
                  <Text style={styles.savedDate}>Arquivado em: {item.date || (item.savedAt ? new Date(item.savedAt).toLocaleString('pt-BR') : '—')}</Text>
                  <Text style={styles.savedPasswordPreview}>
                    Senha: {'•'.repeat(Math.min(item.password.length, 16))}
                  </Text>
                  <Text style={[
                    styles.savedStrengthPreview,
                    { color: hasScore ? getScoreColor(item.score) : COLORS.textMuted },
                  ]}>
                    {hasScore ? `${item.score}/100 — ${getScoreStatus(item.score)}` : 'Força não calculada'}
                  </Text>
                </TouchableOpacity>
                <View style={styles.savedActions}>
                  <TouchableOpacity style={styles.savedCopy} onPress={() => copySavedPassword(item.password, item.name || item.ssid || 'Sem nome')}>
                    <Text style={styles.savedCopyText}>C</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.savedDelete} onPress={() => deletePassword(item.id)}>
                    <Text style={styles.savedDeleteText}>X</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>

      <TouchableOpacity style={globalStyles.button} onPress={() => navigation.goBack()}>
        <Text style={globalStyles.buttonText}>VOLTAR</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = {
  lengthContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  lengthButton: {
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  lengthButtonActive: {
    backgroundColor: COLORS.border,
  },
  lengthButtonText: {
    color: COLORS.primary,
    fontSize: 16,
  },
  lengthButtonTextActive: {
    color: COLORS.text,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.md,
  },
  checkboxActive: {
    backgroundColor: COLORS.border,
  },
  optionText: {
    color: COLORS.text,
    fontSize: 16,
  },
  password: {
    color: COLORS.success,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.md,
    fontFamily: 'monospace',
  },
  strength: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: SPACING.xl,
  },
  saveSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderDark,
    paddingTop: SPACING.xl,
    marginTop: SPACING.md,
  },
  emptyBox: {
    alignItems: 'center',
    padding: SPACING.xxxl,
  },
  savedItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  savedItemContent: {
    flex: 1,
    padding: SPACING.md,
  },
  savedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  savedName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  savedLength: {
    color: COLORS.secondary,
    fontSize: 12,
  },
  savedLocation: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 4,
  },
  savedDate: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 6,
  },
  savedPasswordPreview: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: 6,
    fontFamily: 'monospace',
  },
  savedStrengthPreview: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  savedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0015',
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border + '44',
  },
  savedCopy: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border + '44',
  },
  savedCopyText: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  savedDelete: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: COLORS.danger + '44',
  },
  savedDeleteText: {
    color: COLORS.danger,
    fontSize: 16,
    fontWeight: 'bold',
  },
};