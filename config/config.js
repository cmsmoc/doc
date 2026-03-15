/**
 * config.js — Configurações centrais CMS Docs PWA v2
 * Secretaria Executiva CMS-MOC
 */
const CONFIG = {
  APP: {
    name:        'CMS Docs',
    fullName:    'Conselho Municipal de Saúde — Montes Claros',
    version:     '2.0.0',
    shortName:   'CMS-MOC',
  },
  API: {
    GAS_URL: 'https://script.google.com/macros/s/SEU_DEPLOYMENT_ID/exec',
    TIMEOUT: 12000,
  },
  SESSION: {
    KEY:        'cms_session',
    DOCS_CACHE: 'cms_docs_cache',
    HOME_CACHE: 'cms_home_cache',
    CACHE_TTL:  15 * 60 * 1000,
  },
  BRAND: {
    colors: { blue:'#1B6CB5', navy:'#0D2E5A', green:'#1E8A4A', yellow:'#F5C400' },
    logos: {
      horizontal_branco: 'https://i.ibb.co/HLG4tvfn/LOGOTIPO-CONSELHO-BRANCO.png',
      horizontal_preto:  'https://i.ibb.co/XkSh01M8/LOGOTIPO-CONSELHO-PRETO.png',
      icon_192:          'https://i.ibb.co/4g2ZZyGZ/iconcms1.png',
      icon_512:          'https://i.ibb.co/ksxpJdVw/iconcms512.png',
    },
  },
  // Perfis em ordem hierárquica crescente
  PERFIS: ['publico','diretoria','presidente','secretaria','admin'],

  // Destaques — mapeamento de valor → cor e label
  DESTAQUES: {
    novo:        { cor: '#1B6CB5', label: 'NOVO',        bg: '#DBEAFE' },
    lei:         { cor: '#0D2E5A', label: 'LEI',         bg: '#EFF6FF' },
    urgente:     { cor: '#DC2626', label: 'URGENTE',     bg: '#FEE2E2' },
    recomendado: { cor: '#1E8A4A', label: 'RECOMENDADO', bg: '#D1FAE5' },
    video:       { cor: '#7C3AED', label: 'VÍDEO',       bg: '#EDE9FE' },
    portaria:    { cor: '#D97706', label: 'PORTARIA',    bg: '#FEF3C7' },
  },

  // Tipos de mídia — ícone
  MIDIA_ICONS: {
    pdf:   '📄',
    video: '▶️',
    link:  '🔗',
    imagem:'🖼️',
  },

  DEFAULT_CATEGORIAS: [
    { tipo:'Portaria',          badge:'badge-blue',   icon:'📋' },
    { tipo:'Resolução',         badge:'badge-navy',   icon:'⚖️'  },
    { tipo:'Memorando',         badge:'badge-green',  icon:'📝' },
    { tipo:'Ofício',            badge:'badge-gray',   icon:'✉️'  },
    { tipo:'Edital',            badge:'badge-yellow', icon:'📢' },
    { tipo:'Institucional',     badge:'badge-navy',   icon:'🏛️'  },
    { tipo:'Documento Externo', badge:'badge-gray',   icon:'📄' },
  ],

  UI: {
    TOAST_DURATION:  4000,
    DEBOUNCE_SEARCH: 300,
    SKELETON_CARDS:  8,
    ANIMATION_DELAY: 50,
  },

  // Módulos ativos (controla quais seções aparecem na nav)
  MODULES: {
    documentos:    true,
    atas:          true,
    reunioes:      true,
    meusDocs:      true,
    solicitacoes:  true,
    calendario:    false,  // preparado, não ativo
    votacoes:      false,  // preparado, não ativo
    comissoes:     false,  // preparado, não ativo
    portalPublico: false,  // preparado, não ativo
  },
};

Object.freeze(CONFIG);
