/**
 * login.js — Lógica da tela de login
 * ─────────────────────────────────────────────
 * Gerencia o formulário de login, carregamento
 * da lista de conselheiros e validação.
 *
 * Secretaria Executiva CMS-MOC | Versão 1.0
 */

document.addEventListener('DOMContentLoaded', async () => {

  // Se já logado, vai para o dashboard
  Auth.redirectIfLogged();

  // Referências do DOM
  const form        = document.getElementById('login-form');
  const selConselho = document.getElementById('select-conselheiro');
  const inputSenha  = document.getElementById('input-senha');
  const btnLogin    = document.getElementById('btn-login');
  const togglePwd   = document.getElementById('toggle-password');
  const errorMsg    = document.getElementById('login-error');

  // ── Carrega lista de conselheiros ─────────────────────────
  await _loadConselheiros();

  // ── Eventos ───────────────────────────────────────────────

  // Toggle visibilidade da senha
  if (togglePwd) {
    togglePwd.addEventListener('click', () => {
      const isText = inputSenha.type === 'text';
      inputSenha.type     = isText ? 'password' : 'text';
      togglePwd.textContent = isText ? '👁' : '🙈';
    });
  }

  // Limpa erros ao digitar
  selConselho?.addEventListener('change', _clearErrors);
  inputSenha?.addEventListener('input',   _clearErrors);

  // Submissão do formulário
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await _handleLogin();
  });

  // Oculta loading screen
  UI.hideLoadingScreen();

  // ── Funções internas ──────────────────────────────────────

  async function _loadConselheiros() {
    try {
      const list = await Api.getConselheiros();
      UI.populateConselheirosSelect(list);
    } catch (err) {
      console.warn('[Login] Erro ao carregar conselheiros:', err);
      // Fallback: campo de texto livre
      _fallbackToTextInput();
    }
  }

  function _fallbackToTextInput() {
    if (!selConselho) return;
    const input = document.createElement('input');
    input.type        = 'text';
    input.id          = 'select-conselheiro';
    input.className   = 'form-control';
    input.placeholder = 'Digite seu nome completo';
    input.required    = true;
    selConselho.replaceWith(input);
  }

  async function _handleLogin() {
    const nome  = document.getElementById('select-conselheiro')?.value?.trim();
    const senha = inputSenha?.value?.trim();

    // Validação básica no frontend
    if (!nome) {
      _showError('Selecione seu nome para continuar.');
      document.getElementById('select-conselheiro')?.classList.add('error');
      return;
    }
    if (!senha || senha.length < 3) {
      _showError('Informe sua senha.');
      inputSenha?.classList.add('error');
      return;
    }

    // Estado de carregamento no botão
    _setLoading(true);

    const result = await Auth.login(nome, senha);

    if (result.ok) {
      UI.toast('Login realizado com sucesso!', 'success');
      setTimeout(() => {
        window.location.href = 'home.html';
      }, 600);
    } else {
      _setLoading(false);
      _showError(result.message || 'Credenciais inválidas. Tente novamente.');
      inputSenha?.classList.add('error');
    }
  }

  function _showError(msg) {
    if (!errorMsg) return;
    errorMsg.textContent = msg;
    errorMsg.classList.remove('hidden');
  }

  function _clearErrors() {
    errorMsg?.classList.add('hidden');
    document.getElementById('select-conselheiro')?.classList.remove('error');
    inputSenha?.classList.remove('error');
  }

  function _setLoading(loading) {
    if (!btnLogin) return;
    btnLogin.disabled = loading;
    btnLogin.innerHTML = loading
      ? `<span class="btn-spinner"></span> Verificando...`
      : `Entrar`;
  }

});
