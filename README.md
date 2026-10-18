<div align="center">
  <img src="assets/icon.png" alt="Auditoria de Senhas WiFi" width="140">

  # Auditoria de Senhas WiFi

  **Aplicativo mobile para auditar a segurança de senhas de redes WiFi, seguindo as diretrizes atuais do NIST e da OWASP.**

  <br>
  <img src="https://img.shields.io/badge/React_Native-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native">
  <img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/NIST_SP_800--63B--4-0B5394?style=for-the-badge" alt="NIST SP 800-63B-4">
  <img src="https://img.shields.io/badge/OWASP-000000?style=for-the-badge&logo=owasp&logoColor=white" alt="OWASP">
  <img src="https://img.shields.io/badge/Licen%C3%A7a-MIT-B266FF?style=for-the-badge" alt="Licença MIT">
</div>

---

## Sobre o projeto

Esse repositório é um aplicativo mobile que avalia **o quão forte é a senha de uma rede WiFi**. Você escaneia o QR Code da rede (ou digita a senha manualmente), e o app devolve uma pontuação de **-100 a 100**, o tempo estimado para quebrar a senha por força bruta e recomendações do que melhorar.

A ideia central é simples: a maioria das ferramentas de "força de senha" ainda cobra maiúscula, número e símbolo, regra que o NIST e a OWASP já abandonaram. Aqui a pontuação prioriza o que realmente importa: **comprimento, imprevisibilidade e não usar termos óbvios** (como o próprio nome da rede).

Além da auditoria, o app tem gerador de senhas seguras, histórico de relatórios, comparação entre redes, exportação em PDF/TXT/CSV, backup e restauração, tudo protegido por autenticação biométrica.

---

## Tecnologias utilizadas:

### React Native, Expo, JavaScript, React Navigation, Expo SecureStore, AsyncStorage.

> [!IMPORTANT]
> A pontuação do app é uma **métrica própria**, inspirada no NIST SP 800-63B-4 e na OWASP Authentication Cheat Sheet. Ela **não é uma certificação de conformidade** com nenhuma das duas.

> [!TIP]
> - **React Native + Expo:** base do app, com build e execução simples via Expo Go.
> - **React Navigation (native-stack):** navegação entre as 9 telas.
> - **expo-camera:** leitura do QR Code da rede WiFi.
> - **expo-local-authentication:** biometria (impressão digital / Face ID) com fallback para a senha do dispositivo.
> - **expo-secure-store:** guarda as senhas arquivadas no armazenamento seguro do sistema (Keychain no iOS, Keystore no Android).
> - **expo-crypto:** fonte de aleatoriedade criptográfica usada pelo gerador de senhas.
> - **AsyncStorage:** guarda os relatórios das auditorias (sem a senha em texto plano).
> - **expo-print / expo-sharing / expo-file-system:** geração e compartilhamento de PDF, TXT, CSV e backup.
> - **expo-network / expo-device:** coleta de dados do aparelho e da rede no teste de velocidade.

---

## Funcionalidades

| Recurso | O que faz |
|---|---|
| **Autenticação biométrica** | Obrigatória para abrir o app. Pode ser bloqueado manualmente a qualquer momento. |
| **Escanear QR Code** | Lê o padrão `WIFI:T:WPA;S:rede;P:senha;;`, respeitando caracteres escapados. |
| **Inserir manualmente** | Digita SSID e senha, com pré-visualização da pontuação em tempo real. |
| **Auditoria** | Pontuação de -100 a 100, detalhamento por critério, tempo de quebra e recomendações. |
| **Teste de velocidade** | Mede latência, download e upload (via Cloudflare) e dados do aparelho. |
| **Gerador de senhas** | Gera senhas com aleatoriedade criptográfica, de 15 a 48 caracteres. |
| **Senhas arquivadas** | Guarda senhas no armazenamento seguro do sistema, com copiar e excluir. |
| **Relatórios** | Histórico com busca, filtro por rede, gráfico de evolução e exportação em PDF/CSV. |
| **Comparar senhas** | Compara até 5 relatórios lado a lado e exporta em CSV. |
| **Backup e restauração** | Exporta e importa relatórios e senhas em JSON (formato versão 1.0), com validação. |
| **Proteção de tela** | Cobre o conteúdo quando o app vai para segundo plano. |

---

## Como a pontuação funciona

A nota soma 5 critérios, de **-100** (pior caso) a **100** (melhor caso):

| # | Critério | Pontos | Regra |
|---|---|---|---|
| 1 | Comprimento | +40 / -20 / -40 | 15+ caracteres: +40. De 8 a 14: -20. Menos de 8: -40. |
| 2 | Senhas comuns | +20 / -20 | Checa contra uma lista local de 30 senhas comuns, ignorando símbolos (`Senha@123` vira `senha123`). |
| 3 | Padrões previsíveis | +10 / -10 | Sequências numéricas, repetição de 3+ caracteres iguais e padrões de teclado (`qwerty`, `asdfgh`...). |
| 4 | Palavras comuns e nome da rede | +10 / -10 | Palavras de dicionário (4+ letras) e o próprio SSID dentro da senha. |
| 5 | Resistência a força bruta | +20 / -20 | Tempo estimado de pelo menos 1 ano **e** senha não previsível. |

**Faixas de status:**

| Pontuação | Status |
|---|---|
| 70 a 100 | SEGURA |
| 30 a 69 | MODERADA |
| -30 a 29 | FRACA |
| -100 a -31 | CRÍTICA |

> [!NOTE]
> **Por que não pontua maiúscula, número e símbolo?** O NIST SP 800-63B-4 e a OWASP desaconselham regras de composição: elas empurram o usuário para senhas previsíveis (`Senha@123`) e não aumentam a segurança tanto quanto o comprimento. Por isso o app só pontua o que realmente pesa.

**Por que 15 caracteres?** O NIST pede mínimo de 15 caracteres quando a senha é o único fator de autenticação (8 só com MFA). WiFi pessoal (WPA2/WPA3-Personal) não tem MFA, e a chave pode sofrer ataque offline, então o app usa o limite de 15. O limite do protocolo é de 63 caracteres (ou 64 dígitos hexadecimais).

**Tempo de quebra:** calculado pelo tamanho do conjunto de caracteres usado e pelo comprimento, assumindo **10 bilhões de tentativas por segundo** (uma GPU). Senhas previsíveis caem em ataque de dicionário muito antes do tempo teórico, e o app avisa isso no relatório.

---

## Arquitetura

```
                          ┌───────────────────┐
   Usuário ─ biometria ─▶ │    AuthScreen     │
                          └─────────┬─────────┘
                                    ▼
                          ┌───────────────────┐
                          │    HomeScreen     │
                          └─────────┬─────────┘
        ┌──────────┬────────────┬───┴────────┬────────────┬───────────┐
        ▼          ▼            ▼            ▼            ▼           ▼
    Scanner    Password     Generator     Compare      Reports      Backup
    (QR Code)  (manual)     (gerador)    (até 5)     (histórico)  (JSON v1.0)
        │          │            │            ▲            ▲
        └────┬─────┘            │            │            │
             ▼                  │            └────┬───────┘
        AttackScreen            │                 │
        (auditoria + PDF/TXT)   │          AsyncStorage ("reports")
             │                  │
             ▼                  ▼
        PasswordScore      SecureRandom ── expo-crypto
        (5 critérios)      SecurePasswordStore ── expo-secure-store
```

Toda a regra de pontuação fica isolada em `utils/PasswordScore.js`, sem depender de tela nenhuma. Isso facilita testar e ajustar os critérios sem mexer na interface.

---

## Estrutura de pastas

```
auditoria-senhas-wifi/
├── assets/
│   ├── icon.png
│   ├── adaptive-icon.png
│   ├── splash-icon.png
│   └── favicon.png
├── components/
│   └── ErrorBoundary.js
├── hooks/
│   └── useAuth.js
├── screens/
│   ├── AuthScreen.js
│   ├── HomeScreen.js
│   ├── ScannerScreen.js
│   ├── PasswordScreen.js
│   ├── AttackScreen.js
│   ├── ReportsScreen.js
│   ├── GeneratorScreen.js
│   ├── CompareScreen.js
│   └── BackupScreen.js
├── styles/
│   └── GlobalStyles.js
├── utils/
│   ├── PasswordScore.js
│   ├── PdfReport.js
│   ├── SecurePasswordStore.js
│   └── SecureRandom.js
├── .gitignore
├── App.js
├── LICENSE
├── README.md
├── app.json
├── index.js
├── package-lock.json
└── package.json
```

---

## Como executar

<div>
<details align="left">
    <summary>Clique para ver o passo a passo</summary>

1- Pré-requisitos

- [Node.js](https://nodejs.org/) (versão LTS)
- [Git](https://git-scm.com/)
- O app **Expo Go** no celular (Android ou iOS), compatível com o **Expo SDK 54 ou superior**. O projeto usa `expo-file-system/legacy`, que só existe a partir dessa versão.

2- Clonar o repositório

```
git clone https://github.com/Flavio-Frontera/auditoria-senhas-wifi.git
cd auditoria-senhas-wifi
```

3- Instalar as dependências

```
npm install
```

Se alguma dependência do Expo estiver faltando no seu `package.json`, instale todas de uma vez com o comando abaixo. O `expo install` escolhe automaticamente a versão compatível com o seu SDK:

```
npx expo install expo-camera expo-secure-store expo-local-authentication expo-crypto expo-clipboard expo-print expo-sharing expo-file-system expo-document-picker expo-network expo-device expo-splash-screen @react-native-async-storage/async-storage @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context
```

4- Iniciar o projeto

```
npx expo start
```

Se algo estranho aparecer (cache, assets antigos), limpe o cache:

```
npx expo start -c
```

5- Abrir no celular

Escaneie o QR Code que aparece no terminal com o app **Expo Go** (Android) ou com a câmera (iOS).

6- Configurar a biometria

Na primeira abertura, o app exige configurar a autenticação do aparelho. O celular precisa ter **sensor biométrico** (impressão digital ou reconhecimento facial) com uma digital ou rosto cadastrado, e a senha de tela serve como alternativa quando a biometria falha. Aparelhos sem hardware biométrico não conseguem abrir o app e veem a mensagem "Dispositivo não compatível".

</details>
</div>

> [!WARNING]
> **Câmera e biometria não funcionam em emulador de forma confiável.** Para testar o escaneamento de QR Code e a autenticação, use um aparelho físico.

---

## Segurança e privacidade

<div>
<details align="left">
    <summary>Clique para ver como os dados são tratados</summary>

- **Senhas arquivadas** ficam no `expo-secure-store`, que usa o Keychain (iOS) e o Keystore (Android).
- **Relatórios** ficam no `AsyncStorage` e guardam só a senha **mascarada** (`*****...`), nunca a senha completa.
- **O gerador** usa `expo-crypto` (aleatoriedade criptográfica) com *rejection sampling* para não ter viés na escolha dos caracteres, e embaralha o resultado final.
- **A tela de proteção** cobre o conteúdo quando o app vai para segundo plano, reduzindo a chance de a senha aparecer no seletor de apps.
- **A exportação em CSV** neutraliza células que começam com `=`, `+`, `-` ou `@`, evitando injeção de fórmula ao abrir no Excel.
- **O PDF** escapa todo o conteúdo antes de montar o HTML.
- **Nenhum dado sai do aparelho sem uma ação sua.** A única comunicação automática com a internet é o teste de velocidade, que faz requisições para `speed.cloudflare.com` e só roda se você confirmar manualmente que está conectado na rede testada. Exportar PDF, CSV ou backup abre o menu de compartilhamento do sistema, e quem decide o destino é você.

</details>
</div>

---

## Notas importantes

- O **backup em JSON contém as senhas em texto plano**, sem criptografia. O app avisa isso na exportação. Guarde o arquivo em local seguro e apague-o quando não precisar mais. **Nunca suba um backup para o GitHub**: o `.gitignore` do projeto já bloqueia o padrão `wifi_audit_backup_*.json`.
- A **biometria é uma trava de acesso ao app**. Ela não criptografa os dados por conta própria. A proteção das senhas arquivadas vem do `SecureStore` do sistema operacional.
- A checagem de senhas comuns usa uma **lista local reduzida (30 senhas)** e não consulta bases de vazamento. Uma senha pode passar nessa checagem e mesmo assim já ter vazado em algum lugar.
- O teste de velocidade consome cerca de **6 MB de dados** (4 MB de download e 2 MB de upload) e mede a velocidade até a internet, não somente o link WiFi local.
- A exportação de PDF grava o arquivo direto na pasta do app, porque o arquivo temporário do `expo-print` não pode ser lido nem compartilhado no Android/Expo Go.
- Se algum recurso de sistema parar de funcionar após mudar o nome ou o ícone, lembre que **ícone e splash só atualizam em um novo build**. O Expo Go não reflete essas mudanças.

---

## Ideias para o futuro

- [ ] Consultar bases de vazamento com k-anonymity (Have I Been Pwned), sem enviar a senha inteira
- [ ] Criptografar o backup com uma senha escolhida pelo usuário
- [ ] Ampliar a lista local de senhas comuns
- [ ] Testes automatizados para `PasswordScore.js`
- [ ] Modo claro
- [ ] Tradução para inglês

---

## Referências

- [NIST SP 800-63B-4: Digital Identity Guidelines, Authentication and Authenticator Management](https://pages.nist.gov/800-63-4/sp800-63b.html)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

## Autor

Desenvolvido por **Flávio**, estudante de Tecnologia em Redes de Computadores na FATEC Bauru, como projeto de auditoria de segurança em redes WiFi.

- GitHub: [@Flavio-Frontera](https://github.com/Flavio-Frontera)
- LinkedIn: [Flávio Batista Cavalcante](https://www.linkedin.com/in/fl%C3%A1vio-batista-cavalcante-348a121a4)

---

## Licença

Distribuído sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
