import React, { useEffect, useState } from 'react';
import { View, Text, Alert, TouchableOpacity, Linking, AppState } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { globalStyles, COLORS, BORDER_RADIUS, SPACING } from '../styles/GlobalStyles';

// Lê um campo do formato WIFI:T:WPA;S:minhaRede;P:minhaSenha;;
// Respeita caracteres escapados com barra invertida (\; \: \, \\ \")
function getWifiField(raw, key) {
  const body = raw.slice(5); // remove "WIFI:"
  let i = 0;

  while (i < body.length) {
    if (body.startsWith(`${key}:`, i)) {
      i += key.length + 1;
      let value = '';
      while (i < body.length && body[i] !== ';') {
        if (body[i] === '\\' && i + 1 < body.length) {
          value += body[i + 1];
          i += 2;
        } else {
          value += body[i];
          i++;
        }
      }
      if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      return value;
    }

    // pula até o próximo ';' não escapado
    while (i < body.length && body[i] !== ';') {
      if (body[i] === '\\') i++;
      i++;
    }
    i++; // pula o ';'
  }

  return '';
}

function parseWifiQR(raw) {
  let ssid = '';
  let password = '';

  if (raw.startsWith('WIFI:')) {
    ssid = getWifiField(raw, 'S');
    password = getWifiField(raw, 'P');
  } else {
    const parts = raw.trim().split(' ');
    ssid = parts[0] || '';
    password = parts[1] || '';
  }

  return { ssid, password };
}

export default function ScannerScreen({ navigation }) {
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  // Pede a permissão automaticamente só na primeira vez (status "undetermined").
  // Se o usuário negar, mostramos os botões em vez de insistir com novos pedidos.
  useEffect(() => {
    if (permission && permission.status === 'undetermined' && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission?.status]);

  // Ao voltar das configurações do sistema, apenas RELÊ o status (sem abrir novo pedido)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        getPermission();
      }
    });
    return () => sub.remove();
  }, []);

  // Ao voltar da tela de senha, libera o scanner para ler outro QR Code
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => setScanned(false));
    return unsubscribe;
  }, [navigation]);

  function handleBarCodeScanned({ data }) {
    if (scanned) return;
    const result = parseWifiQR(data);

    if (!result.ssid) {
      Alert.alert('Erro', 'QR Code inválido');
      return;
    }

    setScanned(true);
    navigation.navigate('Password', {
      ssid: result.ssid,
      password: result.password,
    });
  }

  // Ainda carregando o status da permissão
  if (!permission) {
    return (
      <View style={globalStyles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: COLORS.text, fontSize: 18 }}>Solicitando câmera...</Text>
        </View>
      </View>
    );
  }

  // Permissão não concedida: mostra opções em vez de tela preta
  if (!permission.granted) {
    return (
      <View style={globalStyles.container}>
        <View style={{ flex: 1, justifyContent: 'center', padding: SPACING.xl }}>
          <Text style={globalStyles.titleSmall}>ESCANEAR WiFi</Text>

          <View style={globalStyles.card}>
            <Text style={[globalStyles.sectionTitle, { textAlign: 'center' }]}>
              Câmera necessária
            </Text>
            <Text style={[globalStyles.sectionSubtitle, { textAlign: 'center' }]}>
              {permission.canAskAgain
                ? 'Precisamos da câmera para ler o QR Code da rede WiFi.'
                : 'A permissão da câmera foi negada. Ative-a nas configurações do aplicativo para escanear QR Codes.'}
            </Text>

            {permission.canAskAgain ? (
              <TouchableOpacity style={globalStyles.buttonSuccess} onPress={requestPermission}>
                <Text style={globalStyles.buttonText}>PERMITIR CÂMERA</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={globalStyles.buttonSuccess}
                onPress={() => Linking.openSettings()}
              >
                <Text style={globalStyles.buttonText}>ABRIR CONFIGURAÇÕES</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={globalStyles.buttonPrimary}
            onPress={() => navigation.navigate('Password')}
          >
            <Text style={globalStyles.buttonText}>INSERIR MANUALMENTE</Text>
          </TouchableOpacity>

          <TouchableOpacity style={globalStyles.button} onPress={() => navigation.goBack()}>
            <Text style={globalStyles.buttonText}>VOLTAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Permissão concedida: mostra a câmera
  return (
    <View style={globalStyles.container}>
      <View style={{ flex: 1, justifyContent: 'center', padding: SPACING.xl }}>
        <Text style={[globalStyles.titleSmall, { marginBottom: SPACING.xxl }]}>
          ESCANEAR WiFi
        </Text>

        <View
          style={{
            height: 400,
            overflow: 'hidden',
            borderRadius: BORDER_RADIUS.xxl,
            borderWidth: 2,
            borderColor: COLORS.border,
            marginBottom: SPACING.xxl,
          }}
        >
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
        </View>

        <TouchableOpacity
          style={globalStyles.buttonPrimary}
          onPress={() => navigation.navigate('Password')}
        >
          <Text style={globalStyles.buttonText}>INSERIR MANUALMENTE</Text>
        </TouchableOpacity>

        <TouchableOpacity style={globalStyles.button} onPress={() => navigation.goBack()}>
          <Text style={globalStyles.buttonText}>VOLTAR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
