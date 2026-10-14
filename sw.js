/* Service worker: guarda o jogo no aparelho para funcionar sem internet. */
var CACHE = 'mahjong-mamae-v3';
var ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c){
        return c.addAll(ASSETS.map(function(asset){
          return new Request(new URL(asset, self.registration.scope), {cache:'reload'});
        }));
      })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        return k.indexOf('mahjong-mamae-') === 0 && k !== CACHE ? caches.delete(k) : null;
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

/* O menu pede uma cópia nova de todos os arquivos, mesmo sem mudar o worker.
   Só alteramos o cache depois que todos os downloads terminarem com sucesso. */
self.addEventListener('message', function(e){
  if(!e.data || e.data.type !== 'UPDATE_APP' || !e.ports[0]) return;
  var urls = ASSETS.map(function(asset){ return new URL(asset, self.registration.scope).href; });
  if(e.source && e.source.url && urls.indexOf(e.source.url) < 0) urls.push(e.source.url);
  e.waitUntil(
    Promise.all(urls.map(function(url){
      return fetch(url, {cache:'no-store'}).then(function(response){
        if(!response.ok) throw new Error('Falha ao atualizar');
        return {url:url, response:response};
      });
    })).then(function(files){
      return caches.open(CACHE).then(function(cache){
        return Promise.all(files.map(function(file){ return cache.put(file.url, file.response); }));
      });
    }).then(function(){ e.ports[0].postMessage({ok:true}); })
      .catch(function(){ e.ports[0].postMessage({ok:false}); })
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function(hit){
      if(hit) return hit;
      return fetch(e.request).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        return res;
      }).catch(function(){
        return caches.match('./index.html');
      });
    })
  );
});
