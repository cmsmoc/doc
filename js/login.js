/**
 * login.js — CMS Docs PWA v3.1
 * MUDANÇA v3.1:
 *  - Após login bem-sucedido: usa returnTo= se presente, senão vai para dashboard.html
 *  - Se já logado: redireciona para dashboard.html diretamente
 *  - login.html só é acessado pelo modal inline de index.html (ou diretamente se preferir)
 */

document.addEventListener('DOMContentLoaded', async () => {

  // Já logado → vai para o destino adequado
  if (Auth.isAuthenticated()) {
    _redirecionar(Auth.getSession());
    return;
  }

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

// ── Carrega lista de conselheiros ─────────────────────────────
let _conselheiros = [];

async function _loadConselheiros() {
  const sel = document.getElementById('select-conselheiro');
  if (!sel) return;
  sel.innerHTML = '<option value="">Carregando...</option>';
  sel.disabled  = true;
  try {
    _conselheiros = await Api.getConselheiros();
    sel.innerHTML = '<option value="">Selecione seu nome</option>';
    _conselheiros
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
      .forEach(c => {
        const opt = document.createElement('option');
        opt.value       = c.nome;
        opt.textContent = c.nome;
        sel.appendChild(opt);
      });
    sel.disabled = false;
    sel.focus();
  } catch {
    sel.innerHTML = '<option value="">Erro — verifique a conexão</option>';
    _mostrarErro('Não foi possível carregar a lista. Verifique sua conexão.');
  }
}

// ── Submit ────────────────────────────────────────────────────
async function _handleSubmit(e) {
  e?.preventDefault();
  _limparErro();

  const sel   = document.getElementById('select-conselheiro');
  const senha = document.getElementById('input-senha');
  const nome  = (sel?.value   || '').trim();
  const pw    = (senha?.value || '').trim();

  if (!nome) { _mostrarErro('Selecione seu nome na lista.'); sel?.focus();   return; }
  if (!pw)   { _mostrarErro('Digite sua senha.');            senha?.focus(); return; }

  const btn = document.getElementById('btn-login');
  if (btn) { btn.disabled = true; btn.textContent = 'Entrando...'; }

  const result = await Api.login(nome, pw);

  if (result.ok) {
    _redirecionar(result.user);
  } else {
    if (btn) { btn.disabled = false; btn.textContent = 'Entrar'; }
    _mostrarErro(result.message || 'Nome ou senha incorretos.');
    senha?.select();
  }
}

// ── Redirecionar após login ───────────────────────────────────
function _redirecionar(user) {
  const perfil = user?.perfil || 'publico';

  // Perfis especiais vão direto para área deles
  if (perfil === 'diretoria')  { location.replace('diretoria.html');  return; }
  if (perfil === 'presidente') { location.replace('presidente.html'); return; }

  // Verifica se há returnTo na URL (vindo de página protegida)
  const params   = new URLSearchParams(window.location.search);
  const returnTo = params.get('returnTo');
  if (returnTo) {
    location.replace(decodeURIComponent(returnTo));
    return;
  }

  // Destino padrão após login: dashboard do conselheiro
  location.replace('dashboard.html');
}

// ── Helpers de erro ───────────────────────────────────────────
function _mostrarErro(msg) {
  const el = document.getElementById('login-error');
  const tx = document.getElementById('login-error-text');
  if (el && tx) { tx.textContent = msg; el.classList.remove('hidden'); }
}

function _limparErro() {
  document.getElementById('login-error')?.classList.add('hidden');
}