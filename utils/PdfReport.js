import { getScoreColor } from '../styles/GlobalStyles';

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildAuditPdfHtml(report) {
  const {
    ssid,
    date,
    score,
    status,
    passwordMasked,
    scoreDetails = [],
    crackTime,
    wifiStats,
    recommendations = [],
    rawContent, 
  } = report;

  const scoreDetailsHTML = scoreDetails.map(d => {
    const pointsColor = d.points > 0 ? '#88FF88' : '#FF8888';
    const pointsText = d.points > 0 ? `+${d.points}` : `${d.points}`;
    return `
    <tr style="border-bottom: 1px solid #444;">
      <td style="padding: 12px; color: #fff; border-right: 1px solid #444;">${escapeHtml(d.criterion)}</td>
      <td style="padding: 12px; color: #aaa; border-right: 1px solid #444;">${escapeHtml(d.requirement)}</td>
      <td style="padding: 12px; color: #ddd; border-right: 1px solid #444;">${escapeHtml(d.found)}</td>
      <td style="padding: 12px; color: ${pointsColor}; text-align: center; font-weight: bold;">${pointsText}</td>
    </tr>
  `}).join('');

  const recsHTML = recommendations.map(r => `<li style="color: #ccc; margin-bottom: 8px;">${escapeHtml(r)}</li>`).join('');

  const wifiStatsHTML = wifiStats ? `
    <h2>ESTATÍSTICAS DA REDE WiFi</h2>
    <div style="background-color: #0D001A; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
      <div class="info-row"><span class="info-label">Tipo de conexão:</span><span class="info-value"> ${escapeHtml(wifiStats.connectionType)}</span></div>
      <div class="info-row"><span class="info-label">IP local:</span><span class="info-value"> ${escapeHtml(wifiStats.localIp)}</span></div>
      <div class="info-row"><span class="info-label">Latência:</span><span class="info-value"> ${wifiStats.latencyMs} ms</span></div>
      <div class="info-row"><span class="info-label">Download:</span><span class="info-value"> ${wifiStats.downloadMbps} Mbps</span></div>
      <div class="info-row"><span class="info-label">Upload:</span><span class="info-value"> ${wifiStats.uploadMbps} Mbps</span></div>
      <div class="info-row"><span class="info-label">Dispositivo de teste:</span><span class="info-value"> ${escapeHtml(wifiStats.deviceManufacturer)} ${escapeHtml(wifiStats.deviceModel)}</span></div>
      <div class="info-row"><span class="info-label">Sistema:</span><span class="info-value"> ${escapeHtml(wifiStats.osVersion)}</span></div>
      <div class="info-row"><span class="info-label">Medido em:</span><span class="info-value"> ${escapeHtml(wifiStats.measuredAt)}</span></div>
      <div style="color:#666; font-size: 11px; margin-top: 10px;">* Medido no dispositivo com confirmação manual de que estava conectado à rede testada. A velocidade reflete o link até a internet no momento do teste, não apenas o WiFi local.</div>
    </div>
  ` : '';

  const crackHTML = crackTime ? `
    <h2>RESISTÊNCIA A ATAQUES</h2>
    <div style="background-color: #0D001A; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
      <div style="font-size: 28px; font-weight: bold; color: ${getScoreColor(score)}">${escapeHtml(crackTime.label)}</div>
      <div style="color: #888; margin-top: 5px;">Tempo estimado para quebra por força bruta (GPU ~10 bilhões tentativas/segundo)</div>
    </div>
  ` : '';

  const passwordRowHTML = passwordMasked ? `
    <div class="info-row">
      <span class="info-label">Senha analisada:</span>
      <span class="info-value"> ${escapeHtml(passwordMasked)}</span>
    </div>
  ` : '';

  const scoreTableHTML = scoreDetails.length > 0 ? `
    <h2>DETALHES DA PONTUAÇÃO</h2>
    <table>
      <thead>
        <tr>
          <th>Critério</th>
          <th>Requisito (NIST / OWASP)</th>
          <th>Encontrado</th>
          <th>Pontos</th>
        </tr>
      </thead>
      <tbody>
        ${scoreDetailsHTML}
      </tbody>
    </table>
  ` : '';

  const recsBlockHTML = recommendations.length > 0 ? `
    <h2>RECOMENDAÇÕES (NIST / OWASP)</h2>
    <div class="recommendations">
      <ul style="list-style-type: none; padding-left: 0;">
        ${recsHTML}
      </ul>
    </div>
  ` : '';

  const rawContentHTML = (!scoreDetails.length && rawContent) ? `
    <h2>RELATÓRIO COMPLETO</h2>
    <div style="background-color: #0D001A; border-radius: 8px; padding: 15px; white-space: pre-wrap; font-size: 12px; color: #ddd; line-height: 1.6;">${escapeHtml(rawContent)}</div>
  ` : '';

  const referencesHTML = `
    <h2>METODOLOGIA E REFERÊNCIAS</h2>
    <div style="background-color: #0D001A; border-radius: 8px; padding: 15px; margin-bottom: 20px; color: #aaa; font-size: 12px; line-height: 1.6;">
      <p>A pontuação é uma métrica própria do aplicativo, inspirada nas diretrizes abaixo. Não é uma certificação de conformidade.</p>
      <p style="margin-top: 8px;">• NIST SP 800-63B-4, Digital Identity Guidelines: Authentication and Authenticator Management (2025): mínimo de 15 caracteres quando a senha é o único fator (8 com MFA), sem regras de composição e com verificação contra listas de senhas comuns ou comprometidas.</p>
      <p style="margin-top: 8px;">• OWASP Authentication Cheat Sheet: priorizar o comprimento, permitir senhas longas, não impor regras de composição e bloquear senhas comuns ou já vazadas.</p>
      <p style="margin-top: 8px;">• A verificação de senhas comuns usa uma lista local reduzida e não consulta bases de vazamentos.</p>
    </div>
  `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Relatório de Auditoria WiFi - ${escapeHtml(ssid)}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', Courier, monospace;
          background-color: #02010A;
          padding: 20px;
        }
        .container {
          max-width: 100%;
          background-color: #090014;
          border: 2px solid #7B2CFF;
          border-radius: 16px;
          padding: 20px;
        }
        h1 { color: #B266FF; font-size: 28px; text-align: center; margin-bottom: 10px; }
        h2 { color: #B266FF; font-size: 20px; margin-top: 20px; margin-bottom: 15px; border-left: 4px solid #7B2CFF; padding-left: 12px; }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #7B2CFF; }
        .score-card {
          text-align: center;
          padding: 20px;
          background: linear-gradient(135deg, #12002E, #02010A);
          border-radius: 12px;
          margin-bottom: 20px;
        }
        .score-number { font-size: 48px; font-weight: bold; color: ${getScoreColor(score)}; }
        .score-label { color: #888; font-size: 14px; }
        .status { font-size: 24px; font-weight: bold; color: ${getScoreColor(score)}; margin-top: 10px; }
        .info-row { margin-bottom: 8px; }
        .info-label { color: #00A3FF; font-weight: bold; }
        .info-value { color: #fff; }
        table {
          width: 100%;
          border-collapse: collapse;
          background-color: #0D001A;
          border: 1px solid #444;
          font-size: 12px;
        }
        th {
          background-color: #7B2CFF;
          color: #fff;
          padding: 12px;
          text-align: left;
        }
        td {
          padding: 12px;
        }
        .recommendations {
          background-color: #0D001A;
          border-radius: 8px;
          padding: 15px;
          margin-top: 20px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          text-align: center;
          border-top: 1px solid #444;
          color: #555;
          font-size: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>AUDITORIA DE SEGURANÇA WiFi</h1>
          <p style="color: #666;">Baseado em NIST SP 800-63B-4 e OWASP Authentication Cheat Sheet</p>
        </div>

        <div class="score-card">
          <div class="score-number">${score}/100</div>
          <div class="score-label">PONTUAÇÃO GERAL</div>
          <div class="status">${escapeHtml(status)}</div>
        </div>

        <div class="info-row">
          <span class="info-label">Rede:</span>
          <span class="info-value"> ${escapeHtml(ssid)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Data:</span>
          <span class="info-value"> ${escapeHtml(date)}</span>
        </div>
        ${passwordRowHTML}

        ${scoreTableHTML}

        ${crackHTML}

        ${wifiStatsHTML}

        ${recsBlockHTML}

        ${rawContentHTML}

        ${referencesHTML}

        <div class="footer">
          <p>Relatório gerado por Auditoria de Senhas WiFi</p>
          <p>Inspirado em NIST SP 800-63B-4 e OWASP Authentication Cheat Sheet</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
