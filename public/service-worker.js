const CACHE_NAME='avarii-ui-hotfix-refresh-v4';
const APP_SHELL=['/','/harta.html','/login.html','/register.html','/sesizare-detalii.html','/sesizare.html','/sesizarile-mele.html','/map-config.js','/location-utils.js','/vendor/leaflet/leaflet.css','/vendor/leaflet/leaflet.js','/vendor/leaflet/images/marker-icon.png','/vendor/leaflet/images/marker-icon-2x.png','/vendor/leaflet/images/marker-shadow.png','/security-client.js','/manifest-cetatean.json','/branding/branding.css','/branding/branding.js','/branding/luxten-logo.png','/branding/luxten-logo-splash.png','/branding/luxten-symbol.png','/branding/luxten-192.png','/branding/luxten-512.png','/branding/luxten-apple-180.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin){event.respondWith(fetch(request));return}
  if(url.pathname.startsWith('/avarii')||url.pathname.startsWith('/auth')||url.pathname.startsWith('/uploads')||url.pathname.startsWith('/geocoding')||url.pathname.startsWith('/config')){event.respondWith(fetch(request,{cache:'no-store'}));return}
  const freshPaths=['/','/harta.html','/login.html','/register.html','/sesizare-detalii.html','/sesizare.html','/sesizarile-mele.html','/admin.html','/admin-login.html','/map-config.js','/location-utils.js','/security-client.js','/branding/branding.js','/branding/branding.css','/vendor/leaflet/leaflet.css','/vendor/leaflet/leaflet.js'];
  if(request.mode==='navigate'||url.pathname.endsWith('.html')||freshPaths.includes(url.pathname)){
    event.respondWith(fetch(request,{cache:'no-store'}).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));return response}).catch(()=>caches.match(request).then(cached=>cached||caches.match('/harta.html'))));
    return;
  }
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));return response})));
});
