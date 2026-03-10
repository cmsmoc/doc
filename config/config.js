/**
 * config.js — Configurações centrais do CMS Docs PWA
 * ─────────────────────────────────────────────────
 * Todas as constantes de configuração ficam aqui.
 * Para expandir o sistema, altere este arquivo
 * ou aponte para uma nova planilha/endpoint.
 *
 * Secretaria Executiva CMS-MOC | Versão 1.0
 */

const CONFIG = {

  /**
   * IDENTIDADE DO SISTEMA
   */
  APP: {
    name:        'CMS Docs',
    fullName:    'Conselho Municipal de Saúde — Documentos',
    version:     '1.0.0',
    institution: 'Conselho Municipal de Saúde de Montes Claros',
    shortName:   'CMS-MOC Docs',
    description: 'Biblioteca digital de documentos institucionais',
    contact:     'secretaria@cmsmoc.mg.gov.br',
  },

  /**
   * GOOGLE SHEETS / APPS SCRIPT
   * ─────────────────────────────────────────────────────────
   * GAS_URL: URL do Apps Script implantado como WebApp.
   * Substitua após implantar o script no Google Apps Script.
   * SHEET_ID: ID da planilha Google Sheets principal.
   */
  API: {
    GAS_URL:  'https://script.google.com/macros/s/AKfycbwWxaGjofMul-5MV6E_YVS3CWsic8cv3--YnDBBsUgu395s5e1ZUO2lbC8X33K0Lu9E/exec',
    SHEET_ID: '1_6uxp2YjjmOKa5xkyc_l4jnVpCCex-M1GaXVSTn3HAM',
    TIMEOUT:  10000,  // ms antes de exibir erro de rede
  },

  /**
   * SESSÃO LOCAL
   * ─────────────────────────────────────────────────────────
   * Chaves usadas no localStorage para persistência de sessão.
   */
  SESSION: {
    KEY:        'cms_session',
    DOCS_CACHE: 'cms_docs_cache',
    CACHE_TTL:  15 * 60 * 1000,  // 15 minutos em ms
  },

  /**
   * CACHE / SERVICE WORKER
   * ─────────────────────────────────────────────────────────
   */
  CACHE: {
    NAME:    'cms-docs-v1',
    VERSION: 1,
  },

  /**
   * IDENTIDADE VISUAL
   * ─────────────────────────────────────────────────────────
   * Paleta e logos — esses valores alimentam o sistema visual.
   * Futuramente podem vir de uma planilha de configuração.
   */
  BRAND: {
    colors: {
      blue:   '#1B6CB5',
      navy:   '#0D2E5A',
      green:  '#1E8A4A',
      yellow: '#F5C400',
    },
    logos: {
      horizontal_branco: 'https://i.ibb.co/HLG4tvfn/LOGOTIPO-CONSELHO-BRANCO.png',
      horizontal_preto:  'https://i.ibb.co/XkSh01M8/LOGOTIPO-CONSELHO-PRETO.png',
      vertical_branco:   'https://i.ibb.co/spFXYwhW/LOGO-CONSELHO-VERTICAL-TEXTO-BRANCO.png',
      icon_512:          'https://i.ibb.co/ksxpJdVw/iconcms512.png',
      icon_192:          'https://i.ibb.co/4g2ZZyGZ/iconcms1.png',
    },
  },

  /**
   * ESTRUTURA DA PLANILHA
   * ─────────────────────────────────────────────────────────
   * Nome exato das abas na planilha. Não altere sem atualizar
   * o Apps Script também.
   */
  SHEETS: {
    conselheiros: 'CONSELHEIROS',
    documentos:   'DOCUMENTOS',
    config:       'CONFIG',       // Futura aba de configurações dinâmicas
    categorias:   'CATEGORIAS',  // Futura aba de tipos de documento
  },

  /**
   * COLUNAS — CONSELHEIROS (índice 0-based)
   * ─────────────────────────────────────────────────────────
   */
  COLS_CONSELHEIRO: {
    ID:        0,
    SEGMENTO:  1,
    ENTIDADE:  2,
    CADEIRA:   3,
    NOME:      4,
    TELEFONE:  5,
    EMAIL:     6,
    RG:        7,
    CPF:       8,
    ENDERECO:  9,
    STATUS:   10,
    SENHA:    11,
  },

  /**
   * COLUNAS — DOCUMENTOS (índice 0-based)
   * ─────────────────────────────────────────────────────────
   */
  COLS_DOCUMENTO: {
    ID:        0,
    TITULO:    1,
    TIPO:      2,
    ANO:       3,
    DATA:      4,
    DESCRICAO: 5,
    LINK:      6,
    STATUS:    7,
  },

  /**
   * CATEGORIAS PADRÃO (fallback quando a planilha não responde)
   * ─────────────────────────────────────────────────────────
   * Cores: chave CSS de classe badge (badge-blue, badge-green, etc.)
   * Ícone: emoji representativo
   */
  DEFAULT_CATEGORIAS: [
    { tipo: 'Portaria',           badge: 'badge-blue',   icon: '📋' },
    { tipo: 'Resolução',          badge: 'badge-navy',   icon: '⚖️' },
    { tipo: 'Memorando',          badge: 'badge-green',  icon: '📝' },
    { tipo: 'Ofício',             badge: 'badge-gray',   icon: '✉️' },
    { tipo: 'Edital',             badge: 'badge-yellow', icon: '📢' },
    { tipo: 'Documento Externo',  badge: 'badge-gray',   icon: '📄' },
  ],

  /**
   * UI
   */
  UI: {
    TOAST_DURATION:    4000,   // ms
    DEBOUNCE_SEARCH:   300,    // ms — atraso da busca em tempo real
    SKELETON_CARDS:    8,      // quantidade de cards skeleton no loading
    ANIMATION_DELAY:   60,     // ms de delay entre cards no grid
  },

};

// Congela o objeto para evitar modificações acidentais em runtime
Object.freeze(CONFIG);
Object.freeze(CONFIG.API);
Object.freeze(CONFIG.SESSION);
Object.freeze(CONFIG.BRAND);
Object.freeze(CONFIG.BRAND.colors);
Object.freeze(CONFIG.BRAND.logos);
