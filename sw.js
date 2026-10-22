// HAWA — Service Worker لتطبيق التجار (صفحة الدخول والحجز بس)
// النت الأول دايماً (علشان أى تعديل يوصل على طول)، والنسخة المحفوظة بس لو النت مقطوع.
// أى طلب تانى (Supabase / الأدمن / الصور) بيعدّى من غير ما نلمسه.
const CACHE = 'hawa-trader-v1';
const PAGES = ['hawa_booking.html', 'hawa_login.html'];
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('hawa-trader-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.mode !== 'navigate') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const page = PAGES.find(p => url.pathname.endsWith('/' + p)) || (url.pathname === '/' ? 'hawa_booking.html' : null);
  if (!page) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(page, copy)); }
      return res;
    }).catch(() => caches.open(CACHE).then(c => c.match(page)).then(r => r || new Response(
      '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><body style="background:#0A0A0A;color:#C9A84C;font-family:Tahoma;text-align:center;padding:40px 16px" dir="rtl"><h2>📶 مفيش إنترنت</h2><p>اتأكد من النت وجرّب تانى</p><button onclick="location.reload()" style="padding:12px 24px;border-radius:12px;border:0;background:#C9A84C;font-weight:700">🔄 جرّب تانى</button></body>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } })))
  );
});
