// ══════════════════════════════════════════════════════════════
// WRAPPERS PARA google.script.run (chamados pelo Painel.html)
// Todas as funções chamadas via HtmlService precisam estar
// expostas diretamente no escopo global — sem prefixo "handle".
// ══════════════════════════════════════════════════════════════

function getDashboardData()        { return handleGetDashboardData(); }
function getDocumentosAdmin()      { return handleGetDocumentosAdmin(); }
function getConselheirosAdmin()    { return handleGetConselheirosAdmin(); }
function getLogAcessos(p)          { return handleGetLogAcessos(p || {}); }
function getHomeConfig()           { return handleGetHomeConfig(); }
function getAvisos(p)              { return handleGetAvisos(p || {}); }
function getSolicitacoes(p)        { return handleGetSolicitacoes(p || {}); }
function responderSolicitacao(p)   { return handleResponderSolicitacao(p || {}); }
function addDocumento(p)           { return handleAddDocumento(p || {}); }
function addConselheiro(p)         { return handleAddConselheiro(p || {}); }
function addAviso(p)               { return handleAddAviso(p || {}); }
function getQuotas(p)              { return { success: true, quotas: getQuotasDia() }; }

// ══════════════════════════════════════════════════════════════
// SALVAR CONFIGURAÇÕES (Painel Admin → Config e Módulos)
// ══════════════════════════════════════════════════════════════

function salvarConfigs(updates) {
  if (!updates || typeof updates !== 'object') return _err('Dados inválidos.');
  try {
    const sheet = _getSheet(ABA.CONFIG);
    const rows  = sheet.getDataRange().getValues();
    Object.entries(updates).forEach(([chave, valor]) => {
      let encontrou = false;
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0] || '').trim() === chave) {
          sheet.getRange(i + 1, 2).setValue(valor);
          rows[i][1] = valor; // atualiza cache local do loop
          encontrou = true;
          break;
        }
      }
      if (!encontrou) sheet.appendRow([chave, valor, '']);
    });
    _invalidarCache();
    return { success: true };
  } catch(e) {
    return _err('Erro ao salvar: ' + e.message);
  }
}

// ══════════════════════════════════════════════════════════════
// SISTEMA DE MODO MANUTENÇÃO POR MÓDULO
// ══════════════════════════════════════════════════════════════
//
// Cada módulo pode estar em um de três estados:
//   ativo       → funciona normalmente
//   manutencao  → exibe tela "em atualização" para o usuário
//   inativo     → não aparece no menu (oculto)
//
// Configurado via aba CONFIG com chaves no formato:
//   modulo_<nome>_status  → ativo | manutencao | inativo
//   modulo_<nome>_msg     → mensagem customizada (opcional)
//
// Também controlável pelo Painel Admin (toggle visual).

/**
 * getModulosStatus()
 * Retorna o status de todos os módulos para o Painel Admin
 * e para o frontend verificar antes de renderizar.
 */
function getModulosStatus() {
  try {
    const config = handleGetHomeConfig().config || {};
    const modulos = [
      'documentos', 'atas', 'reunioes', 'meusdocs',
      'solicitacoes', 'diretoria', 'presidente',
      'votacoes', 'calendario', 'comissoes', 'portal'
    ];
    const result = {};
    modulos.forEach(m => {
      result[m] = {
        status: config['modulo_' + m + '_status'] || 'ativo',
        msg:    config['modulo_' + m + '_msg']    || '',
      };
    });
    return { success: true, modulos: result };
  } catch(e) {
    return _err('Erro: ' + e.message);
  }
}

/**
 * setModuloStatus(modulo, status, msg)
 * Atualiza o status de um módulo específico.
 */
function setModuloStatus(params) {
  const modulo = (params.modulo || '').trim();
  const status = (params.status || 'ativo').trim();
  const msg    = (params.msg    || '').trim();
  if (!modulo) return _err('Módulo não informado.');
  const updates = {
    ['modulo_' + modulo + '_status']: status,
    ['modulo_' + modulo + '_msg']:    msg,
  };
  return salvarConfigs(updates);
}

// doGet também expõe getModulosStatus e setModuloStatus
// Adicione estes cases no switch do doGet existente:
//   case 'getModulosStatus': result = getModulosStatus(); break;
//   case 'setModuloStatus':  result = setModuloStatus(params); break;
