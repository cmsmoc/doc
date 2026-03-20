/**
 * login.js — CMS Docs PWA v3
 * MUDANÇA v3: redireciona para home.html (CONFIG.APP.HOME_PAGE)
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Se já está logado, vai direto para home
  if (Auth.isAuthenticated()) {
    location.replace(CONFIG.APP.HOME_PAGE || 'home.html');
    return;
  }

  UI.init();
  await _loadConselheiros();

  document.getElementById('login-form')?.addEventListener('submit', _handleSubmit);
  document.getElementById('senha')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') _handleSubmit(e);
  });
});

let _conselheiros = [];

async function _loadConselheiros() {
  const sel = document.getElementById('nome');
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
    sel.innerHTML = '<option value="">Erro ao carregar — verifique a conexão</option>';
    console.error('[Login] Erro ao carregar conselheiros:', e);
  }
}

async function _handleSubmit(e) {
  e?.preventDefault();

  const nome  = (document.getElementById('nome')?.value  || '').trim();
  const senha = (document.getElementById('senha')?.value || '').trim();

  if (!nome)  { UI.mostrarErroLogin('Selecione seu nome.'); return; }
  if (!senha) { UI.mostrarErroLogin('Informe a senha.');    return; }

  const btn = document.getElementById('btn-login');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="btn-spinner"></span> Entrando...'; }

  const result = await Api.login(nome, senha);

  if (result.ok) {
    // Redireciona para a home configurável
    location.replace(CONFIG.APP.HOME_PAGE || 'home.html');
  } else {
    if (btn) { btn.disabled = false; btn.textContent = 'Entrar'; }
    UI.mostrarErroLogin(result.message || 'Nome ou senha incorretos.');
  }
}
