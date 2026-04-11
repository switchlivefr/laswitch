const CACHE = 'laswitch-v1';
self.addEventListener('install', function(e){
  self.skipWaiting();
});
self.addEventListener('activate', function(e){
  e.waitUntil(clients.claim());
});
self.addEventListener('fetch', function(e){
  // Pass-through uniquement, pas de cache offline pour éviter des données périmées
  e.respondWith(fetch(e.request).catch(function(){
    return caches.match(e.request);
  }));
});
