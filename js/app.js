/**
 * app.js — Orquestrador principal do Dashboard
 * ─────────────────────────────────────────────
 * Inicializa o dashboard, conecta os módulos,
 * gerencia o estado global da aplicação e
 * registra o Service Worker.
 *
 * Dependências (ordem de carregamento no HTML):
 *  config/config.js → js/auth.js → js/api.js
 *  → js/search.js → js/ui.js → js/app.js
 *
 * Secretaria Executiva CMS-MOC | Versão 1.0
 */

// ── Estado global da aplicação ────────────────────────────────
const AppState = {
  documentos:   [],   // Todos os documentos carregados
  filtrados:    [],   // Resultado atual da busca/filtro
  categorias:   [],   // Categorias/tipos carregados
  criterios: {
    texto: '',
    tipo:  '',
    ano:   '',
  },
  isLoading:  false,
  isOffline:  false,
};

// ── Inicialização principal ───────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {

  // 1. Verifica autenticação — redireciona se não logado
  Auth.requireAuth();

  // 2. Inicializa referências de UI
  UI.init();

  // 3. Preenche dados do usuário na navbar
  const session = Auth.getSession();
  UI.setNavUser(session);

  // 4. Registra listeners de eventos da interface
  _bindEvents();

  // 5. Registra Service Worker (PWA)
  _registerServiceWorker();

  // 6. Monitora status de rede
  _monitorNetwork();

  // 7. Inicializa lógica de instalação PWA
  _initPWAInstall();

  // 8. Carrega dados (documentos + categorias)
  await _loadData();

  // 9. Oculta loading screen
  UI.hideLoadingScreen();
});

// ── Carregamento de dados ─────────────────────────────────────
async function _loadData() {
  AppState.isLoading = true;
  UI.renderSkeleton();

  try {
    // Carrega documentos e categorias em paralelo
    const [documentos, categorias] = await Promise.all([
      Api.getDocumentos(),
      Api.getCategorias(),
    ]);

    AppState.documentos = documentos  || [];
    AppState.categorias = categorias  || CONFIG.DEFAULT_CATEGORIAS;

    // Popula filtros com dados reais
    UI.populateFilterTipo(Search.getTipos(AppState.documentos));
    UI.populateFilterAno(Search.getAnos(AppState.documentos));

    // Renderiza todos os documentos inicialmente
    _applyFilters();

  } catch (err) {
    console.error('[App] Erro ao carregar dados:', err);

    // Se offline, tenta cache (a API já tentou — mostra empty state)
    if (!navigator.onLine) {
      UI.renderEmpty('Você está offline. Os documentos em cache estão sendo exibidos.');
      UI.toast('Modo offline ativo — exibindo dados em cache.', 'info');
    } else {
      UI.renderEmpty('Não foi possível carregar os documentos. Verifique sua conexão.');
      UI.toast('Erro ao carregar documentos. Tente recarregar a página.', 'error');
    }
  } finally {
    AppState.isLoading = false;
  }
}

// ── Aplica filtros e busca ao estado atual ────────────────────
function _applyFilters() {
  AppState.filtrados = Search.filter(AppState.documentos, AppState.criterios);
  UI.renderGrid(AppState.filtrados);
  UI.updateCount(AppState.documentos.length, AppState.filtrados.length);
}

// ── Evento: mudança no campo de busca ────────────────────────
const _onSearch = UI.debounce((value) => {
  AppState.criterios.texto = value;
  _applyFilters();
  // Mostra/oculta botão de limpar
  const clearBtn = document.getElementById('search-clear');
  if (clearBtn) clearBtn.classList.toggle('hidden', !value);
}, CONFIG.UI.DEBOUNCE_SEARCH);

// ── Bind de todos os eventos de interface ─────────────────────
function _bindEvents() {

  // Campo de busca
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => _onSearch(e.target.value));
  }

  // Limpar busca
  const searchClear = document.getElementById('search-clear');
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      const si = document.getElementById('search-input');
      if (si) { si.value = ''; si.focus(); }
      AppState.criterios.texto = '';
      searchClear.classList.add('hidden');
      _applyFilters();
    });
  }

  // Filtro tipo
  const filterTipo = document.getElementById('filter-tipo');
  if (filterTipo) {
    filterTipo.addEventListener('change', (e) => {
      AppState.criterios.tipo = e.target.value;
      _applyFilters();
    });
  }

  // Filtro ano
  const filterAno = document.getElementById('filter-ano');
  if (filterAno) {
    filterAno.addEventListener('change', (e) => {
      AppState.criterios.ano = e.target.value;
      _applyFilters();
    });
  }

  // Limpar todos os filtros
  const clearFilters = document.getElementById('clear-filters');
  if (clearFilters) {
    clearFilters.addEventListener('click', () => {
      AppState.criterios = { texto: '', tipo: '', ano: '' };
      const si = document.getElementById('search-input');
      if (si) si.value = '';
      const ft = document.getElementById('filter-tipo');
      const fa = document.getElementById('filter-ano');
      if (ft) ft.value = '';
      if (fa) fa.value = '';
      document.getElementById('search-clear')?.classList.add('hidden');
      _applyFilters();
    });
  }

  // Botão Logout
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Deseja encerrar a sessão?')) Auth.logout();
    });
  }

  // Botão Recarregar
  const refreshBtn = document.getElementById('btn-refresh');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      UI.toast('Atualizando documentos...', 'info');
      AppState.documentos = await Api.refreshDocumentos();
      UI.populateFilterTipo(Search.getTipos(AppState.documentos));
      UI.populateFilterAno(Search.getAnos(AppState.documentos));
      _applyFilters();
      UI.toast('Documentos atualizados com sucesso!', 'success');
    });
  }
}

// ── Service Worker ────────────────────────────────────────────
function _registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.register('/pwa/service-worker.js')
    .then(reg => {
      console.log('[SW] Registrado:', reg.scope);
    })
    .catch(err => {
      console.warn('[SW] Falha ao registrar:', err);
    });
}

// ── Monitor de rede ───────────────────────────────────────────
function _monitorNetwork() {
  const update = (online) => {
    AppState.isOffline = !online;
    UI.setOffline(!online);
    if (!online) UI.toast('Você está offline. Dados em cache serão usados.', 'info');
    else         UI.toast('Conexão restaurada.', 'success');
  };

  window.addEventListener('offline', () => update(false));
  window.addEventListener('online',  () => update(true));

  // Estado inicial
  if (!navigator.onLine) UI.setOffline(true);
}

// ── PWA Install Prompt ────────────────────────────────────────
function _initPWAInstall() {
  let deferredPrompt = null;
  const banner       = document.getElementById('install-banner');
  const installBtn   = document.getElementById('btn-install');
  const dismissBtn   = document.getElementById('btn-install-dismiss');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (banner) {
      setTimeout(() => banner.classList.add('visible'), 3000);
    }
  });

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        UI.toast('App instalado com sucesso! 🎉', 'success');
      }
      deferredPrompt = null;
      if (banner) banner.classList.remove('visible');
    });
  }

  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      if (banner) banner.classList.remove('visible');
      deferredPrompt = null;
    });
  }

  window.addEventListener('appinstalled', () => {
    if (banner) banner.classList.remove('visible');
  });
}
