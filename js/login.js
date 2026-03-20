/**
 * login.js — CMS Docs PWA v3
 * Corrigido: loading screen some corretamente em todos os fluxos.
 */

document.addEventListener('DOMContentLoaded', async () => {

  // Se já está logado, redireciona imediatamente
  if (Auth.isAuthenticated()) {
    location.replace(CONFIG.APP.HOME_PAGE || 'home.html');
    return;
  }

  // Não está logado — esconde loading e mostra formulário
  UI.init();
  UI.hideLoadingScreen();

  await _loadConselheiros();

  document.getElementById('login-form')?.addEventListener('submit', _handleSubmit);
  document.getElementById('input-senha')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') _handleSubmit(e);
  });

  // Toggle visibilidade da senha
  const toggleBtn  = document.getElementById('toggle-password');
  const senhaInput = document.getElementById('input-senha');
  if (toggleBtn && senhaInput) {
    toggleBtn.addEventListener('click', () => {
      const isText = senhaInput.type === 'text';
      senhaInput.type = isText ? 'password' : 'text';
      toggleBtn.textContent = isText ? '👁' : '🙈';
    });
  }
});

let _conselheiros = [];

async function _loadConselheiros() {
  const sel = document.getElementById('select-conselheiro');
  if (!sel) return;
  sel.innerHTML = '<option value="">Carregando...</option>';
  sel.disabled = true;
  try {
    _conselheiros = await Api.getConselheiros();
    sel.innerHTML = '<option value="">Selecione seu nome</option>';
    _conselheiros
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
      .forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.nome;
        opt.textContent = c.nome;
        sel.appendChild(opt);
      });
    sel.disabled = false;
    sel.focus();
  } catch (e) {
    sel.innerHTML = '<option value="">Erro — verifique a conexão</option>';
    _mostrarErro('Não foi possível carregar a lista. Verifique sua conexão.');
  }
}

async function _handleSubmit(e) {
  e?.preventDefault();
  _limparErro();

  const sel   = document.getElementById('select-conselheiro');
  const senha = document.getElementById('input-senha');
  const nome  = (sel?.value  || '').trim();
  const pw    = (senha?.value || '').trim();

  if (!nome) { _mostrarErro('Selecione seu nome na lista.'); sel?.focus();   return; }
  if (!pw)   { _mostrarErro('Digite sua senha.');            senha?.focus(); return; }

  const btn = document.getElementById('btn-login');
  if (btn) { btn.disabled = true; btn.textContent = 'Entrando...'; }

  const result = await Api.login(nome, pw);

  if (result.ok) {
    // Redireciona conforme perfil — Diretoria e Presidente vão direto para a área deles
    const p = result.user?.perfil || 'publico';
    const destino = p === 'diretoria'  ? 'diretoria.html'
                  : p === 'presidente' ? 'presidente.html'
                  : CONFIG.APP.HOME_PAGE || 'home.html';
    location.replace(destino);
  } else {
    if (btn) { btn.disabled = false; btn.textContent = 'Entrar'; }
    _mostrarErro(result.message || 'Nome ou senha incorretos.');
    senha?.select();
  }
}

function _mostrarErro(msg) {
  const el = document.getElementById('login-error');
  const tx = document.getElementById('login-error-text');
  if (el && tx) { tx.textContent = msg; el.classList.remove('hidden'); }
}

function _limparErro() {
  document.getElementById('login-error')?.classList.add('hidden');
}
