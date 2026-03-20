/**
 * api.js — CMS Docs PWA v3
 * Camada de comunicação com o GAS.
 *
 * MUDANÇAS v3:
 *  - Endpoint único _req() com retry automático (1x)
 *  - Cache client unificado com invalidação seletiva
 *  - Novos endpoints: perfil, comissões, push subscription, favoritos
 *  - Remoção de duplicações (getConfig == getHomeConfig eram dois endpoints)
 *  - Todos os erros retornam { ok: false, message } para tratamento uniforme
 */

const Api = (() => {

  // ── Configuração ────────────────────────────────────────────
  const BASE    = CONFIG.API.GAS_URL;
  const TIMEOUT = CONFIG.API.TIMEOUT || 12000;
  const SK      = CONFIG.SESSION;

  // ── Cache client ────────────────────────────────────────────
  const _CACHE = {
    TTL: {
      long:  10 * 60 * 1000,  // 10min — dados estáveis (categorias, conselheiros, comissões)
      short:  5 * 60 * 1000,  //  5min — dados semi-dinâmicos (docs, config)
      live:   1 * 60 * 1000,  //  1min — dados dinâmicos (avisos, solicitações)
    },
    _store: {},

    get(key) {
      const entry = this._store[key];
      if (!entry) return null;
      if (Date.now() - entry.ts > entry.ttl) { delete this._store[key]; return null; }
      return entry.data;
    },

    set(key, data, ttl) {
      this._store[key] = { data, ts: Date.now(), ttl: ttl || this.TTL.short };
    },

    del(key) { delete this._store[key]; },

    clear(pattern) {
      if (!pattern) { this._store = {}; return; }
      Object.keys(this._store).forEach(k => { if (k.includes(pattern)) delete this._store[k]; });
    },
  };

  // ── Sessão ──────────────────────────────────────────────────
  function _session() {
    try { return JSON.parse(localStorage.getItem(SK.KEY) || '{}'); } catch { return {}; }
  }

  // ── Request base com retry ───────────────────────────────────
  async function _req(params = {}, retries = 1) {
    const url = new URL(BASE);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT);

    try {
      const res = await fetch(url.toString(), { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      return data;
    } catch (e) {
      clearTimeout(timer);
      if (retries > 0 && e.name !== 'AbortError') {
        await new Promise(r => setTimeout(r, 800));
        return _req(params, retries - 1);
      }
      if (e.name === 'AbortError') throw new Error('Conexão esgotada. Verifique sua internet.');
      throw e;
    }
  }

  // ── Auth ────────────────────────────────────────────────────
  async function login(nome, senha) {
    try {
      const d = await _req({ action: 'login', nome: nome.trim(), senha: senha.trim() });
      if (d.success) {
        localStorage.setItem(SK.KEY, JSON.stringify(d.user));
        return { ok: true, user: d.user };
      }
      return { ok: false, message: d.message };
    } catch (e) {
      return { ok: false, message: e.message };
    }
  }

  async function alterarSenha(senhaAtual, novaSenha) {
    const s = _session();
    return _req({ action: 'alterarSenha', nome: s.nome, senhaAtual, novaSenha });
  }

  // ── Documentos ──────────────────────────────────────────────
  async function getDocumentos(force = false) {
    const s = _session();
    const k = 'docs_' + (s.perfil || 'publico');
    if (!force) { const c = _CACHE.get(k); if (c) return c; }

    const d = await _req({ action: 'getDocumentos', perfil: s.perfil || 'publico' });
    if (!d.success) throw new Error(d.message);
    _CACHE.set(k, d.documentos, _CACHE.TTL.short);
    return d.documentos;
  }

  async function refreshDocumentos() { return getDocumentos(true); }

  // ── Config / Home ────────────────────────────────────────────
  async function getHomeConfig(force = false) {
    const k = 'config';
    if (!force) { const c = _CACHE.get(k); if (c) return c; }
    const d = await _req({ action: 'getHomeConfig' });
    const cfg = d.success ? d.config : {};
    _CACHE.set(k, cfg, _CACHE.TTL.long);
    return cfg;
  }

  // ── Avisos ──────────────────────────────────────────────────
  async function getAvisos() {
    const s = _session();
    const k = 'avisos_' + (s.perfil || 'publico');
    const c = _CACHE.get(k); if (c) return c;
    const d = await _req({ action: 'getAvisos', perfil: s.perfil || 'publico' });
    const list = d.success ? d.avisos : [];
    _CACHE.set(k, list, _CACHE.TTL.live);
    return list;
  }

  // ── Conselheiros ─────────────────────────────────────────────
  async function getConselheiros() {
    const k = 'conselheiros';
    const c = _CACHE.get(k); if (c) return c;
    const d = await _req({ action: 'getConselheiros' });
    if (!d.success) return [];
    _CACHE.set(k, d.conselheiros, _CACHE.TTL.long);
    return d.conselheiros;
  }

  // ── Categorias ───────────────────────────────────────────────
  async function getCategorias() {
    const k = 'cats';
    const c = _CACHE.get(k); if (c) return c;
    const d = await _req({ action: 'getCategorias' });
    const list = d.success && d.categorias?.length ? d.categorias : CONFIG.DEFAULT_CATEGORIAS;
    _CACHE.set(k, list, _CACHE.TTL.long);
    return list;
  }

  // ── Módulos status ───────────────────────────────────────────
  async function getModulosStatus() {
    const k = 'modulos';
    const c = _CACHE.get(k); if (c) return c;
    const d = await _req({ action: 'getModulosStatus' });
    const modulos = d.success ? d.modulos : {};
    _CACHE.set(k, modulos, _CACHE.TTL.short);
    return modulos;
  }

  // ── Atas ─────────────────────────────────────────────────────
  async function getAtas() {
    const s = _session();
    const d = await _req({ action: 'getAtas', perfil: s.perfil || 'publico' });
    return d.success ? d.atas : [];
  }

  async function getAtasPendentes() {
    const s = _session();
    if (!s.id) return [];
    const d = await _req({ action: 'getAtasPendentes', id: s.id });
    return d.success ? d.pendentes : [];
  }

  async function aprovarAta(idAta) {
    const s = _session();
    return _req({ action: 'aprovarAta', id: s.id, id_ata: idAta, nome: s.nome });
  }

  // ── Reuniões ─────────────────────────────────────────────────
  async function getReunioes() {
    const d = await _req({ action: 'getReunioes' });
    return d.success ? d.reunioes : [];
  }

  // ── Meus Documentos ──────────────────────────────────────────
  async function getMeusDocs() {
    const s = _session();
    if (!s.id) return [];
    const d = await _req({ action: 'getMeusDocs', id: s.id });
    return d.success ? d.documentos : [];
  }

  // ── Solicitações ─────────────────────────────────────────────
  async function enviarSolicitacao(tipo, assunto, descricao) {
    const s = _session();
    return _req({ action: 'enviarSolicitacao', id: s.id, nome: s.nome, tipo, assunto, descricao });
  }

  async function getSolicitacoes() {
    const s = _session();
    return _req({ action: 'getSolicitacoes', id: s.id, perfil: s.perfil || 'publico' });
  }

  // ── Comissões ────────────────────────────────────────────────
  async function getComissoes(force = false) {
    const k = 'comissoes';
    if (!force) { const c = _CACHE.get(k); if (c) return c; }
    const d = await _req({ action: 'getComissoes' });
    const list = d.success ? d.comissoes : [];
    _CACHE.set(k, list, _CACHE.TTL.long);
    return list;
  }

  async function getComissaoDetalhe(id) {
    const k = 'comissao_' + id;
    const c = _CACHE.get(k); if (c) return c;
    const d = await _req({ action: 'getComissaoDetalhe', id });
    if (!d.success) return null;
    _CACHE.set(k, d.comissao, _CACHE.TTL.long);
    return d.comissao;
  }

  async function getMinhasComissoes() {
    const s = _session();
    if (!s.id) return [];
    const k = 'minhas_comissoes_' + s.id;
    const c = _CACHE.get(k); if (c) return c;
    const d = await _req({ action: 'getMinhasComissoes', id: s.id });
    const list = d.success ? d.comissoes : [];
    _CACHE.set(k, list, _CACHE.TTL.long);
    return list;
  }

  // ── Perfil ───────────────────────────────────────────────────
  async function getPerfil() {
    const s = _session();
    if (!s.id) return null;
    const k = 'perfil_' + s.id;
    const c = _CACHE.get(k); if (c) return c;
    const d = await _req({ action: 'getPerfil', id: s.id });
    if (!d.success) return null;
    _CACHE.set(k, d.perfil, _CACHE.TTL.short);
    return d.perfil;
  }

  async function atualizarPerfil(dados) {
    const s = _session();
    _CACHE.del('perfil_' + s.id);
    return _req({ action: 'atualizarPerfil', id: s.id, ...dados });
  }

  // ── Favoritos ────────────────────────────────────────────────
  async function getFavoritos() {
    const s = _session();
    if (!s.id) return [];
    const k = 'favs_' + s.id;
    const c = _CACHE.get(k); if (c) return c;
    const d = await _req({ action: 'getFavoritos', id: s.id });
    const list = d.success ? d.favoritos : [];
    _CACHE.set(k, list, _CACHE.TTL.short);
    return list;
  }

  async function toggleFavorito(docId) {
    const s = _session();
    _CACHE.del('favs_' + s.id);
    return _req({ action: 'toggleFavorito', id: s.id, doc_id: docId });
  }

  // ── Push Notifications (OneSignal) ───────────────────────────
  async function salvarPushSubscription(oneSignalUserId) {
    const s = _session();
    return _req({
      action: 'salvarPushSubscription',
      id:              s.id || '',
      nome:            s.nome || '',
      onesignal_id:    oneSignalUserId,
      perfil:          s.perfil || 'publico',
      segmento:        s.segmento || '',
    });
  }

  async function removerPushSubscription() {
    const s = _session();
    if (!s.id) return { success: true };
    return _req({ action: 'removerPushSubscription', id: s.id });
  }

  // ── Log ──────────────────────────────────────────────────────
  function registrarLog(acao, detalhes = '') {
    const s = _session();
    _req({ action: 'registrarLog', id: s.id || '', nome: s.nome || '', acao, det: detalhes })
      .catch(() => {});
  }

  // ── Utilitários públicos ──────────────────────────────────────
  function clearCache(pattern) { _CACHE.clear(pattern); }

  return {
    // Auth
    login, alterarSenha,
    // Docs
    getDocumentos, refreshDocumentos,
    // Home / Config
    getHomeConfig, getAvisos, getModulosStatus,
    // Listas
    getConselheiros, getCategorias,
    // Módulos
    getAtas, getAtasPendentes, aprovarAta,
    getReunioes, getMeusDocs,
    enviarSolicitacao, getSolicitacoes,
    // Comissões
    getComissoes, getComissaoDetalhe, getMinhasComissoes,
    // Perfil
    getPerfil, atualizarPerfil,
    // Favoritos
    getFavoritos, toggleFavorito,
    // Push
    salvarPushSubscription, removerPushSubscription,
    // Utils
    registrarLog, clearCache,
  };
})();
