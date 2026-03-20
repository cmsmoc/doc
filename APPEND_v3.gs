// ══════════════════════════════════════════════════════════════
// APPEND_v3.gs — Cole no final do Code.gs existente
// Novos handlers para: Comissões, Perfil, Favoritos, Push, Seed
// ══════════════════════════════════════════════════════════════

// Adicione estes cases no switch do doGet, antes do default:
//
//   case 'getComissoes':          result = handleGetComissoes();                break; // já existe
//   case 'getComissaoDetalhe':    result = handleGetComissaoDetalhe(params);    break; // NOVO
//   case 'getMinhasComissoes':    result = handleGetMinhasComissoes(params);    break; // NOVO
//   case 'getPerfil':             result = handleGetPerfil(params);             break; // NOVO
//   case 'atualizarPerfil':       result = handleAtualizarPerfil(params);       break; // NOVO
//   case 'getFavoritos':          result = handleGetFavoritos(params);          break; // NOVO
//   case 'toggleFavorito':        result = handleToggleFavorito(params);        break; // NOVO
//   case 'salvarPushSubscription':result = handleSalvarPush(params);            break; // NOVO
//   case 'removerPushSubscription':result= handleRemoverPush(params);           break; // NOVO
//   case 'enviarPushManual':      result = handleEnviarPushManual(params);      break; // NOVO (admin)

// ── Índices novos ─────────────────────────────────────────────

// COMISSOES (0-based) — já existia, apenas documentando
const CCOM = { ID:0, NOME:1, TIPO:2, DESCRICAO:3, STATUS:4, SIGLA:5 };

// COMISSAO_MEMBROS (0-based) — já existia
const CMEM = { ID:0, ID_COMISSAO:1, ID_CONS:2, NOME:3, FUNCAO:4, DATA_INICIO:5, DATA_FIM:6 };

// FAVORITOS — nova aba
const CFV = { ID:0, ID_CONS:1, ID_DOC:2, TIMESTAMP:3 };

// PUSH_SUBSCRIPTIONS — nova aba
const CPS = { ID:0, ID_CONS:1, NOME:2, PERFIL:3, SEGMENTO:4, ONESIGNAL_ID:5, TIMESTAMP:6, ATIVO:7 };

// ── Comissões ─────────────────────────────────────────────────

function handleGetComissoes() {
  try {
    const rowsCom = _getSheet(ABA.COMISSOES).getDataRange().getValues();
    const rowsMem = _getSheet(ABA.COMISSAO_MEMBROS).getDataRange().getValues();

    // Agrupa membros por comissão
    const membrosPorComissao = {};
    rowsMem.slice(1).forEach(r => {
      const idCom = String(r[CMEM.ID_COMISSAO] || '').trim();
      if (!idCom) return;
      if (!membrosPorComissao[idCom]) membrosPorComissao[idCom] = [];
      membrosPorComissao[idCom].push({
        id_cons: String(r[CMEM.ID_CONS]    || ''),
        nome:    String(r[CMEM.NOME]       || ''),
        funcao:  String(r[CMEM.FUNCAO]     || 'membro').toLowerCase(),
      });
    });

    const comissoes = rowsCom.slice(1)
      .filter(r => r[CCOM.ID] && String(r[CCOM.STATUS] || '').toLowerCase() !== 'inativo')
      .map(r => {
        const id = String(r[CCOM.ID] || '');
        return {
          id,
          nome:      String(r[CCOM.NOME]      || ''),
          tipo:      String(r[CCOM.TIPO]      || 'comissao').toLowerCase(),
          descricao: String(r[CCOM.DESCRICAO] || ''),
          sigla:     String(r[CCOM.SIGLA]     || ''),
          membros:   membrosPorComissao[id]   || [],
        };
      });

    return { success: true, comissoes };
  } catch(e) {
    return { success: true, comissoes: [] };
  }
}

// Wrapper já existe como handleGetComissoes() — renomeia para consistência
function handleGetComissaoDetalhe(params) {
  const id = (params.id || '').trim();
  if (!id) return _err('ID não informado.');

  try {
    const rowsCom = _getSheet(ABA.COMISSOES).getDataRange().getValues();
    const comRow  = rowsCom.slice(1).find(r => String(r[CCOM.ID] || '') === id);
    if (!comRow) return _err('Comissão não encontrada.');

    const rowsMem = _getSheet(ABA.COMISSAO_MEMBROS).getDataRange().getValues();
    const membros = rowsMem.slice(1)
      .filter(r => String(r[CMEM.ID_COMISSAO] || '') === id)
      .map(r => ({
        id_cons: String(r[CMEM.ID_CONS]    || ''),
        nome:    String(r[CMEM.NOME]       || ''),
        funcao:  String(r[CMEM.FUNCAO]     || 'membro').toLowerCase(),
      }));

    return {
      success: true,
      comissao: {
        id,
        nome:      String(comRow[CCOM.NOME]      || ''),
        tipo:      String(comRow[CCOM.TIPO]      || ''),
        descricao: String(comRow[CCOM.DESCRICAO] || ''),
        sigla:     String(comRow[CCOM.SIGLA]     || ''),
        membros,
      }
    };
  } catch(e) {
    return _err('Erro: ' + e.message);
  }
}

function handleGetMinhasComissoes(params) {
  const idCons = (params.id || '').trim();
  if (!idCons) return { success: true, comissoes: [] };

  try {
    const rowsMem = _getSheet(ABA.COMISSAO_MEMBROS).getDataRange().getValues();
    const rowsCom = _getSheet(ABA.COMISSOES).getDataRange().getValues();

    const comMap = {};
    rowsCom.slice(1).forEach(r => {
      comMap[String(r[CCOM.ID] || '')] = {
        id:    String(r[CCOM.ID]       || ''),
        nome:  String(r[CCOM.NOME]     || ''),
        tipo:  String(r[CCOM.TIPO]     || ''),
        sigla: String(r[CCOM.SIGLA]    || ''),
      };
    });

    const minhas = rowsMem.slice(1)
      .filter(r => String(r[CMEM.ID_CONS] || '') === idCons)
      .map(r => ({
        ...(comMap[String(r[CMEM.ID_COMISSAO] || '')] || {}),
        funcao: String(r[CMEM.FUNCAO] || 'membro').toLowerCase(),
      }))
      .filter(c => c.id);

    return { success: true, comissoes: minhas };
  } catch(e) {
    return { success: true, comissoes: [] };
  }
}

// ── Perfil ────────────────────────────────────────────────────

function handleGetPerfil(params) {
  const idCons = (params.id || '').trim();
  if (!idCons) return _err('ID não informado.');

  try {
    const rows = _getSheet(ABA.CONSELHEIROS).getDataRange().getValues();
    const headers = rows[0];
    const colUA = headers.indexOf('ULTIMO_ACESSO');

    const row = rows.slice(1).find(r => String(r[CC.ID] || '') === idCons);
    if (!row) return _err('Conselheiro não encontrado.');

    return {
      success: true,
      perfil: {
        id:          String(row[CC.ID]       || ''),
        nome:        String(row[CC.NOME]     || ''),
        segmento:    String(row[CC.SEGMENTO] || ''),
        entidade:    String(row[CC.ENTIDADE] || ''),
        cadeira:     String(row[CC.CADEIRA]  || ''),
        email:       String(row[CC.EMAIL]    || ''),
        perfil:      String(row[CC.PERFIL]   || 'publico'),
        ultimoAcesso:colUA >= 0 && row[colUA] instanceof Date
          ? Utilities.formatDate(row[colUA], 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm')
          : '—',
      }
    };
  } catch(e) {
    return _err('Erro: ' + e.message);
  }
}

function handleAtualizarPerfil(params) {
  const idCons = (params.id || '').trim();
  if (!idCons) return _err('ID não informado.');

  try {
    const sheet = _getSheet(ABA.CONSELHEIROS);
    const rows  = sheet.getDataRange().getValues();

    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][CC.ID] || '') !== idCons) continue;
      // Atualiza apenas campos permitidos para auto-edição
      if (params.email) sheet.getRange(i + 1, CC.EMAIL + 1).setValue(params.email);
      _logAction(idCons, String(rows[i][CC.NOME] || ''), 'perfil_atualizado', '');
      return { success: true };
    }
    return _err('Conselheiro não encontrado.');
  } catch(e) {
    return _err('Erro: ' + e.message);
  }
}

// ── Favoritos ─────────────────────────────────────────────────

function handleGetFavoritos(params) {
  const idCons = (params.id || '').trim();
  if (!idCons) return { success: true, favoritos: [] };

  try {
    const rowsFav = _getSheet(ABA.FAVORITOS).getDataRange().getValues();
    const rowsDocs= _getSheet(ABA.DOCUMENTOS).getDataRange().getValues();

    const docMap = {};
    rowsDocs.slice(1).forEach(r => {
      docMap[String(r[CD.ID] || '')] = {
        id:     String(r[CD.ID]     || ''),
        titulo: String(r[CD.TITULO] || ''),
        tipo:   String(r[CD.TIPO]   || ''),
        ano:    String(r[CD.ANO]    || ''),
        link:   String(r[CD.LINK]   || ''),
      };
    });

    const favs = rowsFav.slice(1)
      .filter(r => String(r[CFV.ID_CONS] || '') === idCons)
      .map(r => docMap[String(r[CFV.ID_DOC] || '')])
      .filter(Boolean);

    return { success: true, favoritos: favs };
  } catch(e) {
    return { success: true, favoritos: [] };
  }
}

function handleToggleFavorito(params) {
  const idCons = (params.id     || '').trim();
  const idDoc  = (params.doc_id || '').trim();
  if (!idCons || !idDoc) return _err('Dados insuficientes.');

  try {
    const sheet = _getSheet(ABA.FAVORITOS);
    const rows  = sheet.getDataRange().getValues();

    // Verifica se já existe
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][CFV.ID_CONS] || '') === idCons &&
          String(rows[i][CFV.ID_DOC]  || '') === idDoc) {
        // Remove (limpa a linha)
        sheet.getRange(i + 1, 1, 1, 4).clearContent();
        return { success: true, acao: 'removido' };
      }
    }

    // Adiciona
    sheet.appendRow(['FAV-' + Date.now(), idCons, idDoc, new Date()]);
    return { success: true, acao: 'adicionado' };
  } catch(e) {
    return _err('Erro: ' + e.message);
  }
}

// ── Push Notifications (OneSignal) ───────────────────────────

function handleSalvarPush(params) {
  const idCons     = (params.id           || '').trim();
  const nome       = (params.nome         || '').trim();
  const perfil     = (params.perfil       || 'publico').trim();
  const segmento   = (params.segmento     || '').trim();
  const osId       = (params.onesignal_id || '').trim();

  if (!osId) return _err('ID OneSignal não informado.');

  try {
    const sheet = _getSheet(ABA.PUSH_SUBSCRIPTIONS);
    const rows  = sheet.getDataRange().getValues();

    // Atualiza se já existe (mesmo conselheiro)
    if (idCons) {
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][CPS.ID_CONS] || '') === idCons) {
          sheet.getRange(i + 1, CPS.ONESIGNAL_ID + 1).setValue(osId);
          sheet.getRange(i + 1, CPS.ATIVO + 1).setValue('sim');
          sheet.getRange(i + 1, CPS.TIMESTAMP + 1).setValue(new Date());
          return { success: true };
        }
      }
    }

    // Insere novo
    sheet.appendRow([
      'PUSH-' + Date.now(), idCons, nome, perfil, segmento, osId, new Date(), 'sim'
    ]);
    return { success: true };
  } catch(e) {
    return _err('Erro: ' + e.message);
  }
}

function handleRemoverPush(params) {
  const idCons = (params.id || '').trim();
  if (!idCons) return { success: true };

  try {
    const sheet = _getSheet(ABA.PUSH_SUBSCRIPTIONS);
    const rows  = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][CPS.ID_CONS] || '') === idCons) {
        sheet.getRange(i + 1, CPS.ATIVO + 1).setValue('nao');
        return { success: true };
      }
    }
    return { success: true };
  } catch(e) {
    return _err('Erro: ' + e.message);
  }
}

/**
 * handleEnviarPushManual(params)
 * Dispara notificação push via OneSignal REST API.
 * Chamado pelo Painel Admin.
 * Requer: params.titulo, params.mensagem, params.segmento (opcional)
 * Requer Script Property: ONESIGNAL_APP_ID, ONESIGNAL_REST_KEY
 */
function handleEnviarPushManual(params) {
  const titulo    = (params.titulo    || '').trim();
  const mensagem  = (params.mensagem  || '').trim();
  const segmento  = (params.segmento  || '').trim(); // filtro por segmento, vazio = todos
  const url       = (params.url       || '/home.html').trim();

  if (!titulo || !mensagem) return _err('Título e mensagem são obrigatórios.');

  const appId   = PropertiesService.getScriptProperties().getProperty('ONESIGNAL_APP_ID');
  const restKey = PropertiesService.getScriptProperties().getProperty('ONESIGNAL_REST_KEY');

  if (!appId || !restKey) return _err('Configure ONESIGNAL_APP_ID e ONESIGNAL_REST_KEY nas Script Properties.');

  try {
    const payload = {
      app_id:             appId,
      headings:           { pt: titulo },
      contents:           { pt: mensagem },
      included_segments:  segmento ? undefined : ['All'],
      filters:            segmento
        ? [{ field:'tag', key:'segmento', relation:'=', value:segmento }]
        : undefined,
      url:                url,
    };

    const response = UrlFetchApp.fetch('https://onesignal.com/api/v1/notifications', {
      method:      'post',
      contentType: 'application/json',
      headers:     { Authorization: 'Basic ' + restKey },
      payload:     JSON.stringify(payload),
      muteHttpExceptions: true,
    });

    const result = JSON.parse(response.getContentText());
    if (result.errors) return _err('OneSignal erro: ' + JSON.stringify(result.errors));

    _logAction('admin', 'Sistema', 'push_enviado',
      `"${titulo}" → ${result.recipients || 0} destinatários`);

    return { success: true, recipients: result.recipients || 0, id: result.id };

  } catch(e) {
    return _err('Erro ao enviar push: ' + e.message);
  }
}

// ── Wrappers para google.script.run ──────────────────────────
function getComissaoDetalhe(params)    { return handleGetComissaoDetalhe(params || {}); }
function getMinhasComissoes(params)    { return handleGetMinhasComissoes(params || {}); }
function getPerfil(params)             { return handleGetPerfil(params || {}); }
function atualizarPerfil(params)       { return handleAtualizarPerfil(params || {}); }
function getFavoritos(params)          { return handleGetFavoritos(params || {}); }
function toggleFavorito(params)        { return handleToggleFavorito(params || {}); }
function salvarPushSubscription(p)     { return handleSalvarPush(p || {}); }
function removerPushSubscription(p)    { return handleRemoverPush(p || {}); }
function enviarPushManual(params)      { return handleEnviarPushManual(params || {}); }

// ══════════════════════════════════════════════════════════════
// SEED DAS COMISSÕES
// Adicione ao runSetup() existente ou rode manualmente uma vez:
//   → Menu ⚙️ CMS Docs Admin → 🌱 Seed Comissões
// ══════════════════════════════════════════════════════════════

function onOpenAdicionarMenu() {
  // Adicione esta linha no onOpen() existente:
  // .addItem('🌱 Seed Comissões', 'seedComissoes')
}

function seedComissoes() {
  const ui = SpreadsheetApp.getUi();
  const ss = _getSS();

  const COMISSOES_SEED = [
    {
      id: 'COM-001', sigla: 'CTIFCCA',
      nome: 'Câmara Técnica de Instrumentos de Gestão, Finanças, Contabilidade e Auditoria',
      tipo: 'camara', status: 'ativo',
      desc: 'Responsável pelo acompanhamento dos instrumentos de gestão, execução financeira e prestação de contas do SUS.',
      membros: [
        { id:'', nome:'Carolina dos Reis Alves',     funcao:'coordenador' },
        { id:'', nome:'Herick Rodrigues Araújo',      funcao:'membro' },
        { id:'', nome:'Márcio Cardoso da Silva',      funcao:'membro' },
        { id:'', nome:'Mariana Cristina Meira Cambuí',funcao:'membro' },
        { id:'', nome:'Washington Luis Carvalho Souto',funcao:'membro' },
      ]
    },
    {
      id: 'COM-002', sigla: 'CTAPS',
      nome: 'Câmara Técnica de Atenção Primária à Saúde',
      tipo: 'camara', status: 'ativo',
      desc: 'Acompanha as políticas de atenção primária, saúde da família e cuidados básicos no município.',
      membros: [
        { id:'', nome:'Amanda Mendes Soares',                  funcao:'coordenador' },
        { id:'', nome:'Ana Maria Pereira de Souza Rodrigues',  funcao:'membro' },
        { id:'', nome:'Anielly Costa Silva',                   funcao:'membro' },
        { id:'', nome:'Danielle Santos Sousa',                 funcao:'membro' },
        { id:'', nome:'Emanuela Tomas da Silva Conceição',     funcao:'membro' },
        { id:'', nome:'Ernandes Rodrigues Moraes',             funcao:'membro' },
        { id:'', nome:'Fernanda Fagundes Azevedo Sindeaux',    funcao:'membro' },
        { id:'', nome:'Márcio Cardoso da Silva',               funcao:'membro' },
        { id:'', nome:'Maria dos Reis Ribeiro Dias',           funcao:'membro' },
        { id:'', nome:'Mariana Cristina Meira Cambuí',         funcao:'membro' },
        { id:'', nome:'Mônica de Fátima Fernandes Ferreira',   funcao:'membro' },
        { id:'', nome:'Carolina dos Reis Alves',               funcao:'membro' },
        { id:'', nome:'Terezinha Ramos Cordeiro',              funcao:'membro' },
        { id:'', nome:'Valdeci Alves Costa',                   funcao:'membro' },
        { id:'', nome:'Wilhas Ferreira',                       funcao:'membro' },
      ]
    },
    {
      id: 'COM-003', sigla: 'CTPSBMAC',
      nome: 'Câmara Técnica de Prestação de Serviços Assistenciais de Baixa, Média e Alta Complexidade',
      tipo: 'camara', status: 'ativo',
      desc: 'Acompanha a rede de serviços assistenciais nos diferentes níveis de complexidade do SUS.',
      membros: [
        { id:'', nome:'Danielle Santos Sousa',       funcao:'coordenador' },
        { id:'', nome:'Herick Rodrigues Araújo',     funcao:'membro' },
        { id:'', nome:'Márcio Cardoso da Silva',     funcao:'membro' },
        { id:'', nome:'Ruth Alves Xavier Silva',     funcao:'membro' },
        { id:'', nome:'Washington Luis Carvalho Souto',funcao:'membro' },
        { id:'', nome:'Rosana Soares Ruas',          funcao:'membro' },
      ]
    },
    {
      id: 'COM-004', sigla: 'CTVS',
      nome: 'Câmara Técnica de Vigilância em Saúde',
      tipo: 'camara', status: 'ativo',
      desc: 'Acompanha as ações de vigilância epidemiológica, sanitária e ambiental no município.',
      membros: [
        { id:'', nome:'Amanda Mendes Soares',              funcao:'coordenador' },
        { id:'', nome:'Danielle Santos Sousa',             funcao:'membro' },
        { id:'', nome:'Edmilson Alves da Silva',           funcao:'membro' },
        { id:'', nome:'Jamilson Gandra Moreira',           funcao:'membro' },
        { id:'', nome:'Joel Francisco Borges',             funcao:'membro' },
        { id:'', nome:'Lucimere Marta de Souza Amorim',   funcao:'membro' },
        { id:'', nome:'Márcio Cardoso da Silva',           funcao:'membro' },
        { id:'', nome:'Maria Clara Lelis Ramos Cardoso',  funcao:'membro' },
      ]
    },
    {
      id: 'COM-005', sigla: 'CIPAU',
      nome: 'Comissão Intersetorial da Política de Atenção às Urgências e Emergências',
      tipo: 'comissao', status: 'ativo',
      desc: 'Acompanha as políticas de urgência e emergência, incluindo SAMU e UPAs.',
      membros: [
        { id:'', nome:'Emanuela Tomas da Silva Conceição', funcao:'coordenador' },
        { id:'', nome:'Márcio Cardoso da Silva',           funcao:'membro' },
        { id:'', nome:'Silvânia Paiva dos Santos',         funcao:'membro' },
        { id:'', nome:'Wilhas Ferreira',                   funcao:'membro' },
      ]
    },
    {
      id: 'COM-006', sigla: 'CIPSM',
      nome: 'Comissão Intersetorial da Política de Saúde Mental',
      tipo: 'comissao', status: 'ativo',
      desc: 'Acompanha a Rede de Atenção Psicossocial (RAPS) e as políticas de saúde mental.',
      membros: [
        { id:'', nome:'Cláudio Luís de Souza Santos',      funcao:'coordenador' },
        { id:'', nome:'Fernanda Fagundes Azevedo Sindeaux',funcao:'membro' },
        { id:'', nome:'Joel Francisco Borges',             funcao:'membro' },
        { id:'', nome:'Márcio Cardoso da Silva',           funcao:'membro' },
        { id:'', nome:'Marilda Batista da Silva',          funcao:'membro' },
        { id:'', nome:'Rafaela de Souza Freitas',         funcao:'membro' },
      ]
    },
    {
      id: 'COM-007', sigla: 'CISTT',
      nome: 'Comissão Intersetorial de Saúde do Trabalhador e da Trabalhadora',
      tipo: 'comissao', status: 'ativo',
      desc: 'Acompanha as políticas de saúde do trabalhador e ações de vigilância em saúde do trabalho.',
      membros: [
        { id:'', nome:'Ernandes Rodrigues Moraes',         funcao:'coordenador' },
        { id:'', nome:'Joel Francisco Borges',             funcao:'membro' },
        { id:'', nome:'Márcio Cardoso da Silva',           funcao:'membro' },
        { id:'', nome:'Mônica de Fátima Fernandes Ferreira',funcao:'membro' },
        { id:'', nome:'Sheila Silva Mendes',               funcao:'membro' },
        { id:'', nome:'Valdeci Alves Costa',               funcao:'membro' },
      ]
    },
    {
      id: 'COM-008', sigla: 'CIEPCS',
      nome: 'Comissão Intersetorial de Educação Permanente para o Controle Social',
      tipo: 'comissao', status: 'ativo',
      desc: 'Planeja e acompanha ações de educação permanente para conselheiros e participação social.',
      membros: [
        { id:'', nome:'Henrique Andrade Barbosa',  funcao:'coordenador' },
        { id:'', nome:'Márcio Cardoso da Silva',   funcao:'membro' },
        { id:'', nome:'Maurina da Silva Carvalho', funcao:'membro' },
        { id:'', nome:'Sheila Silva Mendes',       funcao:'membro' },
      ]
    },
    {
      id: 'COM-009', sigla: 'CTERI',
      nome: 'Comissão Transitória de Estudo, Análise e Proposição para a Revisão do Regimento Interno',
      tipo: 'transitoria', status: 'ativo',
      desc: 'Comissão temporária responsável pela revisão e atualização do Regimento Interno do CMS-MOC.',
      membros: [
        { id:'', nome:'Anielly Costa Silva',           funcao:'coordenador' },
        { id:'', nome:'Cláudio Luís de Souza Santos',  funcao:'membro' },
        { id:'', nome:'Herick Rodrigues Araújo',       funcao:'membro' },
        { id:'', nome:'Joel Francisco Borges',         funcao:'membro' },
        { id:'', nome:'Márcio Cardoso da Silva',       funcao:'membro' },
        { id:'', nome:'Mariana Cristina Meira Cambuí', funcao:'membro' },
        { id:'', nome:'Sheila Silva Mendes',           funcao:'membro' },
        { id:'', nome:'Valdeci Alves Costa',           funcao:'membro' },
      ]
    },
  ];

  // Verifica se as abas existem
  const sheetCom = _getSheet(ABA.COMISSOES);
  const sheetMem = _getSheet(ABA.COMISSAO_MEMBROS);

  // Mapa de nomes → IDs dos conselheiros (para vincular)
  const rowsCons = _getSheet(ABA.CONSELHEIROS).getDataRange().getValues();
  const nomeParaId = {};
  rowsCons.slice(1).forEach(r => {
    const nome = String(r[CC.NOME] || '').trim().toLowerCase();
    if (nome) nomeParaId[nome] = String(r[CC.ID] || '');
  });

  // Adiciona coluna SIGLA se não existir
  const headCom = sheetCom.getRange(1, 1, 1, sheetCom.getLastColumn()).getValues()[0];
  if (!headCom.map(h=>String(h).toUpperCase()).includes('SIGLA')) {
    sheetCom.getRange(1, sheetCom.getLastColumn() + 1).setValue('SIGLA');
  }

  let comInseridas = 0, memInsertos = 0;

  COMISSOES_SEED.forEach(c => {
    // Verifica se já existe
    const existing = sheetCom.getDataRange().getValues().slice(1);
    if (existing.some(r => String(r[CCOM.ID] || '') === c.id)) return;

    // Insere comissão
    sheetCom.appendRow([c.id, c.nome, c.tipo, c.desc, c.status, c.sigla]);
    comInseridas++;

    // Insere membros
    c.membros.forEach((m, idx) => {
      const nomeLower = m.nome.toLowerCase();
      const idCons    = nomeParaId[nomeLower] || '';
      const memId     = `MEM-${c.id}-${String(idx + 1).padStart(2, '0')}`;
      sheetMem.appendRow([memId, c.id, idCons, m.nome, m.funcao, '', '']);
      memInsertos++;
    });
  });

  _invalidarCache();

  ui.alert(
    '🌱 Seed concluído',
    `${comInseridas} comissão(ões) inserida(s)\n${memInsertos} membro(s) inserido(s)\n\n` +
    (comInseridas === 0 ? 'As comissões já estavam cadastradas.' : 'Dados pré-carregados com sucesso!'),
    ui.ButtonSet.OK
  );
}

// ── Atualizar aba PUSH_SUBSCRIPTIONS no runSetup ──────────────
// Já incluída no ABA object. O runSetup() existente vai criar
// a aba com cabeçalho ao ser executado novamente.
// Adicione manualmente no objeto 'abas' dentro de runSetup():
//
// [ABA.FAVORITOS]: ['ID','ID_CONS','ID_DOC','TIMESTAMP'],
// [ABA.PUSH_SUBSCRIPTIONS]: ['ID','ID_CONS','NOME','PERFIL','SEGMENTO','ONESIGNAL_ID','TIMESTAMP','ATIVO'],
//
// Adicione também no objeto ABA no início do Code.gs:
//   FAVORITOS:          'FAVORITOS',
//   PUSH_SUBSCRIPTIONS: 'PUSH_SUBSCRIPTIONS',
