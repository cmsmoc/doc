/**
 * Code.gs — CMS Docs PWA | Backend Google Apps Script
 * ═══════════════════════════════════════════════════════
 * Versão 2.0 — Arquitetura completa
 *
 * MÓDULOS IMPLEMENTADOS:
 *   ✅ Autenticação + perfis (publico, diretoria, presidente, secretaria, admin)
 *   ✅ Documentos com destaque, mídia e acesso individual
 *   ✅ Avisos (popup, banner, login)
 *   ✅ Log de acessos
 *   ✅ Troca de senha
 *   ✅ Meus Documentos (por conselheiro)
 *   ✅ Atas + aprovação por presentes
 *   ✅ Reuniões + presenças
 *   ✅ Solicitações com protocolo + e-mail
 *   ✅ Home configurável
 *
 * MÓDULOS PREPARADOS (estrutura pronta, handler básico):
 *   🔲 Votações
 *   🔲 Calendário de eventos
 *   🔲 Comissões e Câmaras Técnicas
 *   🔲 Notificações push (OneSignal — chave configurável)
 *   🔲 Portal público
 *   🔲 WhatsApp (Evolution API — endpoint configurável)
 *
 * Secretaria Executiva CMS-MOC | 2025
 */

// ══════════════════════════════════════════════════════════════
// CONFIGURAÇÃO CENTRAL
// ══════════════════════════════════════════════════════════════

const SHEET_ID = '1_6uxp2YjjmOKa5xkyc_l4jnVpCCex-M1GaXVSTn3HAM';

const ABA = {
  CONSELHEIROS:    'CONSELHEIROS',
  DOCUMENTOS:      'DOCUMENTOS',
  AVISOS:          'AVISOS',
  ATAS:            'ATAS',
  REUNIOES:        'REUNIOES',
  PRESENCAS:       'PRESENCAS',
  ATA_APROVACOES:  'ATA_APROVACOES',
  SOLICITACOES:    'SOLICITACOES',
  MEU_DOCS:        'MEU_DOCS',
  LOG:             'LOG',
  CONFIG:          'CONFIG',
  CATEGORIAS:      'CATEGORIAS',
  // Preparados
  VOTACOES:        'VOTACOES',
  VOTOS:           'VOTOS',
  EVENTOS:         'EVENTOS',
  COMISSOES:       'COMISSOES',
  COMISSAO_MEMBROS:'COMISSAO_MEMBROS',
};

// Colunas CONSELHEIROS (0-based)
const CC = {
  ID:0, SEGMENTO:1, ENTIDADE:2, CADEIRA:3, NOME:4,
  TELEFONE:5, EMAIL:6, RG:7, CPF:8, ENDERECO:9,
  STATUS:10, SENHA:11, PERFIL:12,
};

// Colunas DOCUMENTOS (0-based)
const CD = {
  ID:0, TITULO:1, TIPO:2, ANO:3, DATA:4,
  DESCRICAO:5, LINK:6, STATUS:7, ACESSO:8,
  DESTAQUE:9, MIDIA:10,
};

// Colunas AVISOS (0-based)
const CA = {
  ID:0, TITULO:1, TEXTO:2, DATA_INICIO:3, DATA_FIM:4,
  PERFIL:5, TIPO:6, STATUS:7, COR:8,
};

// Colunas ATAS (0-based)
const CAT = {
  ID:0, ID_REUNIAO:1, NUMERO:2, DATA:3, TIPO:4,
  LINK_PDF:5, LINK_VIDEO:6, STATUS:7, ACESSO:8,
  APROVACAO_ATIVA:9,
};

// Colunas REUNIOES (0-based)
const CR = {
  ID:0, TITULO:1, DATA:2, HORA:3, LOCAL:4,
  TIPO:5, DESCRICAO:6, STATUS:7,
};

// Colunas PRESENCAS (0-based)
const CP = {
  ID:0, ID_REUNIAO:1, ID_CONS:2, NOME:3,
  PRESENTE:4, JUSTIFICATIVA:5,
};

// Colunas ATA_APROVACOES (0-based)
const CAP = {
  ID:0, ID_ATA:1, ID_CONS:2, NOME:3,
  STATUS:4, TIMESTAMP:5,
};

// Colunas SOLICITACOES (0-based)
const CS = {
  ID:0, PROTOCOLO:1, ID_CONS:2, NOME_CONS:3,
  TIPO:4, ASSUNTO:5, DESCRICAO:6,
  STATUS:7, DATA:8, RESPOSTA:9, DATA_RESPOSTA:10,
};

// Colunas MEU_DOCS (0-based)
const CM = {
  ID:0, ID_CONS:1, NOME_CONS:2, TITULO:3,
  TIPO:4, ANO:5, LINK:6, STATUS:7,
};

// Colunas LOG (0-based)
const CL = {
  ID:0, TIMESTAMP:1, ID_CONS:2, NOME:3,
  ACAO:4, DETALHES:5,
};

// Emails da Diretoria (para notificações de solicitações)
const EMAIL_DIRETORIA = []; // Preencher: ['email1@...', 'email2@...']
const EMAIL_SECRETARIA = '';  // Preencher: 'secretaria@cmsmoc...'

// ══════════════════════════════════════════════════════════════
// MENU CUSTOMIZADO
// ══════════════════════════════════════════════════════════════

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('⚙️ CMS Docs Admin')
    .addItem('📊 Painel de Administração', 'abrirPainelAdmin')
    .addSeparator()
    .addItem('📄 Novo Documento',     'abrirFormDocumento')
    .addItem('📢 Novo Aviso',         'abrirFormAviso')
    .addItem('👤 Novo Conselheiro',   'abrirFormConselheiro')
    .addSeparator()
    .addItem('🔧 Setup / Atualizar Planilha', 'runSetup')
    .addItem('✅ Verificar Estrutura',         'verificarEstrutura')
    .toUi();
}

function abrirPainelAdmin() {
  const html = HtmlService.createHtmlOutputFromFile('Painel')
    .setWidth(960).setHeight(680);
  SpreadsheetApp.getUi().showModalDialog(html, '⚙️ Painel Admin — CMS-MOC');
}

function abrirFormDocumento() {
  const html = HtmlService.createHtmlOutputFromFile('FormDocumento')
    .setWidth(620).setHeight(560);
  SpreadsheetApp.getUi().showModalDialog(html, '📄 Novo Documento');
}

function abrirFormAviso() {
  const html = HtmlService.createHtmlOutputFromFile('FormAviso')
    .setWidth(560).setHeight(440);
  SpreadsheetApp.getUi().showModalDialog(html, '📢 Novo Aviso');
}

function abrirFormConselheiro() {
  const html = HtmlService.createHtmlOutputFromFile('FormConselheiro')
    .setWidth(620).setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(html, '👤 Novo Conselheiro');
}

// ══════════════════════════════════════════════════════════════
// PONTO DE ENTRADA — doGet
// ══════════════════════════════════════════════════════════════

function doGet(e) {
  const params = e.parameter || {};
  const action = params.action || '';
  let result;

  try {
    switch (action) {
      // Auth
      case 'login':             result = handleLogin(params);            break;
      case 'alterarSenha':      result = handleAlterarSenha(params);     break;

      // Dados públicos/comuns
      case 'getConselheiros':   result = handleGetConselheiros();         break;
      case 'getDocumentos':     result = handleGetDocumentos(params);     break;
      case 'getAvisos':         result = handleGetAvisos(params);         break;
      case 'getHomeConfig':     result = handleGetHomeConfig();           break;
      case 'getCategorias':     result = handleGetCategorias();           break;
      case 'getConfig':         result = handleGetConfig();               break;

      // Meus documentos
      case 'getMeusDocs':       result = handleGetMeusDocs(params);       break;

      // Atas
      case 'getAtas':           result = handleGetAtas(params);           break;
      case 'getAtasPendentes':  result = handleGetAtasPendentes(params);  break;
      case 'aprovarAta':        result = handleAprovarAta(params);        break;

      // Reuniões
      case 'getReunioes':       result = handleGetReunioes(params);       break;
      case 'getPresencas':      result = handleGetPresencas(params);      break;

      // Solicitações
      case 'enviarSolicitacao': result = handleEnviarSolicitacao(params); break;
      case 'getSolicitacoes':   result = handleGetSolicitacoes(params);   break;
      case 'responderSolicitacao': result = handleResponderSolicitacao(params); break;

      // Log
      case 'registrarLog':      result = handleRegistrarLog(params);      break;

      // Admin
      case 'getDashboardData':  result = handleGetDashboardData();        break;
      case 'getLogAcessos':     result = handleGetLogAcessos(params);     break;
      case 'getConselheirosAdmin': result = handleGetConselheirosAdmin();  break;
      case 'getDocumentosAdmin':   result = handleGetDocumentosAdmin();    break;
      case 'addDocumento':      result = handleAddDocumento(params);      break;
      case 'addConselheiro':    result = handleAddConselheiro(params);    break;
      case 'addAviso':          result = handleAddAviso(params);          break;

      // Preparados
      case 'getEventos':        result = handleGetEventos(params);        break;
      case 'getVotacoes':       result = handleGetVotacoes(params);       break;
      case 'getComissoes':      result = handleGetComissoes(params);      break;

      default: result = _err('Ação inválida: ' + action);
    }
  } catch (err) {
    Logger.log('[ERRO] action=' + action + ' | ' + err.message + '\n' + err.stack);
    result = _err('Erro interno: ' + err.message);
  }

  return _respond(result);
}

// ══════════════════════════════════════════════════════════════
// AUTENTICAÇÃO
// ══════════════════════════════════════════════════════════════

function handleLogin(params) {
  const nome  = (params.nome  || '').trim().toLowerCase();
  const senha = (params.senha || '').trim();
  if (!nome || !senha) return _err('Nome e senha são obrigatórios.');

  const rows = _getSheet(ABA.CONSELHEIROS).getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const nomeRow  = String(r[CC.NOME]   || '').trim().toLowerCase();
    const senhaRow = String(r[CC.SENHA]  || '').trim();
    const status   = String(r[CC.STATUS] || '').trim().toLowerCase();
    const perfil   = String(r[CC.PERFIL] || 'publico').trim().toLowerCase();

    if (nomeRow === nome && senhaRow === senha) {
      if (status !== 'ativo')
        return _err('Cadastro inativo. Contate a Secretaria Executiva.');

      const user = {
        id:       String(r[CC.ID]       || ''),
        nome:     String(r[CC.NOME]     || ''),
        segmento: String(r[CC.SEGMENTO] || ''),
        entidade: String(r[CC.ENTIDADE] || ''),
        cadeira:  String(r[CC.CADEIRA]  || ''),
        email:    String(r[CC.EMAIL]    || ''),
        perfil:   perfil,
      };

      // Registra log de login
      _logAction(user.id, user.nome, 'login', '');

      // Atualiza último acesso na aba CONSELHEIROS (coluna extra se existir)
      try {
        const sheet = _getSheet(ABA.CONSELHEIROS);
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        const colUltAcesso = headers.indexOf('ULTIMO_ACESSO');
        if (colUltAcesso >= 0) {
          sheet.getRange(i + 1, colUltAcesso + 1).setValue(new Date());
        }
      } catch(e) {}

      return { success: true, user };
    }
  }

  // Log tentativa falha
  _logAction('', nome, 'login_falha', 'Senha incorreta');
  return _err('Nome ou senha incorretos.');
}

function handleAlterarSenha(params) {
  const nome       = (params.nome       || '').trim().toLowerCase();
  const senhaAtual = (params.senhaAtual || '').trim();
  const novaSenha  = (params.novaSenha  || '').trim();

  if (!novaSenha || novaSenha.length < 4)
    return _err('A nova senha deve ter ao menos 4 caracteres.');

  const sheet = _getSheet(ABA.CONSELHEIROS);
  const rows  = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    const nomeRow  = String(rows[i][CC.NOME]  || '').trim().toLowerCase();
    const senhaRow = String(rows[i][CC.SENHA] || '').trim();

    if (nomeRow === nome && senhaRow === senhaAtual) {
      sheet.getRange(i + 1, CC.SENHA + 1).setValue(novaSenha);
      _logAction(String(rows[i][CC.ID] || ''), String(rows[i][CC.NOME] || ''), 'senha_alterada', '');
      return { success: true };
    }
  }
  return _err('Senha atual incorreta.');
}

// ══════════════════════════════════════════════════════════════
// CONSELHEIROS
// ══════════════════════════════════════════════════════════════

function handleGetConselheiros() {
  const rows = _getSheet(ABA.CONSELHEIROS).getDataRange().getValues();
  const list = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (String(r[CC.STATUS] || '').trim().toLowerCase() !== 'ativo') continue;
    const nome = String(r[CC.NOME] || '').trim();
    if (!nome) continue;
    list.push({
      id:       String(r[CC.ID]       || ''),
      nome,
      segmento: String(r[CC.SEGMENTO] || ''),
      entidade: String(r[CC.ENTIDADE] || ''),
    });
  }
  return { success: true, conselheiros: list };
}

// ══════════════════════════════════════════════════════════════
// DOCUMENTOS
// ══════════════════════════════════════════════════════════════

function handleGetDocumentos(params) {
  const perfil = (params.perfil || 'publico').trim().toLowerCase();
  const rows   = _getSheet(ABA.DOCUMENTOS).getDataRange().getValues();
  const docs   = [];

  for (let i = 1; i < rows.length; i++) {
    const r      = rows[i];
    const status = String(r[CD.STATUS] || '').trim().toLowerCase();
    const titulo = String(r[CD.TITULO] || '').trim();
    if (status !== 'ativo' || !titulo) continue;

    const acesso = String(r[CD.ACESSO] || 'publico').trim().toLowerCase();
    if (!_temAcesso(perfil, acesso)) continue;

    docs.push({
      id:        String(r[CD.ID]        || ''),
      titulo,
      tipo:      String(r[CD.TIPO]      || '').trim(),
      ano:       String(r[CD.ANO]       || '').trim(),
      data:      _formatData(r[CD.DATA]),
      descricao: String(r[CD.DESCRICAO] || '').trim(),
      link:      String(r[CD.LINK]      || '').trim(),
      acesso,
      destaque:  String(r[CD.DESTAQUE]  || '').trim().toLowerCase(),
      midia:     String(r[CD.MIDIA]     || 'pdf').trim().toLowerCase(),
    });
  }

  docs.sort((a, b) => _dataParaOrdem(b.data) - _dataParaOrdem(a.data));
  return { success: true, documentos: docs };
}

// ══════════════════════════════════════════════════════════════
// MEUS DOCUMENTOS
// ══════════════════════════════════════════════════════════════

function handleGetMeusDocs(params) {
  const idCons = (params.id || '').trim();
  if (!idCons) return _err('ID do conselheiro não informado.');

  const rows = _getSheet(ABA.MEU_DOCS).getDataRange().getValues();
  const docs = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (String(r[CM.ID_CONS] || '').trim() !== idCons) continue;
    if (String(r[CM.STATUS]  || '').trim().toLowerCase() !== 'ativo') continue;

    docs.push({
      id:    String(r[CM.ID]    || ''),
      titulo:String(r[CM.TITULO]|| ''),
      tipo:  String(r[CM.TIPO]  || ''),
      ano:   String(r[CM.ANO]   || ''),
      link:  String(r[CM.LINK]  || ''),
    });
  }

  return { success: true, documentos: docs };
}

// ══════════════════════════════════════════════════════════════
// AVISOS
// ══════════════════════════════════════════════════════════════

function handleGetAvisos(params) {
  const perfil = (params.perfil || 'publico').trim().toLowerCase();
  const hoje   = new Date();
  const rows   = _getSheet(ABA.AVISOS).getDataRange().getValues();
  const avisos = [];

  for (let i = 1; i < rows.length; i++) {
    const r      = rows[i];
    const status = String(r[CA.STATUS] || '').trim().toLowerCase();
    if (status !== 'ativo') continue;

    // Verifica data de validade
    const dataInicio = r[CA.DATA_INICIO] ? new Date(r[CA.DATA_INICIO]) : null;
    const dataFim    = r[CA.DATA_FIM]    ? new Date(r[CA.DATA_FIM])    : null;
    if (dataInicio && hoje < dataInicio) continue;
    if (dataFim    && hoje > dataFim)    continue;

    // Verifica perfil
    const perfilAviso = String(r[CA.PERFIL] || 'publico').trim().toLowerCase();
    if (!_temAcesso(perfil, perfilAviso)) continue;

    avisos.push({
      id:     String(r[CA.ID]     || ''),
      titulo: String(r[CA.TITULO] || ''),
      texto:  String(r[CA.TEXTO]  || ''),
      tipo:   String(r[CA.TIPO]   || 'banner').trim().toLowerCase(), // popup | banner | login
      cor:    String(r[CA.COR]    || 'blue').trim().toLowerCase(),
    });
  }

  return { success: true, avisos };
}

// ══════════════════════════════════════════════════════════════
// HOME CONFIG
// ══════════════════════════════════════════════════════════════

function handleGetHomeConfig() {
  try {
    const rows   = _getSheet(ABA.CONFIG).getDataRange().getValues();
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
// ATAS
// ══════════════════════════════════════════════════════════════

function handleGetAtas(params) {
  const perfil = (params.perfil || 'publico').trim().toLowerCase();
  const rows   = _getSheet(ABA.ATAS).getDataRange().getValues();
  const atas   = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (String(r[CAT.STATUS] || '').trim().toLowerCase() !== 'ativo') continue;
    const acesso = String(r[CAT.ACESSO] || 'publico').trim().toLowerCase();
    if (!_temAcesso(perfil, acesso)) continue;

    atas.push({
      id:              String(r[CAT.ID]              || ''),
      id_reuniao:      String(r[CAT.ID_REUNIAO]      || ''),
      numero:          String(r[CAT.NUMERO]          || ''),
      data:            _formatData(r[CAT.DATA]),
      tipo:            String(r[CAT.TIPO]            || ''),
      link_pdf:        String(r[CAT.LINK_PDF]        || ''),
      link_video:      String(r[CAT.LINK_VIDEO]      || ''),
      acesso,
      aprovacao_ativa: String(r[CAT.APROVACAO_ATIVA] || 'nao').trim().toLowerCase() === 'sim',
    });
  }

  atas.sort((a, b) => _dataParaOrdem(b.data) - _dataParaOrdem(a.data));
  return { success: true, atas };
}

/**
 * Retorna atas pendentes de aprovação para um conselheiro específico.
 * Condição: aprovacao_ativa=sim + conselheiro estava presente + ainda não aprovou.
 */
function handleGetAtasPendentes(params) {
  const idCons = (params.id || '').trim();
  if (!idCons) return _err('ID não informado.');

  // Busca atas com aprovação ativa
  const rowsAtas = _getSheet(ABA.ATAS).getDataRange().getValues();
  const atasAtivas = rowsAtas.slice(1).filter(r =>
    String(r[CAT.STATUS]          || '').toLowerCase() === 'ativo' &&
    String(r[CAT.APROVACAO_ATIVA] || '').toLowerCase() === 'sim'
  );

  if (!atasAtivas.length) return { success: true, pendentes: [] };

  // Reuniões em que o conselheiro estava presente
  const rowsPrex = _getSheet(ABA.PRESENCAS).getDataRange().getValues();
  const reunioesPresente = new Set(
    rowsPrex.slice(1)
      .filter(r => String(r[CP.ID_CONS] || '') === idCons &&
                   String(r[CP.PRESENTE]|| '').toLowerCase() === 'sim')
      .map(r => String(r[CP.ID_REUNIAO] || ''))
  );

  // Aprovações já feitas
  const rowsAprov = _getSheet(ABA.ATA_APROVACOES).getDataRange().getValues();
  const atasJaAprovadas = new Set(
    rowsAprov.slice(1)
      .filter(r => String(r[CAP.ID_CONS] || '') === idCons)
      .map(r => String(r[CAP.ID_ATA] || ''))
  );

  // Filtra pendentes
  const pendentes = atasAtivas
    .filter(r => reunioesPresente.has(String(r[CAT.ID_REUNIAO] || '')) &&
                 !atasJaAprovadas.has(String(r[CAT.ID] || '')))
    .map(r => ({
      id:      String(r[CAT.ID]      || ''),
      numero:  String(r[CAT.NUMERO]  || ''),
      data:    _formatData(r[CAT.DATA]),
      tipo:    String(r[CAT.TIPO]    || ''),
      link_pdf:String(r[CAT.LINK_PDF]|| ''),
    }));

  return { success: true, pendentes };
}

function handleAprovarAta(params) {
  const idCons = (params.id     || '').trim();
  const idAta  = (params.id_ata || '').trim();
  const nome   = (params.nome   || '').trim();
  if (!idCons || !idAta) return _err('Dados insuficientes.');

  // Verifica se já aprovou
  const rowsAprov = _getSheet(ABA.ATA_APROVACOES).getDataRange().getValues();
  const jaAprovado = rowsAprov.slice(1).some(
    r => String(r[CAP.ID_ATA]  || '') === idAta &&
         String(r[CAP.ID_CONS] || '') === idCons
  );
  if (jaAprovado) return _err('Você já registrou sua aprovação para esta ata.');

  const sheet = _getSheet(ABA.ATA_APROVACOES);
  const id    = 'APR-' + Date.now();
  sheet.appendRow([id, idAta, idCons, nome, 'aprovado', new Date()]);

  _logAction(idCons, nome, 'ata_aprovada', 'Ata: ' + idAta);
  return { success: true, protocolo: id };
}

// ══════════════════════════════════════════════════════════════
// REUNIÕES
// ══════════════════════════════════════════════════════════════

function handleGetReunioes(params) {
  const perfil = (params.perfil || 'publico').trim().toLowerCase();
  const rows   = _getSheet(ABA.REUNIOES).getDataRange().getValues();
  const list   = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (String(r[CR.STATUS] || '').trim().toLowerCase() !== 'ativo') continue;
    list.push({
      id:        String(r[CR.ID]        || ''),
      titulo:    String(r[CR.TITULO]    || ''),
      data:      _formatData(r[CR.DATA]),
      hora:      String(r[CR.HORA]      || ''),
      local:     String(r[CR.LOCAL]     || ''),
      tipo:      String(r[CR.TIPO]      || ''),
      descricao: String(r[CR.DESCRICAO] || ''),
    });
  }

  list.sort((a, b) => _dataParaOrdem(b.data) - _dataParaOrdem(a.data));
  return { success: true, reunioes: list };
}

function handleGetPresencas(params) {
  const idReuniao = (params.id_reuniao || '').trim();
  if (!idReuniao) return _err('ID da reunião não informado.');

  const rows = _getSheet(ABA.PRESENCAS).getDataRange().getValues();
  const list = rows.slice(1)
    .filter(r => String(r[CP.ID_REUNIAO] || '') === idReuniao)
    .map(r => ({
      id_cons:       String(r[CP.ID_CONS]      || ''),
      nome:          String(r[CP.NOME]         || ''),
      presente:      String(r[CP.PRESENTE]     || '').toLowerCase() === 'sim',
      justificativa: String(r[CP.JUSTIFICATIVA]|| ''),
    }));

  return { success: true, presencas: list };
}

// ══════════════════════════════════════════════════════════════
// SOLICITAÇÕES
// ══════════════════════════════════════════════════════════════

function handleEnviarSolicitacao(params) {
  const idCons  = (params.id       || '').trim();
  const nome    = (params.nome     || '').trim();
  const tipo    = (params.tipo     || '').trim();
  const assunto = (params.assunto  || '').trim();
  const descr   = (params.descricao|| '').trim();

  if (!idCons || !assunto || !descr)
    return _err('Preencha todos os campos obrigatórios.');

  const protocolo = 'SOL-' + Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyyMMdd') +
                    '-' + String(Date.now()).slice(-4);

  _getSheet(ABA.SOLICITACOES).appendRow([
    'SOL-' + Date.now(), protocolo, idCons, nome,
    tipo, assunto, descr, 'recebido',
    Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm'),
    '', '',
  ]);

  _logAction(idCons, nome, 'solicitacao_enviada', 'Protocolo: ' + protocolo);

  // Envia e-mail para a diretoria
  try {
    const emailDest = EMAIL_DIRETORIA.filter(Boolean);
    if (EMAIL_SECRETARIA) emailDest.push(EMAIL_SECRETARIA);
    if (emailDest.length) {
      MailApp.sendEmail({
        to: emailDest.join(','),
        subject: '[CMS-MOC] Nova Solicitação — ' + assunto,
        body: 'Nova solicitação recebida pelo sistema CMS Docs.\n\n' +
              'Protocolo: ' + protocolo + '\n' +
              'Conselheiro: ' + nome + '\n' +
              'Tipo: ' + tipo + '\n' +
              'Assunto: ' + assunto + '\n\n' +
              'Descrição:\n' + descr + '\n\n' +
              '— Secretaria Executiva CMS-MOC',
      });
    }
  } catch(e) {
    Logger.log('Erro ao enviar e-mail: ' + e.message);
  }

  return { success: true, protocolo };
}

function handleGetSolicitacoes(params) {
  const idCons = (params.id     || '').trim();
  const perfil = (params.perfil || '').trim().toLowerCase();
  const rows   = _getSheet(ABA.SOLICITACOES).getDataRange().getValues();

  let list = rows.slice(1).filter(r => String(r[CS.PROTOCOLO] || '').trim());

  // Conselheiro vê apenas as suas; admin/secretaria/diretoria vê todas
  if (!['admin','secretaria','diretoria','presidente'].includes(perfil)) {
    list = list.filter(r => String(r[CS.ID_CONS] || '') === idCons);
  }

  return {
    success: true,
    solicitacoes: list.map(r => ({
      protocolo:     String(r[CS.PROTOCOLO]     || ''),
      nome:          String(r[CS.NOME_CONS]     || ''),
      tipo:          String(r[CS.TIPO]          || ''),
      assunto:       String(r[CS.ASSUNTO]       || ''),
      descricao:     String(r[CS.DESCRICAO]     || ''),
      status:        String(r[CS.STATUS]        || ''),
      data:          String(r[CS.DATA]          || ''),
      resposta:      String(r[CS.RESPOSTA]      || ''),
      data_resposta: String(r[CS.DATA_RESPOSTA] || ''),
    }))
  };
}

function handleResponderSolicitacao(params) {
  const protocolo = (params.protocolo || '').trim();
  const resposta  = (params.resposta  || '').trim();
  const status    = (params.status    || 'respondido').trim();

  if (!protocolo || !resposta) return _err('Dados insuficientes.');

  const sheet = _getSheet(ABA.SOLICITACOES);
  const rows  = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][CS.PROTOCOLO] || '') !== protocolo) continue;
    sheet.getRange(i + 1, CS.STATUS        + 1).setValue(status);
    sheet.getRange(i + 1, CS.RESPOSTA      + 1).setValue(resposta);
    sheet.getRange(i + 1, CS.DATA_RESPOSTA + 1).setValue(
      Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm')
    );
    return { success: true };
  }

  return _err('Solicitação não encontrada.');
}

// ══════════════════════════════════════════════════════════════
// LOG
// ══════════════════════════════════════════════════════════════

function handleRegistrarLog(params) {
  const idCons = (params.id     || '').trim();
  const nome   = (params.nome   || '').trim();
  const acao   = (params.acao   || '').trim();
  const det    = (params.det    || '').trim();
  _logAction(idCons, nome, acao, det);
  return { success: true };
}

function handleGetLogAcessos(params) {
  const limit = parseInt(params.limit || '200');
  const rows  = _getSheet(ABA.LOG).getDataRange().getValues();

  const log = rows.slice(1)
    .filter(r => r[CL.TIMESTAMP])
    .map(r => ({
      timestamp: r[CL.TIMESTAMP] instanceof Date
        ? Utilities.formatDate(r[CL.TIMESTAMP], 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm')
        : String(r[CL.TIMESTAMP] || ''),
      id:        String(r[CL.ID_CONS] || ''),
      nome:      String(r[CL.NOME]    || ''),
      acao:      String(r[CL.ACAO]    || ''),
      detalhes:  String(r[CL.DETALHES]|| ''),
    }))
    .reverse()
    .slice(0, limit);

  return { success: true, log };
}

// ══════════════════════════════════════════════════════════════
// ADMIN — DASHBOARD
// ══════════════════════════════════════════════════════════════

function handleGetDashboardData() {
  const ssC = _getSheet(ABA.CONSELHEIROS).getDataRange().getValues();
  const ssD = _getSheet(ABA.DOCUMENTOS).getDataRange().getValues();

  const cons = ssC.slice(1).filter(r => r[CC.NOME]);
  const docs = ssD.slice(1).filter(r => r[CD.TITULO]);

  const totalC   = cons.length;
  const ativosC  = cons.filter(r => String(r[CC.STATUS] || '').toLowerCase() === 'ativo').length;
  const totalD   = docs.length;
  const ativosD  = docs.filter(r => String(r[CD.STATUS] || '').toLowerCase() === 'ativo').length;

  const porTipo = {};
  docs.forEach(r => {
    const t = String(r[CD.TIPO] || 'Sem tipo').trim();
    porTipo[t] = (porTipo[t] || 0) + 1;
  });

  // Último acesso por conselheiro
  const logRows = _getSheet(ABA.LOG).getDataRange().getValues();
  const ultimoAcesso = {};
  logRows.slice(1).forEach(r => {
    const id = String(r[CL.ID_CONS] || '');
    if (!id || String(r[CL.ACAO] || '') !== 'login') return;
    const ts = r[CL.TIMESTAMP];
    if (!ultimoAcesso[id] || ts > ultimoAcesso[id]) ultimoAcesso[id] = ts;
  });

  const recentes = docs
    .filter(r => String(r[CD.STATUS] || '').toLowerCase() === 'ativo')
    .slice(-8).reverse()
    .map(r => ({
      titulo: String(r[CD.TITULO] || ''),
      tipo:   String(r[CD.TIPO]   || ''),
      data:   _formatData(r[CD.DATA]),
      acesso: String(r[CD.ACESSO] || 'publico'),
    }));

  return {
    success: true,
    conselheiros: { total: totalC, ativos: ativosC, inativos: totalC - ativosC },
    documentos:   { total: totalD, ativos: ativosD, arquivados: totalD - ativosD },
    porTipo,
    recentes,
    ultimoAcesso,
  };
}

function handleGetConselheirosAdmin() {
  const rows = _getSheet(ABA.CONSELHEIROS).getDataRange().getValues();
  // Log do último acesso
  const logRows = _getSheet(ABA.LOG).getDataRange().getValues();
  const ultimoAcesso = {};
  logRows.slice(1).forEach(r => {
    const id = String(r[CL.ID_CONS] || '');
    if (!id || String(r[CL.ACAO]||'') !== 'login') return;
    const ts = r[CL.TIMESTAMP];
    if (!ultimoAcesso[id] || ts > ultimoAcesso[id]) {
      ultimoAcesso[id] = r[CL.TIMESTAMP] instanceof Date
        ? Utilities.formatDate(r[CL.TIMESTAMP], 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm')
        : String(r[CL.TIMESTAMP]||'');
    }
  });

  return {
    success: true,
    conselheiros: rows.slice(1).filter(r => r[CC.NOME]).map(r => ({
      id:          String(r[CC.ID]       || ''),
      nome:        String(r[CC.NOME]     || ''),
      segmento:    String(r[CC.SEGMENTO] || ''),
      entidade:    String(r[CC.ENTIDADE] || ''),
      status:      String(r[CC.STATUS]   || ''),
      perfil:      String(r[CC.PERFIL]   || 'publico'),
      email:       String(r[CC.EMAIL]    || ''),
      ultimoAcesso:ultimoAcesso[String(r[CC.ID]||'')] || '—',
    }))
  };
}

function handleGetDocumentosAdmin() {
  const rows = _getSheet(ABA.DOCUMENTOS).getDataRange().getValues();
  return {
    success: true,
    documentos: rows.slice(1).filter(r => r[CD.TITULO]).map(r => ({
      id:       String(r[CD.ID]       || ''),
      titulo:   String(r[CD.TITULO]   || ''),
      tipo:     String(r[CD.TIPO]     || ''),
      ano:      String(r[CD.ANO]      || ''),
      status:   String(r[CD.STATUS]   || ''),
      acesso:   String(r[CD.ACESSO]   || 'publico'),
      destaque: String(r[CD.DESTAQUE] || ''),
      midia:    String(r[CD.MIDIA]    || 'pdf'),
      data:     _formatData(r[CD.DATA]),
    }))
  };
}

function handleAddDocumento(params) {
  const sheet = _getSheet(ABA.DOCUMENTOS);
  const id    = 'DOC-' + String(Date.now()).slice(-6);
  sheet.appendRow([
    id,
    params.titulo    || '',
    params.tipo      || '',
    params.ano       || new Date().getFullYear(),
    params.data      || Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd'),
    params.descricao || '',
    params.link      || '',
    'ativo',
    params.acesso    || 'publico',
    params.destaque  || '',
    params.midia     || 'pdf',
  ]);
  return { success: true, id };
}

function handleAddConselheiro(params) {
  const sheet = _getSheet(ABA.CONSELHEIROS);
  const rows  = sheet.getDataRange().getValues();
  const id    = 'C-' + String(rows.length).padStart(3, '0');
  sheet.appendRow([
    id, params.segmento||'', params.entidade||'', params.cadeira||'',
    params.nome||'', params.telefone||'', params.email||'',
    params.rg||'', params.cpf||'', params.endereco||'',
    params.status||'ativo', params.senha||'',
    params.perfil||'publico',
  ]);
  return { success: true, id };
}

function handleAddAviso(params) {
  const sheet = _getSheet(ABA.AVISOS);
  const id    = 'AVI-' + String(Date.now()).slice(-6);
  sheet.appendRow([
    id,
    params.titulo      || '',
    params.texto       || '',
    params.data_inicio || '',
    params.data_fim    || '',
    params.perfil      || 'publico',
    params.tipo        || 'banner',
    'ativo',
    params.cor         || 'blue',
  ]);
  return { success: true, id };
}

// ══════════════════════════════════════════════════════════════
// MÓDULOS PREPARADOS
// ══════════════════════════════════════════════════════════════

function handleGetEventos(params) {
  try {
    const rows = _getSheet(ABA.EVENTOS).getDataRange().getValues();
    const list = rows.slice(1)
      .filter(r => r[0] && String(r[3]||'').toLowerCase() === 'ativo')
      .map(r => ({
        id: String(r[0]||''), titulo: String(r[1]||''),
        data: _formatData(r[2]), hora: String(r[3]||''),
        local: String(r[4]||''), tipo: String(r[5]||''),
      }));
    return { success: true, eventos: list };
  } catch(e) {
    return { success: true, eventos: [] };
  }
}

function handleGetVotacoes(params) {
  try {
    const rows = _getSheet(ABA.VOTACOES).getDataRange().getValues();
    return { success: true, votacoes: rows.slice(1).map(r => ({
      id: String(r[0]||''), pauta: String(r[1]||''),
      status: String(r[2]||''), data: _formatData(r[3]),
    }))};
  } catch(e) {
    return { success: true, votacoes: [] };
  }
}

function handleGetComissoes(params) {
  try {
    const rows = _getSheet(ABA.COMISSOES).getDataRange().getValues();
    return { success: true, comissoes: rows.slice(1).map(r => ({
      id: String(r[0]||''), nome: String(r[1]||''),
      tipo: String(r[2]||''), status: String(r[3]||''),
    }))};
  } catch(e) {
    return { success: true, comissoes: [] };
  }
}

function handleGetCategorias() {
  try {
    const rows = _getSheet(ABA.CATEGORIAS).getDataRange().getValues();
    const cats = rows.slice(1)
      .filter(r => r[0])
      .map(r => ({ tipo: String(r[0]||''), badge: String(r[1]||'badge-gray'), icon: String(r[2]||'📄') }));
    if (cats.length) return { success: true, categorias: cats };
  } catch(e) {}
  return { success: true, categorias: _defaultCategorias() };
}

function handleGetConfig() {
  return handleGetHomeConfig();
}

// ══════════════════════════════════════════════════════════════
// SETUP AUTOMÁTICO DA PLANILHA
// ══════════════════════════════════════════════════════════════

/**
 * runSetup()
 * Chame pelo menu: ⚙️ CMS Docs Admin → 🔧 Setup / Atualizar Planilha
 *
 * O que faz:
 *   - Cria abas que não existem com cabeçalhos corretos e formatação
 *   - Se a aba existe, verifica/adiciona colunas faltantes
 *   - Se há conflito de nome, cria aba com sufixo _NOVO e avisa
 *   - Formata cabeçalhos (negrito, cor, congelamento da linha 1)
 *   - Não apaga dados existentes
 */
function runSetup() {
  const ss  = SpreadsheetApp.openById(SHEET_ID);
  const ui  = SpreadsheetApp.getUi();
  const log = [];

  const abas = {
    [ABA.CONSELHEIROS]: [
      'ID_CONS','SEGMENTO','ENTIDADE','CADEIRA','NOME','TELEFONE',
      'EMAIL','RG','CPF','ENDERECO','STATUS','SENHA','PERFIL','ULTIMO_ACESSO',
    ],
    [ABA.DOCUMENTOS]: [
      'ID','TITULO','TIPO','ANO','DATA','DESCRICAO','LINK',
      'STATUS','ACESSO','DESTAQUE','MIDIA',
    ],
    [ABA.AVISOS]: [
      'ID','TITULO','TEXTO','DATA_INICIO','DATA_FIM','PERFIL','TIPO','STATUS','COR',
    ],
    [ABA.ATAS]: [
      'ID','ID_REUNIAO','NUMERO','DATA','TIPO','LINK_PDF',
      'LINK_VIDEO','STATUS','ACESSO','APROVACAO_ATIVA',
    ],
    [ABA.REUNIOES]: [
      'ID','TITULO','DATA','HORA','LOCAL','TIPO','DESCRICAO','STATUS',
    ],
    [ABA.PRESENCAS]: [
      'ID','ID_REUNIAO','ID_CONS','NOME','PRESENTE','JUSTIFICATIVA',
    ],
    [ABA.ATA_APROVACOES]: [
      'ID','ID_ATA','ID_CONS','NOME','STATUS','TIMESTAMP',
    ],
    [ABA.SOLICITACOES]: [
      'ID','PROTOCOLO','ID_CONS','NOME_CONS','TIPO','ASSUNTO',
      'DESCRICAO','STATUS','DATA','RESPOSTA','DATA_RESPOSTA',
    ],
    [ABA.MEU_DOCS]: [
      'ID','ID_CONS','NOME_CONS','TITULO','TIPO','ANO','LINK','STATUS',
    ],
    [ABA.LOG]: [
      'ID','TIMESTAMP','ID_CONS','NOME','ACAO','DETALHES',
    ],
    [ABA.CONFIG]: [
      'CHAVE','VALOR','DESCRICAO',
    ],
    [ABA.CATEGORIAS]: [
      'TIPO','BADGE','ICON',
    ],
    [ABA.VOTACOES]: [
      'ID','PAUTA','STATUS','DATA','RESULTADO','VOTOS_SIM','VOTOS_NAO','ABSTENCOES',
    ],
    [ABA.VOTOS]: [
      'ID','ID_VOTACAO','ID_CONS','NOME','VOTO','TIMESTAMP',
    ],
    [ABA.EVENTOS]: [
      'ID','TITULO','DATA','HORA','LOCAL','TIPO','DESCRICAO','STATUS',
    ],
    [ABA.COMISSOES]: [
      'ID','NOME','TIPO','STATUS','DESCRICAO',
    ],
    [ABA.COMISSAO_MEMBROS]: [
      'ID','ID_COMISSAO','ID_CONS','NOME','CARGO','STATUS',
    ],
  };

  Object.entries(abas).forEach(([nomeAba, colunas]) => {
    let sheet = ss.getSheetByName(nomeAba);

    if (!sheet) {
      sheet = ss.insertSheet(nomeAba);
      _formatarCabecalho(sheet, colunas);
      log.push('✅ Criada: ' + nomeAba);
    } else {
      // Verifica colunas faltantes
      const existing = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1))
                            .getValues()[0].map(v => String(v||'').trim().toUpperCase());
      const faltando = colunas.filter(c => !existing.includes(c.toUpperCase()));

      if (faltando.length) {
        const startCol = sheet.getLastColumn() + 1;
        faltando.forEach((col, i) => {
          sheet.getRange(1, startCol + i).setValue(col);
        });
        log.push('➕ ' + nomeAba + ': adicionadas ' + faltando.join(', '));
      } else {
        log.push('☑️  ' + nomeAba + ': OK');
      }

      // Reaplica formatação do cabeçalho
      _formatarCabecalho(sheet, null, true);
    }
  });

  // Config padrão se vazia
  _seedConfig(ss);

  // Categorias padrão se vazia
  _seedCategorias(ss);

  ui.alert(
    '✅ Setup concluído',
    log.join('\n'),
    ui.ButtonSet.OK
  );
}

function _formatarCabecalho(sheet, colunas, soFormatacao) {
  if (!soFormatacao && colunas) {
    sheet.getRange(1, 1, 1, colunas.length).setValues([colunas]);
  }
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const header  = sheet.getRange(1, 1, 1, lastCol);
  header.setBackground('#0D2E5A')
        .setFontColor('#FFFFFF')
        .setFontWeight('bold')
        .setFontFamily('Arial');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 120);
}

function _seedConfig(ss) {
  const sheet = ss.getSheetByName(ABA.CONFIG);
  if (!sheet || sheet.getLastRow() > 1) return;

  const defaults = [
    ['home_titulo',       'Bem-vindo ao CMS Docs',          'Título da home do app'],
    ['home_subtitulo',    'Conselho Municipal de Saúde',     'Subtítulo'],
    ['home_texto',        '',                                'Texto livre da home'],
    ['home_imagem',       '',                                'URL da imagem de capa (opcional)'],
    ['home_banner_texto', '',                                'Texto do banner de destaque (vazio = oculto)'],
    ['home_banner_cor',   'blue',                            'Cor do banner: blue, green, yellow, red'],
    ['aprovacao_ata',     'sim',                             'Ativar módulo de aprovação de atas: sim/nao'],
    ['push_onesignal_id', '',                                'OneSignal App ID (quando configurado)'],
    ['whatsapp_endpoint', '',                                'Evolution API endpoint (quando configurado)'],
  ];

  sheet.getRange(2, 1, defaults.length, 3).setValues(defaults);
}

function _seedCategorias(ss) {
  const sheet = ss.getSheetByName(ABA.CATEGORIAS);
  if (!sheet || sheet.getLastRow() > 1) return;

  const cats = _defaultCategorias().map(c => [c.tipo, c.badge, c.icon]);
  sheet.getRange(2, 1, cats.length, 3).setValues(cats);
}

function verificarEstrutura() {
  const ss   = SpreadsheetApp.openById(SHEET_ID);
  const ui   = SpreadsheetApp.getUi();
  const abas = ss.getSheets().map(s => s.getName());
  const nec  = Object.values(ABA);
  const falt = nec.filter(a => !abas.includes(a));

  if (!falt.length) {
    ui.alert('✅ Estrutura OK', 'Todas as ' + nec.length + ' abas necessárias existem.', ui.ButtonSet.OK);
  } else {
    ui.alert('⚠️ Abas faltando', falt.length + ' aba(s) faltando:\n' + falt.join('\n') +
      '\n\nUse o menu → 🔧 Setup / Atualizar Planilha para criá-las.', ui.ButtonSet.OK);
  }
}

// ══════════════════════════════════════════════════════════════
// UTILITÁRIOS INTERNOS
// ══════════════════════════════════════════════════════════════

function _getSheet(nome) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(nome);
  if (!sheet) throw new Error('Aba "' + nome + '" não encontrada. Use Setup para criá-la.');
  return sheet;
}

function _temAcesso(perfilUsuario, acessoDoc) {
  if (perfilUsuario === 'admin') return true;
  const h = { admin:5, secretaria:4, presidente:3, diretoria:2, publico:1 };
  const nivelUser = h[perfilUsuario] || 1;
  const perfisDoc = acessoDoc.split(',').map(p => p.trim());
  const nivelMin  = Math.min(...perfisDoc.map(p => h[p] || 1));
  return nivelUser >= nivelMin;
}

function _logAction(idCons, nome, acao, detalhes) {
  try {
    const sheet = _getSheet(ABA.LOG);
    const id    = 'LOG-' + Date.now();
    sheet.appendRow([id, new Date(), idCons, nome, acao, detalhes]);
  } catch(e) {
    Logger.log('Erro ao registrar log: ' + e.message);
  }
}

function _formatData(val) {
  if (!val) return '';
  if (val instanceof Date)
    return Utilities.formatDate(val, 'America/Sao_Paulo', 'yyyy-MM-dd');
  return String(val).trim();
}

function _dataParaOrdem(s) {
  if (!s) return 0;
  const str = String(s).trim();
  const br  = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br)  return parseInt(br[3] + br[2] + br[1]);
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return parseInt(iso[1] + iso[2] + iso[3]);
  if (str.match(/^\d{4}$/)) return parseInt(str + '0000');
  return 0;
}

function _defaultCategorias() {
  return [
    { tipo:'Portaria',          badge:'badge-blue',   icon:'📋' },
    { tipo:'Resolução',         badge:'badge-navy',   icon:'⚖️'  },
    { tipo:'Memorando',         badge:'badge-green',  icon:'📝' },
    { tipo:'Ofício',            badge:'badge-gray',   icon:'✉️'  },
    { tipo:'Edital',            badge:'badge-yellow', icon:'📢' },
    { tipo:'Institucional',     badge:'badge-navy',   icon:'🏛️'  },
    { tipo:'Documento Externo', badge:'badge-gray',   icon:'📄' },
  ];
}

function _err(msg) { return { success: false, message: msg }; }

function _respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
