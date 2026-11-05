// HAWA — Service Worker لتطبيق المخزن (hawa_wh.html بس): النت الأول، والنسخة المحفوظة لو النت مقطوع.
const CACHE = 'hawa-wh-v1';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('hawa-wh-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.mode !== 'navigate') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.endsWith('/hawa_wh.html')) return;
  e.respondWith(fetch(req).then(res => { if (res && res.ok) { const c = res.clone(); caches.open(CACHE).then(x => x.put('hawa_wh.html', c)); } return res; })
    .catch(() => caches.open(CACHE).then(x => x.match('hawa_wh.html')).then(r => r || new Response('<meta charset="utf-8"><body style="background:#0A0A0A;color:#C9A84C;font-family:Tahoma;text-align:center;padding:40px" dir="rtl"><h2>📶 مفيش إنترنت</h2><button onclick="location.reload()">🔄 جرّب تانى</button></body>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } }))));
});
