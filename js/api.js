/**
 * api.js — Módulo de comunicação com o backend (Google Apps Script)
 * ──────────────────────────────────────────────────────────────────
 * Abstrai todas as chamadas ao GAS e ao cache local.
 * Qualquer nova funcionalidade que precise de dados deve
 * ter sua função aqui.
 *
 * Secretaria Executiva CMS-MOC | Versão 1.0
 */

const Api = (() => {

  const BASE_URL    = CONFIG.API.GAS_URL;
  const TIMEOUT     = CONFIG.API.TIMEOUT;
  const CACHE_KEY   = CONFIG.SESSION.DOCS_CACHE;
  const CACHE_TTL   = CONFIG.SESSION.CACHE_TTL;

  // ── Fetch genérico com timeout e tratamento de erro ───────
  async function request(params = {}) {
    try {
      const url = new URL(BASE_URL);
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

      const controller = new AbortController();
      const timeout    = setTimeout(() => controller.abort(), TIMEOUT);

      const res = await fetch(url.toString(), { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      return await res.json();

    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Tempo de conexão esgotado. Verifique sua internet.');
      }
      throw err;
    }
  }

  // ── Lê lista de nomes para o select do login ──────────────
  async function getConselheiros() {
    const data = await request({ action: 'getConselheiros' });
    if (!data.success) throw new Error(data.message || 'Erro ao carregar conselheiros.');
    return data.conselheiros; // Array de { id, nome, segmento }
  }

  // ── Carrega documentos ativos ─────────────────────────────
  async function getDocumentos() {
    // 1. Tenta cache válido
    const cached = _readCache(CACHE_KEY);
    if (cached) return cached;

    // 2. Busca no GAS
    const data = await request({ action: 'getDocumentos' });
    if (!data.success) throw new Error(data.message || 'Erro ao carregar documentos.');

    // 3. Salva cache
    _writeCache(CACHE_KEY, data.documentos);
    return data.documentos;
  }

  // ── Força recarga dos documentos (ignora cache) ──────────
  async function refreshDocumentos() {
    _clearCache(CACHE_KEY);
    return getDocumentos();
  }

  // ── Carrega categorias dinâmicas ──────────────────────────
  async function getCategorias() {
    try {
      const data = await request({ action: 'getCategorias' });
      if (data.success && data.categorias?.length) return data.categorias;
    } catch {
      // Fallback silencioso para categorias padrão
    }
    return CONFIG.DEFAULT_CATEGORIAS;
  }

  // ── Carrega configurações dinâmicas da planilha ──────────
  async function getConfig() {
    try {
      const data = await request({ action: 'getConfig' });
      if (data.success) return data.config;
    } catch {
      // Fallback silencioso
    }
    return {};
  }

  // ── Utilitários de cache ──────────────────────────────────
  function _readCache(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts > CACHE_TTL) return null; // Expirado
      return data;
    } catch {
      return null;
    }
  }

  function _writeCache(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
    } catch {
      // localStorage cheio — ignora silenciosamente
    }
  }

  function _clearCache(key) {
    localStorage.removeItem(key);
  }

  // ── API pública ───────────────────────────────────────────
  return {
    getConselheiros,
    getDocumentos,
    refreshDocumentos,
    getCategorias,
    getConfig,
  };

})();
