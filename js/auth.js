/**
 * auth.js — CMS Docs PWA v3.1
 * MUDANÇA v3.1:
 *  - isAuthenticated() agora é puramente verificação — sem redirect
 *  - requireAuth() redireciona para INDEX (home pública) com returnTo=
 *  - getSession() exposto publicamente para uso em index.html
 *  - logout() limpa sessão e volta para index.html
 */

const Auth = (() => {

  const SK = (typeof CONFIG !== 'undefined' && CONFIG.SESSION?.KEY)
    ? CONFIG.SESSION.KEY
    : 'cms_session';

  // ── Lê a sessão atual ─────────────────────────────────────
  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(SK) || '{}');
    } catch {
      return {};
    }
  }

  // ── Verifica se está autenticado (sem redirect) ───────────
  // Use isso em qualquer página para adaptar UI sem forçar login
  function isAuthenticated() {
    const s = getSession();
    return !!(s && s.id && s.nome);
  }

  // ── Exige autenticação — redireciona se não estiver logado ─
  // Use apenas em páginas restritas (dashboard, diretoria, etc.)
  // Redireciona para index.html?returnTo=<página_atual>
  function requireAuth() {
    if (!isAuthenticated()) {
      const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.replace('index.html?login=1&returnTo=' + returnTo);
      return false;
    }
    return true;
  }

  // ── Logout ────────────────────────────────────────────────
  function logout() {
    localStorage.removeItem(SK);
    // Volta para a home pública
    window.location.replace('index.html');
  }

  // ── Inicializa UI de navegação (avatar/nome na navbar) ────
  // Chamado por cada página para popular o estado do usuário
  function initNavbar() {
    const s = getSession();
    const avatar   = document.getElementById('nav-avatar');
    const userName = document.getElementById('nav-user-name');
    if (!avatar || !userName) return;

    if (s.nome) {
      const partes  = s.nome.trim().split(' ').filter(Boolean);
      const iniciais = ((partes[0]?.[0] || '') + (partes[partes.length - 1]?.[0] || '')).toUpperCase();
      avatar.textContent   = iniciais;
      userName.textContent = partes[0];
    }
  }

  return {
    getSession,
    isAuthenticated,
    requireAuth,
    logout,
    initNavbar,
  };

})();