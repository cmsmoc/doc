/**
 * config.js — CMS Docs PWA v3
 * Secretaria Executiva CMS-MOC
 *
 * NOVO em v3:
 *  - ONESIGNAL_APP_ID (substitua antes de publicar)
 *  - ONESIGNAL_SAFARI_ID (opcional)
 *  - Entrada padrão alterada para home.html
 */
const CONFIG = {
  APP: {
    name:      'CMS Docs',
    fullName:  'Conselho Municipal de Saúde — Montes Claros',
    version:   '3.0.0',
    shortName: 'CMS-MOC',
    // Página inicial após login
    HOME_PAGE: 'home.html',
  },

  API: {
    // ⚠️  Substitua pela URL real da sua implantação GAS
    GAS_URL: 'https://script.google.com/macros/s/AKfycbwWxaGjofMul-5MV6E_YVS3CWsic8cv3--YnDBBsUgu395s5e1ZUO2lbC8X33K0Lu9E/exec',
    TIMEOUT: 12000,
  },

  SESSION: {
    KEY: 'cms_session',
  },

  // OneSignal Push Notifications
  // Configure em: https://app.onesignal.com → seu app → Settings → Keys & IDs
  ONESIGNAL_APP_ID:    'SEU_APP_ID_AQUI',    // ← substitua
  ONESIGNAL_SAFARI_ID: '',                   // ← opcional (Safari macOS)

  BRAND: {
    colors: {
      blue:  '#1B6CB5',
      navy:  '#0D2E5A',
      green: '#1E8A4A',
      yellow:'#F5C400',
    },
    logos: {
      horizontal_branco: 'https://i.ibb.co/HLG4tvfn/LOGOTIPO-CONSELHO-BRANCO.png',
      horizontal_preto:  'https://i.ibb.co/XkSh01M8/LOGOTIPO-CONSELHO-PRETO.png',
      icon_192:          'https://i.ibb.co/4g2ZZyGZ/iconcms1.png',
      icon_512:          'https://i.ibb.co/ksxpJdVw/iconcms512.png',
      diretoria:         'https://i.ibb.co/Ps3k9K1y/zap-diretoria-5.png',
    },
  },

  // Hierarquia de perfis (menor index = menor acesso)
  PERFIS: ['publico', 'diretoria', 'presidente', 'secretaria', 'admin'],

  // Destaques nos cards de documento
  DESTAQUES: {
    novo:        { cor:'#1B6CB5', label:'NOVO',        bg:'#DBEAFE' },
    lei:         { cor:'#0D2E5A', label:'LEI',         bg:'#EFF6FF' },
    urgente:     { cor:'#DC2626', label:'URGENTE',     bg:'#FEE2E2' },
    recomendado: { cor:'#1E8A4A', label:'RECOMENDADO', bg:'#D1FAE5' },
    video:       { cor:'#7C3AED', label:'VÍDEO',       bg:'#EDE9FE' },
    portaria:    { cor:'#D97706', label:'PORTARIA',    bg:'#FEF3C7' },
  },

  MIDIA_ICONS: { pdf:'📄', video:'▶️', link:'🔗', imagem:'🖼️' },

  DEFAULT_CATEGORIAS: [
    { tipo:'Portaria',          badge:'badge-blue',   icon:'📋' },
    { tipo:'Resolução',         badge:'badge-navy',   icon:'⚖️'  },
    { tipo:'Memorando',         badge:'badge-green',  icon:'📝' },
    { tipo:'Ofício',            badge:'badge-gray',   icon:'✉️'  },
    { tipo:'Edital',            badge:'badge-yellow', icon:'📢' },
    { tipo:'Institucional',     badge:'badge-navy',   icon:'🏛️'  },
    { tipo:'Documento Externo', badge:'badge-gray',   icon:'📄' },
  ],

  // Controle de módulos ativos (fallback local — servidor é a fonte de verdade)
  MODULES: {
    documentos:    true,
    atas:          true,
    reunioes:      true,
    comissoes:     true,
    meusdocs:      true,
    solicitacoes:  true,
    perfil:        true,
    diretoria:     false,
    presidente:    false,
    votacoes:      false,
    calendario:    false,
    portal:        false,
  },

  UI: {
    TOAST_DURATION:  4000,
    DEBOUNCE_SEARCH: 300,
    SKELETON_CARDS:  8,
    ANIMATION_DELAY: 50,
  },
};

Object.freeze(CONFIG);
