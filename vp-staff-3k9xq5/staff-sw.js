/* Vinayak ProEdu — Faculty Portal service worker (network-first) */
var CACHE = 'vp-faculty-v1';
self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(['./index.html','./manifest.json']); }).catch(function(){}));
});
self.addEventListener('activate', function(e){
  e.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(function(r){
      var cp = r.clone();
      caches.open(CACHE).then(function(c){ c.put(e.request, cp); }).catch(function(){});
      return r;
    }).catch(function(){
      return caches.match(e.request).then(function(m){ return m || caches.match('./index.html'); });
    })
  );
});
