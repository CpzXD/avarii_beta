const VERSION='avarii-network-only-v13-admin-navigation';

self.addEventListener('install',event=>{
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message',event=>{
  if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting();
});

self.addEventListener('push',event=>{
  let payload={};
  try{payload=event.data?event.data.json():{}}catch{payload={body:event.data?event.data.text():'Statusul sesizării a fost actualizat.'}}
  const title=payload.title||'Actualizare sesizare';
  const options={
    body:payload.body||'Statusul sesizării dumneavoastră a fost actualizat.',
    icon:payload.icon||'/branding/luxten-192.png',
    badge:payload.badge||'/branding/luxten-192.png',
    tag:payload.tag||'avarii-status',
    renotify:payload.renotify!==false,
    data:payload.data||{url:'/harta.html#mine'},
  };
  event.waitUntil(self.registration.showNotification(title,options));
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=new URL(event.notification.data?.url||'/harta.html#mine',self.location.origin).href;
  event.waitUntil((async()=>{
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of windows){
      if('navigate' in client)await client.navigate(target);
      if('focus' in client)return client.focus();
    }
    return self.clients.openWindow(target);
  })());
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  event.respondWith(fetch(request,{cache:'no-store'}));
});
