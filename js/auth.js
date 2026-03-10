/**
 * auth.js — Módulo de autenticação e sessão
 * ──────────────────────────────────────────
 * Responsável por:
 *  - Validar login via Google Apps Script
 *  - Criar e destruir sessão local (localStorage)
 *  - Verificar se há sessão ativa
 *  - Bloquear acesso a rotas sem sessão
 *
 * Secretaria Executiva CMS-MOC | Versão 1.0
 */

const Auth = (() => {

  // ── Constantes internas ───────────────────────────────────
  const SESSION_KEY = CONFIG.SESSION.KEY;

  // ── Lê a sessão do localStorage ──────────────────────────
  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // ── Verifica se há sessão válida ──────────────────────────
  function isAuthenticated() {
    const session = getSession();
    return session !== null && session.nome && session.id;
  }

  // ── Cria sessão local após login bem-sucedido ─────────────
  function createSession(userData) {
    const session = {
      id:        userData.id,
      nome:      userData.nome,
      segmento:  userData.segmento  || '',
      entidade:  userData.entidade  || '',
      cadeira:   userData.cadeira   || '',
      email:     userData.email     || '',
      timestamp: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  // ── Encerra a sessão local ────────────────────────────────
  function destroySession() {
    localStorage.removeItem(SESSION_KEY);
    // Limpa também o cache de documentos
    localStorage.removeItem(CONFIG.SESSION.DOCS_CACHE);
  }

  /**
   * login(nome, senha)
   * ──────────────────────────────────────────────────────────
   * Envia credenciais ao Apps Script e aguarda resposta.
   * Retorna { ok: true, user: {...} } ou { ok: false, message: '...' }
   */
  async function login(nome, senha) {
    try {
      const url = new URL(CONFIG.API.GAS_URL);
      url.searchParams.set('action', 'login');
      url.searchParams.set('nome',   nome.trim());
      url.searchParams.set('senha',  senha.trim());

      const controller = new AbortController();
      const timeout    = setTimeout(() => controller.abort(), CONFIG.API.TIMEOUT);

      const response = await fetch(url.toString(), {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const session = createSession(data.user);
        return { ok: true, user: session };
      } else {
        return { ok: false, message: data.message || 'Credenciais inválidas.' };
      }

    } catch (err) {
      if (err.name === 'AbortError') {
        return { ok: false, message: 'Tempo de conexão esgotado. Verifique sua internet.' };
      }
      console.error('[Auth] Erro no login:', err);
      return { ok: false, message: 'Não foi possível conectar ao servidor. Tente novamente.' };
    }
  }

  /**
   * logout()
   * ──────────────────────────────────────────────────────────
   * Encerra a sessão e redireciona para o login.
   */
  function logout() {
    destroySession();
    window.location.href = 'login.html';
  }

  /**
   * requireAuth()
   * ──────────────────────────────────────────────────────────
   * Deve ser chamado no início de qualquer página protegida.
   * Se não houver sessão, redireciona para login.
   */
  function requireAuth() {
    if (!isAuthenticated()) {
      window.location.href = 'login.html';
    }
  }

  /**
   * redirectIfLogged()
   * ──────────────────────────────────────────────────────────
   * Chamado na página de login.
   * Se já estiver logado, vai direto ao dashboard.
   */
  function redirectIfLogged() {
    if (isAuthenticated()) {
      window.location.href = 'index.html';
    }
  }

  // ── API pública do módulo ─────────────────────────────────
  return {
    getSession,
    isAuthenticated,
    createSession,
    destroySession,
    login,
    logout,
    requireAuth,
    redirectIfLogged,
  };

})();
