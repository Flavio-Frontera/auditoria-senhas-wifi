import React, { useEffect, useState, useRef } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';

import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import * as Network from 'expo-network';
import * as Device from 'expo-device';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { globalStyles, COLORS, SPACING, getScoreColor, getScoreStatus, getPointsColor } from '../styles/GlobalStyles';
import { buildAuditPdfHtml } from '../utils/PdfReport';
import { scorePassword, getPasswordRecommendations } from '../utils/PasswordScore';

const NETWORK_TEST_DOWNLOAD_BYTES = 4000000;
const NETWORK_TEST_UPLOAD_BYTES = 2000000; 
const NETWORK_TEST_TIMEOUT_MS = 10000; 

async function fetchWithTimeout(url, options = {}, timeoutMs = NETWORK_TEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function formatMbps(bytes, seconds) {
  if (!seconds || seconds <= 0) return 0;
  const bits = bytes * 8;
  const mbps = bits / seconds / 1000000;
  return Math.round(mbps * 100) / 100;
}

function buildUploadPayload(size) {
  const chunk = 'AuditoriaWiFiTesteDeVelocidadeDeUpload0123456789';
  let payload = '';
  while (payload.length < size) {
    payload += chunk;
  }
  return payload.slice(0, size);
}

async function measureLatency() {
  const start = Date.now();
  await fetchWithTimeout(`https://speed.cloudflare.com/__down?bytes=1000&_=${Date.now()}`);
  return Date.now() - start;
}

async function measureDownloadSpeed(bytes) {
  const start = Date.now();
  const response = await fetchWithTimeout(`https://speed.cloudflare.com/__down?bytes=${bytes}&_=${Date.now()}`);
  await response.blob();
  const seconds = (Date.now() - start) / 1000;
  return formatMbps(bytes, seconds);
}

async function measureUploadSpeed(bytes) {
  const payload = buildUploadPayload(bytes);
  const start = Date.now();
  await fetchWithTimeout('https://speed.cloudflare.com/__up', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: payload,
  });
  const seconds = (Date.now() - start) / 1000;
  return formatMbps(bytes, seconds);
}

async function collectWifiStats() {
  const state = await Network.getNetworkStateAsync();

  if (state.type !== Network.NetworkStateType.WIFI || !state.isConnected) {
    return { available: false, reason: 'Dispositivo não está conectado a uma rede WiFi no momento.' };
  }

  const localIp = await Network.getIpAddressAsync();
  const latencyMs = await measureLatency();
  const downloadMbps = await measureDownloadSpeed(NETWORK_TEST_DOWNLOAD_BYTES);
  const uploadMbps = await measureUploadSpeed(NETWORK_TEST_UPLOAD_BYTES);

  return {
    available: true,
    connectionType: 'WiFi',
    isInternetReachable: state.isInternetReachable,
    localIp,
    latencyMs,
    downloadMbps,
    uploadMbps,
    deviceModel: Device.modelName || 'Não identificado',
    deviceManufacturer: Device.manufacturer || 'Não identificado',
    osVersion: `${Device.osName || ''} ${Device.osVersion || ''}`.trim(),
    measuredAt: new Date().toLocaleString('pt-BR'),
  };
}

async function savePdf(html, fileName) {
  const { base64 } = await Print.printToFileAsync({ html, base64: true });
  const dest = FileSystem.documentDirectory + fileName;
  await FileSystem.writeAsStringAsync(dest, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return dest;
}

export default function AttackScreen({ route, navigation }) {
  const { ssid, password } = route.params || {};
  const hasValidParams = Boolean(ssid && password);

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('ANALISANDO...');
  const [crackTime, setCrackTime] = useState(null);
  const [dictionaryMatches, setDictionaryMatches] = useState([]);
  const [auditDone, setAuditDone] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState(null);
  const [scoreDetails, setScoreDetails] = useState([]);
  const [finalScore, setFinalScore] = useState(0);
  const [sameNetworkConfirmed, setSameNetworkConfirmed] = useState(false);
  const [wifiStats, setWifiStats] = useState(null);
  const [testingWifi, setTestingWifi] = useState(false);
  const [wifiTestError, setWifiTestError] = useState(null);
  const [reportId] = useState(() => Date.now());
  const [reportDate, setReportDate] = useState(null);

  const persistQueueRef = useRef(Promise.resolve());

  useEffect(() => {
    if (auditDone && !reportDate) {
      setReportDate(new Date().toLocaleString('pt-BR'));
    }
  }, [auditDone]);

  useEffect(() => {
    if (auditDone && reportDate) {
      persistReport();
    }
  }, [auditDone, reportDate, wifiStats]);

  useEffect(() => {
    if (hasValidParams) {
      startAudit();
    }
  }, []);

  async function startAudit() {
    for (let i = 0; i <= 100; i += 5) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 30));
    }

    const { score, details, crackTime: crack, dictionaryMatches: dictFound } = scorePassword(password, { ssid });

    setCrackTime(crack);
    setDictionaryMatches(dictFound);
    setFinalScore(score);
    setScoreDetails(details);
    setAuditDone(true);
    setStatus(getScoreStatus(score));
  }

  function getRecommendations() {
    return getPasswordRecommendations(password, dictionaryMatches, { ssid });
  }

  async function handleMeasureWifi() {
    if (!sameNetworkConfirmed) {
      Alert.alert('Confirmação necessária', `Marque a confirmação de que o aparelho está conectado na rede "${ssid}" antes de medir.`);
      return;
    }
    setTestingWifi(true);
    setWifiTestError(null);
    try {
      const stats = await collectWifiStats();
      if (!stats.available) {
        setWifiTestError(stats.reason);
        setWifiStats(null);
      } else {
        setWifiStats(stats);
      }
    } catch (error) {
      console.log('Erro ao medir rede:', error);
      const isTimeout = error?.name === 'AbortError';
      setWifiTestError(
        isTimeout
          ? 'A medição demorou demais e foi cancelada. Verifique sua conexão com a internet e tente novamente.'
          : 'Falha ao medir a rede. Verifique sua conexão com a internet e tente novamente.'
      );
      setWifiStats(null);
    } finally {
      setTestingWifi(false);
    }
  }

  function getWifiStatsText() {
    if (!wifiStats) return 'Estatísticas de rede não coletadas nesta auditoria.';
    return `Confirmado pelo usuário como a rede testada: Sim
Tipo de conexão: ${wifiStats.connectionType}
Internet acessível: ${wifiStats.isInternetReachable ? 'Sim' : 'Não'}
IP local do dispositivo: ${wifiStats.localIp}
Latência: ${wifiStats.latencyMs} ms
Velocidade de download: ${wifiStats.downloadMbps} Mbps
Velocidade de upload: ${wifiStats.uploadMbps} Mbps
Dispositivo de teste: ${wifiStats.deviceManufacturer} ${wifiStats.deviceModel}
Sistema: ${wifiStats.osVersion}
Medido em: ${wifiStats.measuredAt}`;
  }

  function buildReportContentText(dateStr) {
    const scoreDetailsText = scoreDetails.map(d => {
      return `${d.criterion}: ${d.points > 0 ? `+${d.points}` : d.points} pontos - ${d.found}\n   Requisito: ${d.requirement}`;
    }).join('\n\n');

    return `
================================
   RELATÓRIO DE AUDITORIA WiFi
================================

PONTUAÇÃO GERAL: ${finalScore}/100
STATUS: ${status}
REDE: ${ssid}
DATA: ${dateStr}

================================
DETALHES DA PONTUAÇÃO
================================

${scoreDetailsText}

================================
RESISTÊNCIA A ATAQUES
================================
Tempo estimado para quebra: ${crackTime?.label || 'N/A'}

================================
ESTATÍSTICAS DA REDE WiFi
================================
${getWifiStatsText()}

================================
RECOMENDAÇÕES
================================

${getRecommendations().join('\n')}

================================
`;
  }

  async function persistReportTask(extraFields) {
    if (!auditDone) return;
    const dateStr = reportDate || new Date().toLocaleString('pt-BR');
    const content = buildReportContentText(dateStr);

    const reportEntry = {
      id: reportId,
      scoringVersion: 'nist-63b-4',
      ssid,
      status,
      score: finalScore,
      date: dateStr,
      content,
      wifiStats: wifiStats || null,
      scoreDetails,
      crackTime,
      recommendations: getRecommendations(),
      passwordMasked: `${'*'.repeat(Math.min(password.length, 12))}${password.length > 12 ? '...' : ''}`,
      ...extraFields,
    };

    try {
      const existing = await AsyncStorage.getItem('reports');
      let reports = existing ? JSON.parse(existing) : [];
      const idx = reports.findIndex(r => r.id === reportId);
      if (idx >= 0) {
        reports[idx] = { ...reports[idx], ...reportEntry };
      } else {
        reports.unshift(reportEntry);
      }
      await AsyncStorage.setItem('reports', JSON.stringify(reports));
    } catch (error) {
      console.log('Erro ao salvar relatório automaticamente:', error);
    }
  }

  function persistReport(extraFields = {}) {
    const run = () => persistReportTask(extraFields);
    const next = persistQueueRef.current.then(run, run);
    persistQueueRef.current = next;
    return next;
  }

  async function exportToPDF() {
    if (exporting) return;
    
    setExporting(true);
    setExportType('pdf');
    
    try {
      const currentDate = reportDate || new Date().toLocaleString('pt-BR');

      const htmlContent = buildAuditPdfHtml({
        ssid,
        date: currentDate,
        score: finalScore,
        status,
        passwordMasked: `${'*'.repeat(Math.min(password.length, 12))}${password.length > 12 ? '...' : ''}`,
        scoreDetails,
        crackTime,
        wifiStats,
        recommendations: getRecommendations(),
      });

      
      const fileName = `Auditoria_${ssid.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`;
      const newPath = await savePdf(htmlContent, fileName);

      await persistReport({ pdfUri: newPath });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newPath);
      }

      Alert.alert('Sucesso', 'Relatório PDF gerado!');
    } catch (error) {
      console.log('PDF Error:', error);
      Alert.alert('Erro', 'Falha ao gerar PDF: ' + error.message);
    } finally {
      setExporting(false);
      setExportType(null);
    }
  }

  async function exportToTXT() {
    if (exporting) return;
    
    setExporting(true);
    setExportType('txt');
    
    try {
      const currentDate = reportDate || new Date().toLocaleString('pt-BR');
      const report = buildReportContentText(currentDate);

      const fileName = `Relatorio_${ssid.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.txt`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, report);

      await persistReport({ txtUri: fileUri });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }

      Alert.alert('Sucesso', 'Relatório TXT gerado!');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao gerar TXT');
    } finally {
      setExporting(false);
      setExportType(null);
    }
  }

  if (!hasValidParams) {
    return (
      <View style={globalStyles.container}>
        <View style={{ flex: 1, justifyContent: 'center', padding: SPACING.xxl }}>
          <Text style={globalStyles.title}>ERRO</Text>
          <View style={[globalStyles.card, { borderColor: COLORS.danger }]}>
            <Text style={[globalStyles.sectionTitle, { textAlign: 'center', color: COLORS.danger }]}>
              Dados da rede não encontrados
            </Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginTop: SPACING.md }}>
              Esta tela precisa ser aberta a partir da tela de senha, com o nome da rede e a senha preenchidos.
            </Text>
          </View>
          <TouchableOpacity style={globalStyles.buttonPrimary} onPress={() => navigation.navigate('Password')}>
            <Text style={globalStyles.buttonText}>IR PARA TESTE DE SENHA</Text>
          </TouchableOpacity>
          <TouchableOpacity style={globalStyles.button} onPress={() => navigation.navigate('Home')}>
            <Text style={globalStyles.buttonText}>VOLTAR AO INÍCIO</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={globalStyles.scrollContainer} contentContainerStyle={globalStyles.contentContainer}>
      <Text style={globalStyles.titleSmall}>AUDITORIA</Text>

      <View style={globalStyles.cardLarge}>
        <Text style={globalStyles.label}>REDE:</Text>
        <Text style={globalStyles.value}>{ssid}</Text>

        <Text style={globalStyles.label}>STATUS:</Text>
        <Text style={[globalStyles.status, { color: getScoreColor(finalScore) }]}>
          {status}
        </Text>

        <Text style={globalStyles.label}>PONTUAÇÃO GERAL:</Text>
        <Text style={[globalStyles.score, { color: getScoreColor(finalScore) }]}>
          {finalScore}/100
        </Text>

        <View style={globalStyles.progressBar}>
          <View style={[globalStyles.progressFill, { width: `${((finalScore + 100) / 200) * 100}%`, backgroundColor: getScoreColor(finalScore) }]} />
        </View>
        <Text style={globalStyles.progressText}>{progress}%</Text>
      </View>

      {auditDone && crackTime && (
        <View style={globalStyles.sectionCard}>
          <Text style={globalStyles.sectionTitle}>RESISTÊNCIA A ATAQUES</Text>
          <Text style={globalStyles.sectionSubtitle}>Tempo estimado para quebra por força bruta (GPU):</Text>
          <Text style={[globalStyles.crackTime, { color: getScoreColor(finalScore) }]}>{crackTime.label}</Text>
          <Text style={globalStyles.crackNote}>* Baseado em 10 bilhões de tentativas/segundo</Text>
        </View>
      )}

      {auditDone && scoreDetails.length > 0 && (
        <View style={globalStyles.sectionCard}>
          <Text style={globalStyles.sectionTitle}>DETALHES DA PONTUAÇÃO</Text>
          {scoreDetails.map((detail, index) => (
            <View key={index} style={[globalStyles.detailRow, detail.points > 0 ? globalStyles.detailPositive : globalStyles.detailNegative]}>
              <View style={globalStyles.detailHeader}>
                <Text style={globalStyles.detailCriterion}>{detail.criterion}</Text>
                <Text style={[globalStyles.detailPoints, { color: getPointsColor(detail.points) }]}>
                  {detail.points > 0 ? `+${detail.points}` : detail.points}
                </Text>
              </View>
              <Text style={globalStyles.detailFound}>{detail.found}</Text>
            </View>
          ))}
        </View>
      )}

      {auditDone && (
        <View style={globalStyles.sectionCard}>
          <Text style={globalStyles.sectionTitle}>ESTATÍSTICAS DA REDE WiFi</Text>
          <Text style={globalStyles.sectionSubtitle}>
            Mede a velocidade real de download/upload e dados do dispositivo no momento da auditoria.
            Só é confiável se o aparelho estiver conectado nesta mesma rede.
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md }}>
            <Switch
              value={sameNetworkConfirmed}
              onValueChange={setSameNetworkConfirmed}
              trackColor={{ false: COLORS.textMuted, true: COLORS.success }}
            />
            <Text style={{ color: COLORS.text, fontSize: 14, marginLeft: 10, flex: 1 }}>
              Confirmo que este aparelho está conectado na rede "{ssid}" agora
            </Text>
          </View>

          <TouchableOpacity
            style={[globalStyles.buttonSecondary, !sameNetworkConfirmed && { opacity: 0.5 }]}
            onPress={handleMeasureWifi}
            disabled={!sameNetworkConfirmed || testingWifi}
          >
            {testingWifi ? (
              <ActivityIndicator color={COLORS.text} />
            ) : (
              <Text style={globalStyles.buttonText}>MEDIR VELOCIDADE E REDE</Text>
            )}
          </TouchableOpacity>

          {wifiTestError && (
            <Text style={{ color: COLORS.danger, fontSize: 13, marginTop: SPACING.md, textAlign: 'center' }}>
              {wifiTestError}
            </Text>
          )}

          {wifiStats && (
            <View style={{ marginTop: SPACING.lg }}>
              <Text style={globalStyles.label}>Tipo de conexão: <Text style={globalStyles.value}>{wifiStats.connectionType}</Text></Text>
              <Text style={globalStyles.label}>IP local: <Text style={{ color: COLORS.text }}>{wifiStats.localIp}</Text></Text>
              <Text style={globalStyles.label}>Latência: <Text style={{ color: COLORS.text }}>{wifiStats.latencyMs} ms</Text></Text>
              <Text style={globalStyles.label}>Download: <Text style={{ color: COLORS.success }}>{wifiStats.downloadMbps} Mbps</Text></Text>
              <Text style={globalStyles.label}>Upload: <Text style={{ color: COLORS.success }}>{wifiStats.uploadMbps} Mbps</Text></Text>
              <Text style={globalStyles.label}>Dispositivo: <Text style={{ color: COLORS.text }}>{wifiStats.deviceManufacturer} {wifiStats.deviceModel}</Text></Text>
              <Text style={globalStyles.crackNote}>* O teste consome cerca de 6 MB de dados e mede a velocidade até a internet, não somente o link WiFi local.</Text>
            </View>
          )}
        </View>
      )}

      {auditDone && (
        <View style={globalStyles.sectionCard}>
          <Text style={globalStyles.sectionTitle}>METODOLOGIA</Text>
          <Text style={globalStyles.sectionSubtitle}>
            Pontuação própria, inspirada no NIST SP 800-63B-4 e no OWASP Authentication Cheat Sheet:
            valoriza comprimento (mínimo de 15 caracteres, pois o WiFi não tem MFA), bloqueia senhas
            comuns, padrões previsíveis e o nome da rede. Não exige maiúsculas, números ou símbolos.
          </Text>
          <Text style={globalStyles.crackNote}>
            * A checagem de senhas comuns usa uma lista local reduzida, não uma base de vazamentos.
          </Text>
        </View>
      )}

      <TouchableOpacity style={globalStyles.buttonPrimary} onPress={exportToPDF} disabled={exporting}>
        <Text style={globalStyles.buttonText}>{exporting && exportType === 'pdf' ? 'GERANDO PDF...' : 'EXPORTAR PDF'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={globalStyles.buttonSecondary} onPress={exportToTXT} disabled={exporting}>
        <Text style={globalStyles.buttonText}>{exporting && exportType === 'txt' ? 'GERANDO TXT...' : 'EXPORTAR TXT'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={globalStyles.button} onPress={() => navigation.navigate('Reports')}>
        <Text style={globalStyles.buttonText}>VER RELATÓRIOS</Text>
      </TouchableOpacity>

      <TouchableOpacity style={globalStyles.button} onPress={() => navigation.navigate('Home')}>
        <Text style={globalStyles.buttonText}>VOLTAR AO INÍCIO</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
