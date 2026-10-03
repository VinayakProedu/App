/* Vinayak ProEdu PWA service worker — offline shell + safe caching */
const CACHE = 'vp-proedu-v2';
const PRECACHE = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];
const CDN = [/fonts\.googleapis\.com/, /fonts\.gstatic\.com/, /pasteimg\.com/];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // NEVER touch Firebase / auth traffic — always network, never cached
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('firebase') || url.hostname.includes('firebaseio')) return;
  if (url.origin !== location.origin && !CDN.some(rx => rx.test(url.href))) return; // cache only our origin + fonts/images CDN

  if (CDN.some(rx => rx.test(url.href))) {
    e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res && res.status === 200) { const cl = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cl)); }
      return res;
    })));
    return;
  }
  // Pages: network-first, offline fallback
  e.respondWith(fetch(e.request).then(res => {
    if (res && res.status === 200) { const cl = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cl)); }
    return res;
  }).catch(() => caches.match(e.request).then(c => c || caches.match('./index.html'))));
});
