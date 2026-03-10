/**
 * Code.gs — Google Apps Script Backend para CMS Docs PWA
 * ─────────────────────────────────────────────────────────
 * Expõe uma WebApp que responde a requisições GET do PWA.
 * Ações disponíveis (parâmetro ?action=...):
 *
 *   login            — Autentica um conselheiro
 *   getConselheiros  — Lista nomes para o select do login
 *   getDocumentos    — Retorna documentos ativos
 *   getCategorias    — Retorna tipos/categorias dinâmicas
 *   getConfig        — Retorna configurações da aba CONFIG
 *
 * IMPLANTAÇÃO:
 *  1. Abra o script em script.google.com
 *  2. Implante como WebApp
 *  3. Execute como: "Eu mesmo"
 *  4. Quem tem acesso: "Qualquer pessoa, mesmo anônimos"
 *  5. Copie a URL gerada para config.js → CONFIG.API.GAS_URL
 *
 * Secretaria Executiva CMS-MOC | Versão 1.0
 */

// ── ID da planilha principal ──────────────────────────────────
const SHEET_ID = '1_6uxp2YjjmOKa5xkyc_l4jnVpCCex-M1GaXVSTn3HAM';

// ── Nome das abas ─────────────────────────────────────────────
const ABA = {
  CONSELHEIROS: 'CONSELHEIROS',
  DOCUMENTOS:   'DOCUMENTOS',
  CONFIG:       'CONFIG',
  CATEGORIAS:   'CATEGORIAS',
};

// ── Índices das colunas (0-based) — CONSELHEIROS ──────────────
const COL_C = {
  ID:       0,
  SEGMENTO: 1,
  ENTIDADE: 2,
  CADEIRA:  3,
  NOME:     4,
  TELEFONE: 5,
  EMAIL:    6,
  RG:       7,
  CPF:      8,
  ENDERECO: 9,
  STATUS:   10,
  SENHA:    11,
};

// ── Índices das colunas (0-based) — DOCUMENTOS ───────────────
const COL_D = {
  ID:        0,
  TITULO:    1,
  TIPO:      2,
  ANO:       3,
  DATA:      4,
  DESCRICAO: 5,
  LINK:      6,
  STATUS:    7,
};

// ══════════════════════════════════════════════════════════════
// PONTO DE ENTRADA — doGet
// ══════════════════════════════════════════════════════════════

function doGet(e) {
  const params = e.parameter || {};
  const action = params.action || '';

  let result;

  try {
    switch (action) {
      case 'login':
        result = handleLogin(params);
        break;
      case 'getConselheiros':
        result = handleGetConselheiros();
        break;
      case 'getDocumentos':
        result = handleGetDocumentos();
        break;
      case 'getCategorias':
        result = handleGetCategorias();
        break;
      case 'getConfig':
        result = handleGetConfig();
        break;
      default:
        result = _err('Ação inválida ou não especificada.');
    }
  } catch (err) {
    Logger.log('[ERRO] ' + err.message);
    result = _err('Erro interno no servidor: ' + err.message);
  }

  return _respond(result);
}

// ══════════════════════════════════════════════════════════════
// HANDLERS
// ══════════════════════════════════════════════════════════════

/**
 * handleLogin — Valida credenciais de um conselheiro.
 * Verifica NOME (case-insensitive) + SENHA + STATUS = ativo
 */
function handleLogin(params) {
  const nome  = (params.nome  || '').trim().toLowerCase();
  const senha = (params.senha || '').trim();

  if (!nome || !senha) {
    return _err('Nome e senha são obrigatórios.');
  }

  const sheet = _getSheet(ABA.CONSELHEIROS);
  const rows  = sheet.getDataRange().getValues();

  // Começa em 1 para pular cabeçalho
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const nomeRow   = String(row[COL_C.NOME]   || '').trim().toLowerCase();
    const senhaRow  = String(row[COL_C.SENHA]  || '').trim();
    const statusRow = String(row[COL_C.STATUS] || '').trim().toLowerCase();

    if (nomeRow === nome && senhaRow === senha) {
      if (statusRow !== 'ativo') {
        return _err('Seu cadastro está inativo. Contate a Secretaria Executiva.');
      }

      return {
        success: true,
        user: {
          id:       String(row[COL_C.ID]       || ''),
          nome:     String(row[COL_C.NOME]     || ''),
          segmento: String(row[COL_C.SEGMENTO] || ''),
          entidade: String(row[COL_C.ENTIDADE] || ''),
          cadeira:  String(row[COL_C.CADEIRA]  || ''),
          email:    String(row[COL_C.EMAIL]    || ''),
        },
      };
    }
  }

  return _err('Nome ou senha incorretos. Verifique suas credenciais.');
}

/**
 * handleGetConselheiros — Retorna lista de nomes ativos para o select do login.
 */
function handleGetConselheiros() {
  const sheet = _getSheet(ABA.CONSELHEIROS);
  const rows  = sheet.getDataRange().getValues();
  const list  = [];

  for (let i = 1; i < rows.length; i++) {
    const row    = rows[i];
    const status = String(row[COL_C.STATUS] || '').trim().toLowerCase();
    if (status !== 'ativo') continue;

    const nome = String(row[COL_C.NOME] || '').trim();
    if (!nome) continue;

    list.push({
      id:       String(row[COL_C.ID]       || ''),
      nome:     nome,
      segmento: String(row[COL_C.SEGMENTO] || ''),
      entidade: String(row[COL_C.ENTIDADE] || ''),
    });
  }

  return { success: true, conselheiros: list };
}

/**
 * handleGetDocumentos — Retorna todos os documentos com STATUS = ativo.
 */
function handleGetDocumentos() {
  const sheet = _getSheet(ABA.DOCUMENTOS);
  const rows  = sheet.getDataRange().getValues();
  const docs  = [];

  for (let i = 1; i < rows.length; i++) {
    const row    = rows[i];
    const status = String(row[COL_D.STATUS] || '').trim().toLowerCase();
    if (status !== 'ativo') continue;

    const titulo = String(row[COL_D.TITULO] || '').trim();
    if (!titulo) continue;

    // Formata data para ISO string se for objeto Date
    let data = row[COL_D.DATA];
    if (data instanceof Date) {
      data = Utilities.formatDate(data, 'America/Sao_Paulo', 'yyyy-MM-dd');
    } else {
      data = String(data || '').trim();
    }

    docs.push({
      id:        String(row[COL_D.ID]        || ''),
      titulo:    titulo,
      tipo:      String(row[COL_D.TIPO]      || '').trim(),
      ano:       String(row[COL_D.ANO]       || '').trim(),
      data:      data,
      descricao: String(row[COL_D.DESCRICAO] || '').trim(),
      link:      String(row[COL_D.LINK]      || '').trim(),
      status:    'ativo',
    });
  }

  // Ordena por data decrescente (mais recente primeiro)
  docs.sort((a, b) => {
    const da = a.data || '0';
    const db = b.data || '0';
    return db.localeCompare(da);
  });

  return { success: true, documentos: docs };
}

/**
 * handleGetCategorias — Retorna tipos dinâmicos da aba CATEGORIAS.
 * Se a aba não existir, retorna as categorias padrão.
 */
function handleGetCategorias() {
  try {
    const sheet = _getSheet(ABA.CATEGORIAS);
    const rows  = sheet.getDataRange().getValues();
    const cats  = [];

    for (let i = 1; i < rows.length; i++) {
      const tipo  = String(rows[i][0] || '').trim();
      const badge = String(rows[i][1] || 'badge-gray').trim();
      const icon  = String(rows[i][2] || '📄').trim();
      if (tipo) cats.push({ tipo, badge, icon });
    }

    if (cats.length > 0) return { success: true, categorias: cats };

  } catch (e) {
    // Aba CATEGORIAS ainda não criada — retorna padrão
  }

  return {
    success: true,
    categorias: [
      { tipo: 'Portaria',          badge: 'badge-blue',   icon: '📋' },
      { tipo: 'Resolução',         badge: 'badge-navy',   icon: '⚖️' },
      { tipo: 'Memorando',         badge: 'badge-green',  icon: '📝' },
      { tipo: 'Ofício',            badge: 'badge-gray',   icon: '✉️' },
      { tipo: 'Edital',            badge: 'badge-yellow', icon: '📢' },
      { tipo: 'Documento Externo', badge: 'badge-gray',   icon: '📄' },
    ],
  };
}

/**
 * handleGetConfig — Retorna pares chave/valor da aba CONFIG.
 */
function handleGetConfig() {
  try {
    const sheet  = _getSheet(ABA.CONFIG);
    const rows   = sheet.getDataRange().getValues();
    const config = {};

    for (let i = 1; i < rows.length; i++) {
      const chave = String(rows[i][0] || '').trim();
      const valor = String(rows[i][1] || '').trim();
      if (chave) config[chave] = valor;
    }

    return { success: true, config };

  } catch (e) {
    return { success: true, config: {} };
  }
}

// ══════════════════════════════════════════════════════════════
// UTILITÁRIOS INTERNOS
// ══════════════════════════════════════════════════════════════

/**
 * _getSheet — Obtém uma aba pelo nome. Lança erro se não existir.
 */
function _getSheet(nome) {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(nome);
  if (!sheet) throw new Error(`Aba "${nome}" não encontrada na planilha.`);
  return sheet;
}

/**
 * _err — Cria objeto de erro padronizado.
 */
function _err(message) {
  return { success: false, message };
}

/**
 * _respond — Serializa a resposta como JSON com CORS.
 */
function _respond(data) {
  const json = JSON.stringify(data);
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
