/**
 * service-worker.js — Service Worker do CMS Docs PWA
 * ────────────────────────────────────────────────────
 * Estratégia de cache:
 *  - Shell da aplicação: Cache First (HTML, CSS, JS, imagens)
 *  - API (Google Apps Script): Network First com fallback para cache
 *  - PDFs do Google Drive: Cache on Demand (abre e salva)
 *
 * Secretaria Executiva CMS-MOC | Versão 1.0
 */

const CACHE_NAME    = 'cms-docs-v1';
const CACHE_API     = 'cms-api-v1';
const CACHE_PDF     = 'cms-pdf-v1';

// Arquivos essenciais do shell (pré-cache no install)
const SHELL_ASSETS = [
  '/doc/',
  '/doc/index.html',
  '/doc/login.html',
  '/doc/css/brand.css',
  '/doc/css/style.css',
  '/doc/config/config.js',
  '/doc/js/auth.js',
  '/doc/js/api.js',
  '/doc/js/search.js',
  '/doc/js/ui.js',
  '/doc/js/app.js',
  '/doc/js/login.js',
  '/doc/pwa/manifest.json',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700;800;900&family=Open+Sans:wght@300;400;600&display=swap',
];

// ── Install: pré-cache do shell ──────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Falha no pré-cache:', err))
  );
});

// ── Activate: limpa caches antigos ───────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== CACHE_API && k !== CACHE_PDF)
            .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: intercepta requisições ────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Google Apps Script API → Network First
  if (url.includes('script.google.com')) {
    event.respondWith(_networkFirst(event.request, CACHE_API));
    return;
  }

  // PDFs do Google Drive → Cache on Demand
  if (url.includes('drive.google.com') || url.includes('.pdf')) {
    event.respondWith(_cacheOnDemand(event.request, CACHE_PDF));
    return;
  }

  // Recursos do Google Fonts → Stale While Revalidate
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    event.respondWith(_staleWhileRevalidate(event.request, CACHE_NAME));
    return;
  }

  // Shell da aplicação → Cache First
  event.respondWith(_cacheFirst(event.request, CACHE_NAME));
});

// ── Estratégias de cache ──────────────────────────────────────

/**
 * Cache First: tenta cache; se não encontrar, busca na rede e armazena.
 */
async function _cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return _offlineFallback(request);
  }
}

/**
 * Network First: tenta rede; se falhar, usa cache.
 */
async function _networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || _offlineFallback(request);
  }
}

/**
 * Cache on Demand: salva no cache quando acessado.
 */
async function _cacheOnDemand(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return _offlineFallback(request);
  }
}

/**
 * Stale While Revalidate: retorna cache imediatamente e atualiza em background.
 */
async function _staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  return cached || fetchPromise;
}

/**
 * Fallback para modo offline.
 */
function _offlineFallback(request) {
  if (request.destination === 'document') {
    return caches.match('/doc/index.html');
  }
  return new Response('Offline', { status: 503 });
}
