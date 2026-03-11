/**
 * ui.js — Módulo de interface e renderização
 * ────────────────────────────────────────────
 * Responsável por:
 *  - Renderizar cards de documento
 *  - Renderizar skeletons de carregamento
 *  - Mostrar estado vazio (empty state)
 *  - Exibir toasts de notificação
 *  - Popular selects de filtro
 *  - Utilitários de DOM
 *
 * Secretaria Executiva CMS-MOC | Versão 1.0
 */

const UI = (() => {

  // ── Referências de elementos ──────────────────────────────
  const refs = {};

  function init() {
    refs.grid         = document.getElementById('docs-grid');
    refs.filterTipo   = document.getElementById('filter-tipo');
    refs.filterAno    = document.getElementById('filter-ano');
    refs.searchInput  = document.getElementById('search-input');
    refs.searchClear  = document.getElementById('search-clear');
    refs.docsCount    = document.getElementById('docs-count');
    refs.toastCont    = document.getElementById('toast-container');
    refs.offlineBanner= document.getElementById('offline-banner');
    refs.navName      = document.getElementById('nav-user-name');
    refs.navAvatar    = document.getElementById('nav-avatar');
  }

  // ── Renderiza grid de documentos ─────────────────────────
  function renderGrid(documentos) {
    if (!refs.grid) return;
    refs.grid.innerHTML = '';

    if (!documentos || documentos.length === 0) {
      renderEmpty();
      return;
    }

    const fragment = document.createDocumentFragment();

    documentos.forEach((doc, index) => {
      const card = _buildCard(doc, index);
      fragment.appendChild(card);
    });

    refs.grid.appendChild(fragment);
  }

  // ── Constrói um card de documento ────────────────────────
  function _buildCard(doc, index) {
    const cat   = _getCategoria(doc.tipo);
    const data  = _formatarData(doc.data);
    const icon  = cat.icon  || '📄';
    const badge = cat.badge || 'badge-gray';

    const card = document.createElement('a');
    card.className   = 'doc-card';
    card.href        = doc.link || '#';
    card.target      = '_blank';
    card.rel         = 'noopener noreferrer';
    card.setAttribute('aria-label', `Abrir documento: ${doc.titulo}`);
    card.style.animationDelay = `${index * CONFIG.UI.ANIMATION_DELAY}ms`;

    // Previne abertura se não há link
    if (!doc.link) {
      card.href = '#';
      card.addEventListener('click', (e) => {
        e.preventDefault();
        UI.toast('Link do documento não disponível.', 'info');
      });
    }

    card.innerHTML = `
      <div class="doc-card-top">
        <div class="doc-card-icon">${icon}</div>
        <div class="doc-card-meta">
          <span class="badge ${badge}">${doc.tipo || 'Documento'}</span>
          <span class="doc-year">${doc.ano || ''}</span>
        </div>
      </div>
      <div class="doc-card-body">
        <h3 class="doc-card-title">${_sanitize(doc.titulo)}</h3>
        ${doc.descricao
          ? `<p class="doc-card-desc">${_sanitize(doc.descricao)}</p>`
          : ''}
      </div>
      <div class="doc-card-footer">
        <span class="doc-card-date">${data}</span>
        <span class="doc-card-action">
          Abrir Doc
          <span class="doc-card-action-icon">→</span>
        </span>
      </div>
    `;

    return card;
  }

  // ── Renderiza skeletons de carregamento ──────────────────
  function renderSkeleton(count = CONFIG.UI.SKELETON_CARDS) {
    if (!refs.grid) return;
    refs.grid.innerHTML = '';

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const sk = document.createElement('div');
      sk.className = 'doc-card-skeleton';
      sk.innerHTML = `
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <div class="skeleton" style="width:44px;height:44px;border-radius:10px"></div>
          <div class="skeleton skeleton-line" style="width:80px;height:20px"></div>
        </div>
        <div class="skeleton skeleton-line" style="width:90%;height:16px;margin-bottom:8px"></div>
        <div class="skeleton skeleton-line" style="width:70%;height:14px;margin-bottom:6px"></div>
        <div class="skeleton skeleton-line" style="width:80%;height:14px;margin-bottom:16px"></div>
        <div style="display:flex;justify-content:space-between;padding-top:12px;border-top:1px solid #f0f0f0">
          <div class="skeleton skeleton-line" style="width:70px;height:12px"></div>
          <div class="skeleton skeleton-line" style="width:60px;height:12px"></div>
        </div>
      `;
      fragment.appendChild(sk);
    }

    refs.grid.appendChild(fragment);
  }

  // ── Renderiza empty state ─────────────────────────────────
  function renderEmpty(mensagem = null) {
    if (!refs.grid) return;
    refs.grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">🔍</div>
        <h3 class="empty-title">${mensagem || 'Nenhum documento encontrado'}</h3>
        <p class="empty-desc">
          ${mensagem ? '' : 'Tente ajustar os filtros ou o termo de busca.'}
        </p>
      </div>
    `;
  }

  // ── Atualiza contador de documentos ─────────────────────
  function updateCount(total, filtrado) {
    if (!refs.docsCount) return;
    if (total === filtrado) {
      refs.docsCount.innerHTML = `<strong>${total}</strong> documento${total !== 1 ? 's' : ''}`;
    } else {
      refs.docsCount.innerHTML = `<strong>${filtrado}</strong> de <strong>${total}</strong> documentos`;
    }
  }

  // ── Popula selects de filtro ─────────────────────────────
  function populateFilterTipo(tipos) {
    if (!refs.filterTipo) return;
    const val = refs.filterTipo.value;
    refs.filterTipo.innerHTML = '<option value="">Todos os tipos</option>';
    tipos.forEach(t => {
      const opt = document.createElement('option');
      opt.value       = t;
      opt.textContent = t;
      refs.filterTipo.appendChild(opt);
    });
    if (val) refs.filterTipo.value = val;
  }

  function populateFilterAno(anos) {
    if (!refs.filterAno) return;
    const val = refs.filterAno.value;
    refs.filterAno.innerHTML = '<option value="">Todos os anos</option>';
    anos.forEach(a => {
      const opt = document.createElement('option');
      opt.value       = a;
      opt.textContent = a;
      refs.filterAno.appendChild(opt);
    });
    if (val) refs.filterAno.value = val;
  }

  // ── Popula select de conselheiros (login) ────────────────
  function populateConselheirosSelect(conselheiros) {
    const sel = document.getElementById('select-conselheiro');
    if (!sel) return;
    sel.innerHTML = '<option value="">Selecione seu nome...</option>';
    conselheiros
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .forEach(c => {
        const opt = document.createElement('option');
        opt.value       = c.nome;
        opt.textContent = c.nome;
        opt.dataset.id  = c.id;
        sel.appendChild(opt);
      });
  }

  // ── Info do usuário na navbar ────────────────────────────
  function setNavUser(session) {
    if (refs.navName) {
      refs.navName.textContent = _primeiroNome(session.nome);
    }
    if (refs.navAvatar) {
      refs.navAvatar.textContent = _iniciais(session.nome);
    }
  }

  // ── Toast de notificação ──────────────────────────────────
  /**
   * @param {string} message
   * @param {'default'|'success'|'error'|'info'} type
   */
  function toast(message, type = 'default') {
    if (!refs.toastCont) return;

    const icons = {
      default: '💬',
      success: '✅',
      error:   '❌',
      info:    'ℹ️',
    };

    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.default}</span>
      <span>${message}</span>
    `;

    refs.toastCont.appendChild(el);

    setTimeout(() => {
      el.classList.add('fade-out');
      setTimeout(() => el.remove(), 350);
    }, CONFIG.UI.TOAST_DURATION);
  }

  // ── Banner offline ────────────────────────────────────────
  function setOffline(isOffline) {
    if (!refs.offlineBanner) return;
    refs.offlineBanner.classList.toggle('active', isOffline);
  }

  // ── Loading screen ────────────────────────────────────────
  function hideLoadingScreen() {
    const el = document.getElementById('loading-screen');
    if (!el) return;
    el.classList.add('fade-out');
    setTimeout(() => el.remove(), 500);
  }

  // ── Auxiliares privados ───────────────────────────────────
  function _getCategoria(tipo) {
    const cats = CONFIG.DEFAULT_CATEGORIAS;
    return cats.find(c =>
      c.tipo.toLowerCase() === (tipo || '').toLowerCase()
    ) || {};
  }

  function _formatarData(dataStr) {
    if (!dataStr) return '—';
    try {
      const d = new Date(dataStr);
      if (isNaN(d)) return dataStr;
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
    } catch {
      return dataStr;
    }
  }

  function _sanitize(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;');
  }

  function _primeiroNome(nome) {
    return (nome || '').split(' ')[0];
  }

  function _iniciais(nome) {
    const partes = (nome || '').trim().split(' ');
    if (partes.length >= 2) {
      return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    }
    return (partes[0] || 'U').substring(0, 2).toUpperCase();
  }

  // ── Debounce utilitário ───────────────────────────────────
  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  // ── API pública ───────────────────────────────────────────
  return {
    init,
    renderGrid,
    renderSkeleton,
    renderEmpty,
    updateCount,
    populateFilterTipo,
    populateFilterAno,
    populateConselheirosSelect,
    setNavUser,
    toast,
    setOffline,
    hideLoadingScreen,
    debounce,
  };

})();
