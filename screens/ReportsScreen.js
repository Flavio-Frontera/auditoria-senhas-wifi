import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  FlatList,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import { globalStyles, COLORS, getScoreColor, getScoreStatus, SPACING, BORDER_RADIUS } from '../styles/GlobalStyles';
import { buildAuditPdfHtml } from '../utils/PdfReport';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Gera o PDF e grava direto na pasta do app. Não usamos o arquivo temporário do
// expo-print (cache/Print): no Android/Expo Go ele não pode ser lido, movido
// nem compartilhado ("Not allowed to read file under given URL").
async function savePdf(html, fileName) {
  const { base64 } = await Print.printToFileAsync({ html, base64: true });
  const dest = FileSystem.documentDirectory + fileName;
  await FileSystem.writeAsStringAsync(dest, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return dest;
}

function csvCell(value) {
  let text = value === null || value === undefined ? '' : String(value);
  // evita injeção de fórmula ao abrir no Excel (apenas para textos)
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = "'" + text;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function ScoreChart({ data }) {
  const [chartWidth, setChartWidth] = useState(SCREEN_WIDTH - 80);

  useEffect(() => {
    setChartWidth(Math.max(SCREEN_WIDTH - 80, (data.length || 1) * 60));
  }, [data]);

  if (!data || data.length < 2) {
    return (
      <View style={styles.chartEmptyBox}>
        <Text style={styles.chartEmptyText}>
          Realize pelo menos 2 auditorias para ver o gráfico de evolução.
        </Text>
      </View>
    );
  }

  const allReports = [...data].reverse();
  const chartHeight = 140;
  const maxScore = 100;
  const minScore = -100;

  const points = allReports.map((item, index) => {
    const x = (index / (allReports.length - 1)) * chartWidth;
    const y = chartHeight - ((item.score - minScore) / (maxScore - minScore)) * chartHeight;
    
    let displayDate = '';
    try {
      if (item.date) {
        const parsedDate = new Date(item.date);
        if (!isNaN(parsedDate.getTime())) {
          displayDate = parsedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        } else {
          const dateMatch = item.date.match(/(\d{2})\/(\d{2})\/(\d{4})/);
          if (dateMatch) {
            displayDate = `${dateMatch[1]}/${dateMatch[2]}`;
          } else {
            displayDate = '--/--';
          }
        }
      } else {
        displayDate = '--/--';
      }
    } catch (e) {
      displayDate = '--/--';
    }
    
    return { x, y, score: item.score, ssid: item.ssid, date: displayDate };
  });

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={true}>
      <View style={[styles.chartWrapper, { minWidth: chartWidth + 60 }]}>
        <Text style={styles.chartTitle}>EVOLUÇÃO DA PONTUAÇÃO</Text>
        <Text style={styles.chartSubtitle}>Total de auditorias: {allReports.length}</Text>

        <View style={[styles.chartGrid, { width: chartWidth, height: chartHeight, marginLeft: 40 }]}>
          {[100, 70, 30, -30, -70, -100].map(line => {
            const top = chartHeight - ((line - minScore) / (maxScore - minScore)) * chartHeight;
            let lineColor = '#1A0030';
            if (line === 70) lineColor = '#00FF8844';
            if (line === 30) lineColor = '#FFB80044';
            if (line === -30) lineColor = '#FF883344';
            if (line === -70) lineColor = '#FF3B5C44';
            return (
              <View key={line} style={[styles.chartGridLine, { top, backgroundColor: lineColor }]}>
                <Text style={[styles.chartGridLabel, { 
                  top: -8, 
                  color: line === 70 ? COLORS.success : (line === 30 ? COLORS.warning : (line === -30 ? COLORS.info : COLORS.textMuted)) 
                }]}>
                  {line}
                </Text>
              </View>
            );
          })}

          {points.map((point, index) => {
            if (index < points.length - 1) {
              const next = points[index + 1];
              const dx = next.x - point.x;
              const dy = next.y - point.y;
              const length = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx) * (180 / Math.PI);
              return (
                <View
                  key={`line-${index}`}
                  style={{
                    position: 'absolute',
                    left: point.x,
                    top: point.y,
                    width: length,
                    height: 2,
                    backgroundColor: COLORS.border,
                    opacity: 0.8,
                    transform: [{ rotate: `${angle}deg` }],
                    transformOrigin: 'left center',
                  }}
                />
              );
            }
            return null;
          })}

          {points.map((point, index) => (
            <View
              key={`dot-${index}`}
              style={[
                styles.chartDot,
                {
                  left: point.x - 10,
                  top: point.y - 10,
                  backgroundColor: getScoreColor(point.score),
                },
              ]}
            >
              <Text style={styles.chartDotLabel}>{point.score}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.chartLabelsRow, { width: chartWidth, marginLeft: 40 }]}>
          {points.map((point, index) => (
            <View key={`label-${index}`} style={[styles.chartLabelContainer, { left: point.x - 35 }]}>
              <Text style={styles.chartNetLabel} numberOfLines={1}>
                {String(point.ssid ?? '').length > 10 ? String(point.ssid).slice(0, 10) + '...' : String(point.ssid ?? '')}
              </Text>
              <Text style={styles.chartDateLabel}>{point.date}</Text>
            </View>
          ))}
        </View>

        <View style={styles.chartLegend}>
          <View style={styles.chartLegendItem}>
            <View style={[styles.chartLegendColor, { backgroundColor: COLORS.success }]} />
            <Text style={styles.chartLegendText}>70-100: Segura</Text>
          </View>
          <View style={styles.chartLegendItem}>
            <View style={[styles.chartLegendColor, { backgroundColor: COLORS.warning }]} />
            <Text style={styles.chartLegendText}>30-69: Moderada</Text>
          </View>
          <View style={styles.chartLegendItem}>
            <View style={[styles.chartLegendColor, { backgroundColor: COLORS.info }]} />
            <Text style={styles.chartLegendText}>-30 a 29: Fraca</Text>
          </View>
          <View style={styles.chartLegendItem}>
            <View style={[styles.chartLegendColor, { backgroundColor: COLORS.danger }]} />
            <Text style={styles.chartLegendText}>-100 a -31: Crítica</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

export default function ReportsScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [showChart, setShowChart] = useState(false);
  const [filterNetwork, setFilterNetwork] = useState('');
  const [availableNetworks, setAvailableNetworks] = useState([]);

  useEffect(() => {
    loadReports();
    const unsubscribe = navigation.addListener('focus', loadReports);
    return unsubscribe;
  }, [navigation]);

  async function loadReports() {
    try {
      const data = await AsyncStorage.getItem('reports');
      const parsed = data ? JSON.parse(data) : [];
      setReports(parsed);
      setAvailableNetworks([...new Set(parsed.map(r => r.ssid))]);
    } catch (error) {
      console.log(error);
    }
  }

  const filteredReports = reports.filter(r => {
    const matchSearch = search === '' || 
      r.ssid?.toLowerCase().includes(search.toLowerCase()) ||
      r.status?.toLowerCase().includes(search.toLowerCase());
    const matchNetwork = filterNetwork === '' || r.ssid === filterNetwork;
    return matchSearch && matchNetwork;
  });

  async function exportToCSV() {
    try {
      const headers = ['Rede', 'Status', 'Pontuacao', 'Data'];
      const rows = filteredReports.map(r => [r.ssid, r.status, r.score, r.date]);
      const csvContent = '\uFEFF' + [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\n');
      
      const fileName = `relatorios_${Date.now()}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, csvContent);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
      Alert.alert('Sucesso', 'Relatórios exportados para CSV');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao exportar CSV');
    }
  }

  async function deleteReport(reportId) {
    const updated = reports.filter(r => r.id !== reportId);
    setReports(updated);
    await AsyncStorage.setItem('reports', JSON.stringify(updated));
    setAvailableNetworks([...new Set(updated.map(r => r.ssid))]);
    if (filterNetwork && !updated.some(r => r.ssid === filterNetwork)) {
      setFilterNetwork('');
    }
  }

  function confirmDelete(report) {
    Alert.alert('Deletar relatório', `Deseja deletar o relatório da rede "${report.ssid}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Deletar', style: 'destructive', onPress: () => deleteReport(report.id) },
    ]);
  }

  function renderReportItem({ item }) {
    return (
      <View style={styles.reportCard}>
        <TouchableOpacity style={styles.reportCardBody} onPress={() => setSelected(item)}>
          <View style={styles.reportCardHeader}>
            <Text style={styles.reportCardTitle} numberOfLines={1}>{item.ssid}</Text>
            <Text style={[styles.reportCardScore, { color: getScoreColor(item.score) }]}>
              {item.score}/100
            </Text>
          </View>
          <Text style={styles.reportCardDate}>{item.date}</Text>
          <Text style={[styles.reportCardStatus, { color: getScoreColor(item.score) }]}>
            {getScoreStatus(item.score)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.reportCardDelete} onPress={() => confirmDelete(item)}>
          <Text style={styles.reportCardDeleteText}>X</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function exportToPDF(report) {
    try {
      const html = buildAuditPdfHtml({
        ssid: report.ssid,
        date: report.date,
        score: report.score,
        status: report.status,
        passwordMasked: report.passwordMasked,
        scoreDetails: report.scoreDetails || [],
        crackTime: report.crackTime,
        wifiStats: report.wifiStats,
        recommendations: report.recommendations || [],
        rawContent: report.content,
      });

      const fileName = `relatorio_${String(report.ssid || 'rede').replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`;
      const destUri = await savePdf(html, fileName);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(destUri, { mimeType: 'application/pdf' });
      }
      Alert.alert('Sucesso', 'PDF exportado com sucesso!');
    } catch (error) {
      console.log(error);
      Alert.alert('Erro', 'Falha ao exportar PDF');
    }
  }

  if (selected) {
    return (
      <ScrollView
        style={globalStyles.container}
        contentContainerStyle={[globalStyles.contentContainer, { paddingHorizontal: SPACING.xl, alignItems: 'center' }]}
      >
        <Text style={[globalStyles.titleSmall, { textAlign: 'center', width: '100%' }]}>RELATÓRIO</Text>
        <View style={[globalStyles.reportBox, { width: '100%' }]}>
          <Text style={globalStyles.reportText}>{selected.content}</Text>
        </View>
        <TouchableOpacity style={[globalStyles.buttonSuccess, { width: '100%' }]} onPress={() => exportToPDF(selected)}>
          <Text style={globalStyles.buttonText}>EXPORTAR PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[globalStyles.buttonPrimary, { marginTop: 24, width: '100%' }]} onPress={() => setSelected(null)}>
          <Text style={globalStyles.buttonText}>VOLTAR</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={[globalStyles.container, { paddingHorizontal: SPACING.xl }]}>
      <Text style={globalStyles.title}>RELATÓRIOS</Text>

      {/* Filtro por rede */}
      {availableNetworks.length > 0 && (
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filtrar por rede:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterChip, filterNetwork === '' && styles.filterChipActive]}
              onPress={() => setFilterNetwork('')}
            >
              <Text style={[styles.filterChipText, filterNetwork === '' && styles.filterChipTextActive]}>Todas</Text>
            </TouchableOpacity>
            {availableNetworks.map((network, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.filterChip, filterNetwork === network && styles.filterChipActive]}
                onPress={() => setFilterNetwork(network)}
              >
                <Text style={[styles.filterChipText, filterNetwork === network && styles.filterChipTextActive]}>
                  {network.length > 20 ? network.slice(0, 20) + '...' : network}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Busca */}
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar por rede ou status..."
        placeholderTextColor={COLORS.textMuted}
        value={search}
        onChangeText={setSearch}
      />

      {/* Botões de ação em linha */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity 
          style={[styles.actionButton, showChart && styles.actionButtonActive]} 
          onPress={() => setShowChart(!showChart)}
        >
          <Text style={[styles.actionButtonText, showChart && styles.actionButtonTextActive]}>
            {showChart ? 'LISTA' : 'GRÁFICO'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={exportToCSV}>
          <Text style={styles.actionButtonText}>CSV</Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo principal */}
      {filteredReports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={globalStyles.emptyText}>
            {search.length > 0 || filterNetwork !== '' ? 'Nenhum relatório encontrado' : 'Nenhum relatório salvo ainda'}
          </Text>
        </View>
      ) : showChart ? (
        <View style={styles.chartContainer}>
          <ScoreChart data={filteredReports} />
        </View>
      ) : (
        <>
          <Text style={styles.resultCount}>{filteredReports.length} relatório(s) encontrado(s)</Text>
          <FlatList
            data={filteredReports}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderReportItem}
            showsVerticalScrollIndicator={true}
          />
        </>
      )}

      <TouchableOpacity style={[globalStyles.button, { marginBottom: SPACING.xl }]} onPress={() => navigation.goBack()}>
        <Text style={globalStyles.buttonText}>VOLTAR</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = {

  filterContainer: {
    marginBottom: SPACING.md,
  },
  filterLabel: {
    color: COLORS.secondary,
    fontSize: 14,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.md,
  },
  filterChipActive: {
    backgroundColor: COLORS.border,
  },
  filterChipText: {
    color: COLORS.primary,
    fontSize: 13,
  },
  filterChipTextActive: {
    color: COLORS.text,
  },

  searchInput: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.md,
    color: COLORS.text,
    fontSize: 16,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.surface,
    textAlign: 'center',
  },

  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  actionButton: {
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.xxl,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxxl,
    alignItems: 'center',
  },
  actionButtonActive: {
    backgroundColor: COLORS.border,
  },
  actionButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtonTextActive: {
    color: COLORS.text,
  },

  reportCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  reportCardBody: {
    flex: 1,
    padding: SPACING.lg,
  },
  reportCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  reportCardTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: SPACING.sm,
  },
  reportCardScore: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  reportCardDate: {
    color: COLORS.secondary,
    fontSize: 12,
    marginBottom: SPACING.xs,
  },
  reportCardStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  reportCardDelete: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A0010',
    borderLeftWidth: 1,
    borderLeftColor: COLORS.danger + '44',
  },
  reportCardDeleteText: {
    color: COLORS.danger,
    fontSize: 18,
    fontWeight: 'bold',
  },

  resultCount: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },

  chartContainer: {
    flex: 1,
    marginTop: SPACING.md,
  },

  chartEmptyBox: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xxxl,
    alignItems: 'center',
  },
  chartEmptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  chartWrapper: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.xl,
    marginBottom: SPACING.md,
  },
  chartTitle: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  chartSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  chartGrid: {
    position: 'relative',
    marginBottom: SPACING.xxxl,
  },
  chartGridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  chartGridLabel: {
    fontSize: 9,
    position: 'absolute',
    left: -38,
    width: 35,
    textAlign: 'right',
  },
  chartDot: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 2,
    borderColor: COLORS.text,
  },
  chartDotLabel: {
    color: '#000',
    fontSize: 9,
    fontWeight: 'bold',
  },
  chartLabelsRow: {
    position: 'relative',
    height: 50,
  },
  chartLabelContainer: {
    position: 'absolute',
    alignItems: 'center',
    width: 70,
  },
  chartNetLabel: {
    color: COLORS.textSecondary,
    fontSize: 9,
    textAlign: 'center',
  },
  chartDateLabel: {
    color: COLORS.textMuted,
    fontSize: 8,
    textAlign: 'center',
  },
  chartLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: SPACING.xl,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderDark,
    gap: SPACING.md,
  },
  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  chartLegendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  chartLegendText: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },
};