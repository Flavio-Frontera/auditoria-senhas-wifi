import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { globalStyles, COLORS } from '../styles/GlobalStyles';
import {
  getAllSavedPasswords,
  replaceAllSavedPasswords,
  clearAllSavedPasswords,
} from '../utils/SecurePasswordStore';

const SUPPORTED_BACKUP_VERSIONS = ['1.0'];

function validateBackupData(data) {
  const errors = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, errors: ['O arquivo não é um backup válido (esperado um objeto JSON).'] };
  }

  if (typeof data.version !== 'string' || !SUPPORTED_BACKUP_VERSIONS.includes(data.version)) {
    errors.push(`Versão de backup não suportada (aceitas: ${SUPPORTED_BACKUP_VERSIONS.join(', ')}).`);
  }

  if (data.reports !== undefined) {
    if (!Array.isArray(data.reports)) {
      errors.push('O campo "reports" deveria ser uma lista de relatórios.');
    } else if (!data.reports.every(r => r !== null && typeof r === 'object' && !Array.isArray(r) && typeof r.ssid === 'string' && typeof r.score === 'number')) {
      errors.push('Um ou mais itens de "reports" não têm o formato esperado (faltam "ssid" ou "score").');
    }
  }

  if (data.savedPasswords !== undefined) {
    if (!Array.isArray(data.savedPasswords)) {
      errors.push('O campo "savedPasswords" deveria ser uma lista de senhas arquivadas.');
    } else if (!data.savedPasswords.every(p => p !== null && typeof p === 'object' && !Array.isArray(p) && typeof p.password === 'string')) {
      errors.push('Um ou mais itens de "savedPasswords" não têm o formato esperado (falta o campo "password").');
    }
  }

  return { valid: errors.length === 0, errors };
}

export default function BackupScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  async function exportBackup() {
    setLoading(true);
    try {
      const reports = await AsyncStorage.getItem('reports');
      const savedPasswords = await getAllSavedPasswords();
      
      const backupData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        reports: reports ? JSON.parse(reports) : [],
        savedPasswords,
      };

      const backupJson = JSON.stringify(backupData, null, 2);
      const fileName = `wifi_audit_backup_${Date.now()}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, backupJson);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Backup Auditoria WiFi',
        });
      }
      
      Alert.alert(
        'Sucesso',
        'Backup exportado com sucesso!\n\nAtenção: o arquivo exportado contém suas senhas em texto plano (não criptografado). Guarde-o em um local seguro e apague-o do dispositivo/nuvem quando não precisar mais.'
      );
    } catch (error) {
      console.log('Erro ao exportar:', error);
      Alert.alert('Erro', 'Falha ao exportar backup');
    } finally {
      setLoading(false);
    }
  }

  async function importBackup() {
    setLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri);

      let backupData;
      try {
        backupData = JSON.parse(fileContent);
      } catch (parseError) {
        Alert.alert('Erro', 'O arquivo selecionado não é um JSON válido.');
        return;
      }

      const { valid, errors } = validateBackupData(backupData);
      if (!valid) {
        Alert.alert(
          'Backup inválido',
          `Não foi possível importar este arquivo:\n\n${errors.join('\n')}`
        );
        return;
      }

      if (backupData.reports) {
        await AsyncStorage.setItem('reports', JSON.stringify(backupData.reports));
      }
      if (backupData.savedPasswords) {
        await replaceAllSavedPasswords(backupData.savedPasswords);
      }

      Alert.alert(
        'Sucesso',
        `Backup restaurado!\nRelatórios: ${backupData.reports?.length || 0}\nSenhas salvas: ${backupData.savedPasswords?.length || 0}`
      );
    } catch (error) {
      console.log('Erro ao importar:', error);
      Alert.alert('Erro', 'Falha ao importar backup. Verifique se o arquivo é válido.');
    } finally {
      setLoading(false);
    }
  }

  async function clearAllData() {
    Alert.alert(
      'Limpar todos os dados',
      'Tem certeza? Esta ação remove todos os relatórios e senhas salvas. Não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar tudo',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('reports');
              await clearAllSavedPasswords();
              Alert.alert('Sucesso', 'Todos os dados foram removidos');
            } catch (error) {
              Alert.alert('Erro', 'Falha ao limpar dados');
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={globalStyles.scrollContainer} contentContainerStyle={[globalStyles.contentContainer, { alignItems: 'center' }]}>
      <Text style={[globalStyles.title, { textAlign: 'center', width: '100%' }]}>BACKUP E RESTAURAÇÃO</Text>

      {/* Card Exportar Backup */}
      <View style={[globalStyles.card, { width: '100%' }]}>
        <Text style={[globalStyles.sectionTitle, { textAlign: 'center' }]}>Exportar Backup</Text>
        <Text style={[globalStyles.sectionSubtitle, { textAlign: 'center' }]}>
          Exporta todos os seus relatórios e senhas arquivadas para um arquivo JSON.
          Você pode compartilhar ou salvar em um local seguro.
        </Text>
        <TouchableOpacity 
          style={globalStyles.buttonSuccess} 
          onPress={exportBackup} 
          disabled={loading}
        >
          <Text style={globalStyles.buttonText}>
            {loading ? 'EXPORTANDO...' : 'EXPORTAR BACKUP'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Card Importar Backup */}
      <View style={[globalStyles.card, { width: '100%' }]}>
        <Text style={[globalStyles.sectionTitle, { textAlign: 'center' }]}>Importar Backup</Text>
        <Text style={[globalStyles.sectionSubtitle, { textAlign: 'center' }]}>
          Restaura todos os dados a partir de um arquivo JSON exportado anteriormente.
          Os dados atuais serão substituídos.
        </Text>
        <TouchableOpacity 
          style={globalStyles.buttonSuccess} 
          onPress={importBackup} 
          disabled={loading}
        >
          <Text style={globalStyles.buttonText}>
            {loading ? 'IMPORTANDO...' : 'IMPORTAR BACKUP'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Card Limpar Todos os Dados */}
      <View style={[globalStyles.card, { borderColor: COLORS.danger, width: '100%' }]}>
        <Text style={[globalStyles.sectionTitle, { color: COLORS.danger, textAlign: 'center' }]}>Limpar Todos os Dados</Text>
        <Text style={[globalStyles.sectionSubtitle, { textAlign: 'center' }]}>
          Remove permanentemente todos os relatórios e senhas arquivadas.
          Esta ação não pode ser desfeita. Faça um backup antes.
        </Text>
        <TouchableOpacity 
          style={globalStyles.buttonDanger} 
          onPress={clearAllData}
        >
          <Text style={globalStyles.buttonText}>LIMPAR TUDO</Text>
        </TouchableOpacity>
      </View>

      {/* Card Informações */}
      <View style={[globalStyles.card, { width: '100%' }]}>
        <Text style={[globalStyles.sectionTitle, { textAlign: 'center' }]}>Informações</Text>
        <Text style={[globalStyles.sectionSubtitle, { textAlign: 'center' }]}>• Os backups são salvos em formato JSON</Text>
        <Text style={[globalStyles.sectionSubtitle, { textAlign: 'center' }]}>• Recomenda-se fazer backup regularmente</Text>
        <Text style={[globalStyles.sectionSubtitle, { textAlign: 'center' }]}>• Você pode importar backups em qualquer dispositivo</Text>
        <Text style={[globalStyles.sectionSubtitle, { textAlign: 'center' }]}>• A versão atual do formato é 1.0</Text>
      </View>

      {/* Botão Voltar */}
      <TouchableOpacity 
        style={globalStyles.button} 
        onPress={() => navigation.goBack()}
      >
        <Text style={globalStyles.buttonText}>VOLTAR</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}