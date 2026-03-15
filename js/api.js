/**
 * api.js — Comunicação com o GAS | CMS Docs v2
 * Secretaria Executiva CMS-MOC
 */
const Api = (() => {
  const BASE   = CONFIG.API.GAS_URL;
  const TO     = CONFIG.API.TIMEOUT;
  const SK     = CONFIG.SESSION;

  async function req(params = {}) {
    const url = new URL(BASE);
    Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
    const ctrl = new AbortController();
    const t    = setTimeout(() => ctrl.abort(), TO);
    try {
      const res = await fetch(url.toString(), { signal: ctrl.signal });
      clearTimeout(t);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch(e) {
      clearTimeout(t);
      if (e.name === 'AbortError') throw new Error('Conexão esgotada. Verifique sua internet.');
      throw e;
    }
  }

  // ── Sessão helper ─────────────────────────────────────────
  function _session() {
    try { return JSON.parse(localStorage.getItem(SK.KEY) || '{}'); } catch{ return {}; }
  }

  // ── Auth ──────────────────────────────────────────────────
  async function getConselheiros() {
    const d = await req({ action:'getConselheiros' });
    if (!d.success) throw new Error(d.message);
    return d.conselheiros;
  }

  async function login(nome, senha) {
    try {
      const d = await req({ action:'login', nome: nome.trim(), senha: senha.trim() });
      if (d.success) {
        const s = d.user;
        localStorage.setItem(SK.KEY, JSON.stringify(s));
        return { ok: true, user: s };
      }
      return { ok: false, message: d.message };
    } catch(e) {
      return { ok: false, message: e.message };
    }
  }

  async function alterarSenha(senhaAtual, novaSenha) {
    const s = _session();
    const d = await req({ action:'alterarSenha',
      nome: s.nome, senhaAtual: senhaAtual.trim(), novaSenha: novaSenha.trim() });
    return d;
  }

  // ── Documentos ────────────────────────────────────────────
  async function getDocumentos() {
    const cached = _readCache(SK.DOCS_CACHE);
    if (cached) return cached;
    const s = _session();
    const d = await req({ action:'getDocumentos', perfil: s.perfil || 'publico' });
    if (!d.success) throw new Error(d.message);
    _writeCache(SK.DOCS_CACHE, d.documentos);
    return d.documentos;
  }

  async function refreshDocumentos() {
    _clearCache(SK.DOCS_CACHE);
    return getDocumentos();
  }

  // ── Home ──────────────────────────────────────────────────
  async function getHomeConfig() {
    const cached = _readCache(SK.HOME_CACHE);
    if (cached) return cached;
    const d = await req({ action:'getHomeConfig' });
    const cfg = d.success ? d.config : {};
    _writeCache(SK.HOME_CACHE, cfg);
    return cfg;
  }

  // ── Avisos ────────────────────────────────────────────────
  async function getAvisos() {
    const s = _session();
    const d = await req({ action:'getAvisos', perfil: s.perfil || 'publico' });
    return d.success ? d.avisos : [];
  }

  // ── Meus Docs ─────────────────────────────────────────────
  async function getMeusDocs() {
    const s = _session();
    if (!s.id) return [];
    const d = await req({ action:'getMeusDocs', id: s.id });
    return d.success ? d.documentos : [];
  }

  // ── Atas ──────────────────────────────────────────────────
  async function getAtas() {
    const s = _session();
    const d = await req({ action:'getAtas', perfil: s.perfil || 'publico' });
    return d.success ? d.atas : [];
  }

  async function getAtasPendentes() {
    const s = _session();
    if (!s.id) return [];
    const d = await req({ action:'getAtasPendentes', id: s.id });
    return d.success ? d.pendentes : [];
  }

  async function aprovarAta(idAta) {
    const s = _session();
    return req({ action:'aprovarAta', id: s.id, id_ata: idAta, nome: s.nome });
  }

  // ── Reuniões ──────────────────────────────────────────────
  async function getReunioes() {
    const s = _session();
    const d = await req({ action:'getReunioes', perfil: s.perfil || 'publico' });
    return d.success ? d.reunioes : [];
  }

  // ── Solicitações ──────────────────────────────────────────
  async function enviarSolicitacao(tipo, assunto, descricao) {
    const s = _session();
    return req({ action:'enviarSolicitacao',
      id: s.id, nome: s.nome, tipo, assunto, descricao });
  }

  async function getSolicitacoes() {
    const s = _session();
    return req({ action:'getSolicitacoes', id: s.id, perfil: s.perfil || 'publico' });
  }

  // ── Log ───────────────────────────────────────────────────
  function registrarLog(acao, detalhes = '') {
    const s = _session();
    req({ action:'registrarLog', id: s.id || '', nome: s.nome || '', acao, det: detalhes })
      .catch(() => {}); // silencioso
  }

  // ── Admin ─────────────────────────────────────────────────
  async function getDashboardData() {
    return req({ action:'getDashboardData' });
  }

  async function getLogAcessos(limit = 200) {
    const d = await req({ action:'getLogAcessos', limit });
    return d.success ? d.log : [];
  }

  async function getConselheirosAdmin() {
    const d = await req({ action:'getConselheirosAdmin' });
    return d.success ? d.conselheiros : [];
  }

  async function getDocumentosAdmin() {
    const d = await req({ action:'getDocumentosAdmin' });
    return d.success ? d.documentos : [];
  }

  async function addDocumento(dados) {
    return req({ action:'addDocumento', ...dados });
  }

  async function addAviso(dados) {
    return req({ action:'addAviso', ...dados });
  }

  // ── Categorias / Config ───────────────────────────────────
  async function getCategorias() {
    try {
      const d = await req({ action:'getCategorias' });
      if (d.success && d.categorias?.length) return d.categorias;
    } catch{}
    return CONFIG.DEFAULT_CATEGORIAS;
  }

  // ── Cache ──────────────────────────────────────────────────
  function _readCache(key) {
    try {
      const r = localStorage.getItem(key);
      if (!r) return null;
      const { data, ts } = JSON.parse(r);
      return Date.now() - ts > SK.CACHE_TTL ? null : data;
    } catch{ return null; }
  }

  function _writeCache(key, data) {
    try { localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })); } catch{}
  }

  function _clearCache(key) { localStorage.removeItem(key); }

  function clearAllCache() {
    _clearCache(SK.DOCS_CACHE);
    _clearCache(SK.HOME_CACHE);
  }

  return {
    getConselheiros, login, alterarSenha,
    getDocumentos, refreshDocumentos,
    getHomeConfig, getAvisos,
    getMeusDocs, getAtas, getAtasPendentes, aprovarAta,
    getReunioes, enviarSolicitacao, getSolicitacoes,
    registrarLog,
    getDashboardData, getLogAcessos, getConselheirosAdmin,
    getDocumentosAdmin, addDocumento, addAviso,
    getCategorias, clearAllCache,
  };
})();
