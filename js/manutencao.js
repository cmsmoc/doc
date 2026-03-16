/**
 * manutencao.js — Sistema de modo manutenção por módulo
 * Incluído em todos os HTMLs de módulo via <script src="js/manutencao.js">
 * Secretaria Executiva CMS-MOC
 */

const Manutencao = (() => {

  /**
   * verificar(nomeModulo)
   * Consulta o GAS e, se o módulo estiver em manutenção ou inativo,
   * renderiza a tela correspondente em vez do conteúdo normal.
   * Retorna: 'ativo' | 'manutencao' | 'inativo'
   */
  async function verificar(nomeModulo) {
    try {
      const url = new URL(CONFIG.API.GAS_URL);
      url.searchParams.set('action', 'getModulosStatus');
      const res  = await fetch(url.toString());
      const data = await res.json();

      if (!data.success) return 'ativo'; // fallback seguro

      const info = data.modulos[nomeModulo];
      if (!info) return 'ativo';

      if (info.status === 'manutencao') {
        _renderManutencao(info.msg);
        return 'manutencao';
      }

      if (info.status === 'inativo') {
        _renderInativo();
        return 'inativo';
      }

      return 'ativo';

    } catch(e) {
      // Se não conseguir verificar, assume ativo (não bloqueia)
      return 'ativo';
    }
  }

  function _renderManutencao(msg) {
    document.getElementById('loading-screen')?.classList.add('fade-out');
    setTimeout(() => document.getElementById('loading-screen')?.remove(), 400);

    const el = document.createElement('div');
    el.id = 'manutencao-screen';
    el.style.cssText = `
      position:fixed;inset:0;background:var(--cms-off);
      display:flex;flex-direction:column;align-items:center;
      justify-content:center;z-index:9000;padding:2rem;text-align:center;
    `;
    el.innerHTML = `
      <div style="font-size:56px;margin-bottom:1.5rem;opacity:.7">🔧</div>
      <h2 style="font-family:'Montserrat',sans-serif;font-size:22px;font-weight:900;
        color:var(--cms-navy);margin-bottom:0.75rem">Módulo em atualização</h2>
      <p style="font-size:14px;color:var(--cms-muted);max-width:360px;line-height:1.7;margin-bottom:1.5rem">
        ${msg || 'Este módulo está temporariamente indisponível enquanto realizamos melhorias. Volte em breve.'}
      </p>
      <a href="home.html" style="display:inline-flex;align-items:center;gap:8px;
        padding:10px 24px;background:var(--cms-navy);color:white;border-radius:8px;
        font-family:'Montserrat',sans-serif;font-size:12px;font-weight:700;
        letter-spacing:0.5px;text-decoration:none">
        ← Voltar ao início
      </a>
    `;
    document.body.appendChild(el);
  }

  function _renderInativo() {
    _renderManutencao('Este módulo não está disponível no momento.');
  }

  return { verificar };

})();
