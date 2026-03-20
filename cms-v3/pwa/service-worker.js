/**
 * service-worker.js — CMS Docs PWA v3
 * Suporte a push notifications via OneSignal + cache offline.
 *
 * Estratégias de cache:
 *  - Shell (HTML/CSS/JS): cache-first
 *  - API GAS: network-first com fallback
 *  - Imagens/fontes: stale-while-revalidate
 */

const CACHE_NAME    = 'cms-docs-v3';
const CACHE_SHELL   = 'cms-shell-v3';
const CACHE_DYNAMIC = 'cms-dynamic-v3';

// Arquivos do shell — cacheados no install
const SHELL_FILES = [
  '/',
  '/index.html',
  '/home.html',
  '/login.html',
  '/css/brand.css',
  '/css/style.css',
  '/js/api.js',
  '/js/auth.js',
  '/js/ui.js',
  '/js/app.js',
  '/js/search.js',
  '/js/manutencao.js',
  '/config/config.js',
  '/pwa/manifest.json',
];

// ── Install ──────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_SHELL).then(cache => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_SHELL && k !== CACHE_DYNAMIC)
            .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // GAS API — network-first, sem cache (respostas dinâmicas)
  if (url.href.includes('script.google.com')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ success: false, message: 'Offline' }),
          { headers: { 'Content-Type': 'application/json' } })
      )
    );
    return;
  }

  // Google Fonts — stale-while-revalidate
  if (url.href.includes('fonts.googleapis.com') || url.href.includes('fonts.gstatic.com')) {
    event.respondWith(staleWhileRevalidate(request, CACHE_DYNAMIC));
    return;
  }

  // Shell files — cache-first
  if (SHELL_FILES.some(f => url.pathname === f || url.pathname.endsWith(f))) {
    event.respondWith(cacheFirst(request, CACHE_SHELL));
    return;
  }

  // Demais — network-first com fallback para cache
  event.respondWith(networkFirst(request, CACHE_DYNAMIC));
});

// ── Push Notification ─────────────────────────────────────────
self.addEventListener('push', event => {
  let data = { title: 'CMS Montes Claros', body: 'Nova notificação institucional.' };

  if (event.data) {
    try { data = event.data.json(); } catch { data.body = event.data.text(); }
  }

  const options = {
    body:    data.body || '',
    icon:    '/pwa/icons/icon-192.png',
    badge:   '/pwa/icons/badge-72.png',
    image:   data.image || undefined,
    tag:     data.tag   || 'cms-notif',
    renotify:true,
    data:    { url: data.url || '/home.html' },
    actions: data.actions || [
      { action: 'open',    title: 'Abrir' },
      { action: 'dismiss', title: 'Fechar' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ── Notification Click ────────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/home.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      const existing = clientList.find(c => c.url.includes(self.location.origin));
      if (existing) { existing.focus(); existing.navigate(targetUrl); return; }
      return clients.openWindow(targetUrl);
    })
  );
});

// ── Estratégias de cache ──────────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Conteúdo não disponível offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache    = await caches.open(cacheName);
  const cached   = await cache.match(request);
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => cached);
  return cached || fetchPromise;
}
