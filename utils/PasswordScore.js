// Pontuação de senhas WiFi.
//
// Referências (inspiração, não certificação de conformidade):
//  - NIST SP 800-63B-4 (2025): mínimo de 15 caracteres quando a senha é o único
//    fator (8 com MFA), SEM regras de composição, e checagem contra listas de
//    senhas comuns/comprometidas e termos do contexto (ex.: nome do serviço).
//  - OWASP Authentication Cheat Sheet: priorizar comprimento, permitir senhas
//    longas, sem regras de composição, bloquear senhas comuns ou vazadas.
//
// WiFi pessoal (WPA2/WPA3-Personal) não tem MFA e a chave pode sofrer ataque
// offline, por isso o mínimo usado é o de 15 caracteres. O limite do protocolo
// é de 63 caracteres (ou 64 dígitos hexadecimais).

const COMMON_PASSWORDS = [
  'password', 'senha', '123456', '12345678', '1234567890',
  'qwerty', 'abc123', 'password1', 'iloveyou', 'admin',
  'letmein', 'welcome', 'monkey', 'dragon', 'master',
  'login', 'pass', 'test', 'guest', 'wifi',
  '111111', '000000', '123123', '654321', '112233',
  'password123', 'senha123', 'admin123', 'root', 'toor',
];

const KEYBOARD_PATTERNS = [
  'qwerty', 'qwertyuiop', 'asdfgh', 'asdfghjkl',
  'zxcvbn', 'zxcvbnm', '1qaz2wsx', '1q2w3e4r',
  'qazwsx', 'qweasd', 'abcdef', 'abcdefgh',
];

const DICTIONARY_WORDS = [
  'love', 'amor', 'casa', 'home', 'name', 'nome',
  'time', 'game', 'play', 'work', 'life', 'live',
  'blue', 'azul', 'verde', 'green', 'red', 'vermelho',
  'brasil', 'brazil', 'rio', 'sao', 'paulo',
  'jesus', 'deus', 'god', 'angel', 'anjo',
  'summer', 'winter', 'verao', 'inverno',
  'hello', 'ola', 'bye', 'tchau', 'ok',
];

export const MIN_LENGTH_SINGLE_FACTOR = 15;
export const MIN_LENGTH_WITH_MFA = 8;
export const MAX_WIFI_PSK_LENGTH = 63;

export function checkCommonPassword(password) {
  const lower = password.toLowerCase();
  // Versão sem símbolos/espaços: "Senha@123" vira "senha123".
  const stripped = lower.replace(/[^a-z0-9]/g, '');
  // Entradas curtas só valem como senha inteira (evita falso positivo
  // em "Compass..." por causa de "pass").
  return COMMON_PASSWORDS.some(p =>
    lower === p || stripped === p || (p.length >= 6 && (lower.includes(p) || stripped.includes(p)))
  );
}

export function checkKeyboardPattern(password) {
  const lower = password.toLowerCase();
  return KEYBOARD_PATTERNS.some(pattern => lower.includes(pattern));
}

export function checkDictionaryWords(password) {
  const lower = password.toLowerCase();
  // Palavras de 1 a 3 letras casam por acaso em senhas aleatórias; ignoradas.
  return DICTIONARY_WORDS.filter(word => word.length >= 4 && lower.includes(word));
}

// NIST: a lista de bloqueio deve incluir termos do contexto (aqui, o nome da rede).
export function checkContainsSsid(password, ssid) {
  const name = (ssid || '').trim().toLowerCase();
  if (name.length < 3) return false;
  return password.toLowerCase().includes(name);
}

// Repetição de 3 ou mais caracteres iguais seguidos (ex.: "aaa", "111").
export function checkRepeatedChars(password) {
  return /(.)\1{2,}/.test(password);
}

export function checkSequentialNumbers(password) {
  const seqs = ['0123456789', '9876543210'];
  return seqs.some(seq => {
    for (let i = 0; i <= seq.length - 3; i++) {
      if (password.includes(seq.slice(i, i + 3))) return true;
    }
    return false;
  });
}

export function estimateCrackTime(password) {
  let charsetSize = 0;
  if (/[a-z]/.test(password)) charsetSize += 26;
  if (/[A-Z]/.test(password)) charsetSize += 26;
  if (/[0-9]/.test(password)) charsetSize += 10;
  if (/[^A-Za-z0-9]/.test(password)) charsetSize += 32;

  if (charsetSize === 0) charsetSize = 10;

  const combinations = Math.pow(charsetSize, password.length);
  const attemptsPerSecond = 1e10;
  const seconds = combinations / attemptsPerSecond;

  if (seconds < 1) return { label: 'Instantaneo', level: 'critical' };
  if (seconds < 60) return { label: `${Math.round(seconds)} segundos`, level: 'critical' };
  if (seconds < 3600) return { label: `${Math.round(seconds / 60)} minutos`, level: 'bad' };
  if (seconds < 86400) return { label: `${Math.round(seconds / 3600)} horas`, level: 'bad' };
  if (seconds < 2592000) return { label: `${Math.round(seconds / 86400)} dias`, level: 'moderate' };
  if (seconds < 31536000) return { label: `${Math.round(seconds / 2592000)} meses`, level: 'moderate' };
  if (seconds < 3153600000) return { label: `${Math.round(seconds / 31536000)} anos`, level: 'good' };
  return { label: 'Seculos', level: 'good' };
}

function addDetail(details, criterion, requirement, found, points) {
  details.push({ criterion, requirement, found, points });
  return points;
}

// Critérios (soma máxima = 100, mínima = -100):
//  1. Comprimento ............................ 40
//  2. Senhas comuns / lista de bloqueio ...... 20
//  3. Padrões previsíveis .................... 10
//  4. Palavras comuns e nome da rede ......... 10
//  5. Resistência a força bruta .............. 20
//
// Não há pontos por maiúscula/minúscula/número/símbolo: NIST SP 800-63B-4 e
// OWASP desaconselham regras de composição.
export function scorePassword(password, context = {}) {
  const details = [];
  let score = 0;

  // 1. Comprimento
  const len = password.length;
  const lengthRequirement = 'Mínimo de 15 caracteres (NIST SP 800-63B-4 e OWASP; WiFi não tem MFA)';
  const overLimitNote = len > MAX_WIFI_PSK_LENGTH ? ' — acima do limite de 63 do WPA2/WPA3' : '';
  if (len >= MIN_LENGTH_SINGLE_FACTOR) {
    score += addDetail(details, 'Comprimento da senha', lengthRequirement,
      `${len} caracteres (atende)${overLimitNote}`, 40);
  } else if (len >= MIN_LENGTH_WITH_MFA) {
    score += addDetail(details, 'Comprimento da senha', lengthRequirement,
      `${len} caracteres (abaixo de 15; 8 só seria aceitável com MFA)`, -20);
  } else {
    score += addDetail(details, 'Comprimento da senha', lengthRequirement,
      `${len} caracteres (abaixo do mínimo de 8 do WPA2/WPA3)`, -40);
  }

  // 2. Senhas comuns (lista de bloqueio local)
  const isCommon = checkCommonPassword(password);
  score += addDetail(details, 'Senhas comuns (lista de bloqueio)',
    'Não constar em lista de senhas comuns ou vazadas (NIST: blocklist)',
    isCommon ? 'Senha comum ou previsível' : 'Não encontrada na lista local (30 senhas comuns)',
    isCommon ? -20 : 20);

  // 3. Padrões previsíveis
  const patterns = [];
  const hasKeyboard = checkKeyboardPattern(password);
  if (hasKeyboard) patterns.push('teclado');
  if (checkSequentialNumbers(password)) patterns.push('sequência numérica');
  if (checkRepeatedChars(password)) patterns.push('repetição');
  score += addDetail(details, 'Padrões previsíveis',
    'Evitar sequências, repetições e padrões de teclado (NIST: blocklist)',
    patterns.length ? `Detectado: ${patterns.join(', ')}` : 'Nenhum padrão previsível',
    patterns.length ? -10 : 10);

  // 4. Palavras comuns e termos do contexto (nome da rede)
  const dictionaryMatches = checkDictionaryWords(password);
  const containsSsid = checkContainsSsid(password, context.ssid);
  const contextHits = [];
  if (containsSsid) contextHits.push('nome da rede');
  contextHits.push(...dictionaryMatches.slice(0, 2));
  score += addDetail(details, 'Palavras comuns e nome da rede',
    'Evitar palavras comuns e termos do contexto, como o nome da rede (NIST)',
    contextHits.length ? `Encontrado: ${contextHits.join(', ')}` : 'Nenhuma palavra comum encontrada',
    contextHits.length ? -10 : 10);

  // 5. Resistência a força bruta
  // Senhas previsíveis caem em ataque de dicionário muito antes do tempo teórico.
  const crackTime = estimateCrackTime(password);
  const predictable = isCommon || hasKeyboard;
  const resistant = crackTime.level === 'good' && !predictable;
  score += addDetail(details, 'Resistência a força bruta',
    'Tempo de quebra deve ser de pelo menos 1 ano',
    predictable ? `${crackTime.label} (teórico; senha previsível cai em ataque de dicionário)` : crackTime.label,
    resistant ? 20 : -20);

  if (score < -100) score = -100;
  if (score > 100) score = 100;

  return { score, details, crackTime, dictionaryMatches, containsSsid };
}

export function getPasswordRecommendations(password, dictionaryMatches = [], context = {}) {
  const recs = [];

  if (password.length < MIN_LENGTH_SINGLE_FACTOR) {
    recs.push('- Use pelo menos 15 caracteres (NIST SP 800-63B-4 e OWASP, quando não há MFA). Prefira uma frase longa e fácil de lembrar');
  }
  if (password.length > MAX_WIFI_PSK_LENGTH) {
    recs.push('- WPA2/WPA3 aceita no máximo 63 caracteres (ou 64 dígitos hexadecimais)');
  }
  if (checkCommonPassword(password)) recs.push('- Evite senhas comuns ou já vazadas');
  if (checkKeyboardPattern(password)) recs.push('- Evite padrões de teclado como qwerty');
  if (checkRepeatedChars(password)) recs.push('- Evite repetir o mesmo caractere várias vezes seguidas');
  if (checkSequentialNumbers(password)) recs.push('- Evite sequências numéricas como 123');
  if (checkContainsSsid(password, context.ssid)) recs.push('- Não use o nome da rede dentro da senha');
  if (dictionaryMatches.length > 0) recs.push('- Evite palavras comuns do dicionário');

  if (recs.length === 0) {
    recs.push('- Senha atende aos critérios avaliados');
    recs.push('- Prefira frases longas e aleatórias; não é necessário forçar símbolos ou maiúsculas (NIST e OWASP)');
    recs.push('- Troque a senha apenas se houver suspeita de comprometimento (NIST e OWASP desaconselham troca periódica)');
    recs.push('- Use WPA3-Personal (ou WPA2 com AES) no roteador, se disponível');
  }
  return recs;
}
