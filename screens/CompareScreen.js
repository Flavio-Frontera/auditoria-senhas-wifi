import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { globalStyles, COLORS, getScoreColor, getScoreStatus, SPACING, BORDER_RADIUS } from '../styles/GlobalStyles';

function sameReport(a, b) {
  if (a.id !== undefined && b.id !== undefined) return a.id === b.id;
  return a.ssid === b.ssid && a.date === b.date;
}

function csvCell(value) {
  let text = value === null || value === undefined ? '' : String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = "'" + text;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// As datas dos relatórios são salvas como "dd/mm/aaaa hh:mm:ss" (pt-BR),
// formato que new Date() não interpreta com segurança.
function formatReportDate(value) {
  const match = typeof value === 'string' && value.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) return `${match[1]}/${match[2]}/${match[3]}`;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? '--/--/----' : parsed.toLocaleDateString('pt-BR');
}

export default function CompareScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [selectedReports, setSelectedReports] = useState([]);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      const data = await AsyncStorage.getItem('reports');
      if (data) {
        setReports(JSON.parse(data));
      }
    } catch (error) {
      console.log(error);
    }
  }

  function toggleSelection(report) {
    if (selectedReports.find(r => sameReport(r, report))) {
      setSelectedReports(selectedReports.filter(r => !sameReport(r, report)));
    } else {
      if (selectedReports.length >= 5) {
        Alert.alert('Limite', 'Você pode comparar no máximo 5 senhas por vez');
        return;
      }
      setSelectedReports([...selectedReports, report]);
    }
  }

  function clearSelection() {
    setSelectedReports([]);
    setShowComparison(false);
  }

  function comparePasswords() {
    if (selectedReports.length < 2) {
      Alert.alert('Aviso', 'Selecione pelo menos 2 senhas para comparar');
      return;
    }
    setShowComparison(true);
  }

  async function exportComparison() {
    const comparisonData = selectedReports.map(r => ({
      rede: r.ssid,
      data: r.date,
      pontuacao: r.score,
      status: getScoreStatus(r.score),
    }));

    const csvContent = '\uFEFF' + [
      ['Rede', 'Data', 'Pontuação', 'Status'],
      ...comparisonData.map(r => [r.rede, r.data, r.pontuacao, r.status])
    ].map(row => row.map(csvCell).join(',')).join('\n');

    const fileName = `comparacao_senhas_${Date.now()}.csv`;
    const fileUri = FileSystem.documentDirectory + fileName;
    await FileSystem.writeAsStringAsync(fileUri, csvContent);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    }
    Alert.alert('Sucesso', 'Comparação exportada para CSV');
  }

  function renderReportItem({ item }) {
    const isSelected = selectedReports.some(r => sameReport(r, item));
    return (
      <TouchableOpacity
        style={[styles.reportItem, isSelected && styles.reportItemSelected]}
        onPress={() => toggleSelection(item)}
      >
        <View style={styles.reportItemHeader}>
          <Text style={styles.reportItemSsid}>{item.ssid}</Text>
          <Text style={[styles.reportItemScore, { color: getScoreColor(item.score) }]}>
            {item.score}/100
          </Text>
        </View>
        <Text style={styles.reportItemDate}>{item.date}</Text>
        <Text style={[styles.reportItemStatus, { color: getScoreColor(item.score) }]}>
          {getScoreStatus(item.score)}
        </Text>
      </TouchableOpacity>
    );
  }

  if (showComparison) {
    const sortedReports = [...selectedReports].sort((a, b) => b.score - a.score);
    const best = sortedReports[0];
    const worst = sortedReports[sortedReports.length - 1];
    const average = sortedReports.reduce((sum, r) => sum + r.score, 0) / sortedReports.length;

    return (
      <ScrollView style={globalStyles.scrollContainer} contentContainerStyle={[globalStyles.contentContainer, { alignItems: 'center' }]}>
        <Text style={[globalStyles.titleSmall, { textAlign: 'center', width: '100%' }]}>COMPARAÇÃO</Text>

        <View style={[globalStyles.card, { width: '100%' }]}>
          <Text style={[globalStyles.sectionTitle, { textAlign: 'center' }]}>Resumo</Text>
          <Text style={[globalStyles.label, { textAlign: 'center' }]}>Melhor senha: {best.ssid} ({best.score}/100)</Text>
          <Text style={[globalStyles.label, { textAlign: 'center' }]}>Pior senha: {worst.ssid} ({worst.score}/100)</Text>
          <Text style={[globalStyles.label, { textAlign: 'center' }]}>Média: {average.toFixed(1)}/100</Text>
          <Text style={[globalStyles.label, { textAlign: 'center' }]}>Total comparado: {selectedReports.length} senhas</Text>
        </View>

        <View style={[globalStyles.card, { width: '100%' }]}>
          <Text style={[globalStyles.sectionTitle, { textAlign: 'center' }]}>Tabela Comparativa</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 2 }]}>Rede</Text>
            <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 1.5 }]}>Data</Text>
            <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 1 }]}>Pontos</Text>
            <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 1.5 }]}>Status</Text>
          </View>
          {sortedReports.map((report, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>{report.ssid}</Text>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>{formatReportDate(report.date)}</Text>
              <Text style={[styles.tableCell, { flex: 1, color: getScoreColor(report.score) }]}>{report.score}</Text>
              <Text style={[styles.tableCell, { flex: 1.5, color: getScoreColor(report.score) }]}>{getScoreStatus(report.score)}</Text>
            </View>
          ))}
        </View>

        <View style={[globalStyles.row, { width: '100%' }]}>
          <TouchableOpacity style={[globalStyles.buttonSuccess, { flex: 1 }]} onPress={exportComparison}>
            <Text style={globalStyles.buttonTextSmall}>EXPORTAR CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[globalStyles.button, { flex: 1 }]} onPress={clearSelection}>
            <Text style={globalStyles.buttonTextSmall}>VOLTAR</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={[globalStyles.container, { paddingHorizontal: SPACING.xl }]}>
      <Text style={[globalStyles.title, { textAlign: 'center' }]}>COMPARAR SENHAS</Text>
      <Text style={[globalStyles.subtitle, { textAlign: 'center' }]}>Selecione as senhas para comparar (máximo 5)</Text>

      {reports.length === 0 ? (
        <Text style={[globalStyles.emptyText, { textAlign: 'center' }]}>Nenhum relatório encontrado. Faça uma auditoria primeiro.</Text>
      ) : (
        <>
          <FlatList
            data={reports}
            keyExtractor={(item, index) => String(item.id ?? index)}
            renderItem={renderReportItem}
            contentContainerStyle={{ paddingBottom: SPACING.xl }}
          />
          
          <View style={styles.bottomButtons}>
            <Text style={styles.selectedCount}>
              Selecionadas: {selectedReports.length} senha(s)
            </Text>
            <View style={globalStyles.row}>
              <TouchableOpacity style={[globalStyles.buttonSuccess, { flex: 1 }]} onPress={comparePasswords}>
                <Text style={globalStyles.buttonTextSmall}>COMPARAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[globalStyles.buttonDanger, { flex: 1 }]} onPress={clearSelection}>
                <Text style={globalStyles.buttonTextSmall}>LIMPAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      <TouchableOpacity style={globalStyles.button} onPress={() => navigation.goBack()}>
        <Text style={globalStyles.buttonText}>VOLTAR</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = {
  reportItem: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  reportItemSelected: {
    borderColor: COLORS.success,
    backgroundColor: '#0A2A1A',
  },
  reportItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  reportItemSsid: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  reportItemScore: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  reportItemDate: {
    color: COLORS.secondary,
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  reportItemStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bottomButtons: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  selectedCount: {
    color: COLORS.secondary,
    fontSize: 14,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDark,
  },
  tableCell: {
    color: COLORS.text,
    fontSize: 12,
    paddingHorizontal: SPACING.xs,
  },
  tableCellHeader: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
};