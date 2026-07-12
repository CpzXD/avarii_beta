(()=>{
  const VERSION='network-only-20260712-12-report-layout';
  async function registerFreshWorker(){
    if(!('serviceWorker' in navigator))return;
    const previous=localStorage.getItem('avariiServiceWorkerMode');
    if(previous!==VERSION){
      try{
        const keys=await caches.keys();
        await Promise.all(keys.map(key=>caches.delete(key)));
      }catch{}
    }
    try{
      const registration=await navigator.serviceWorker.register('/service-worker.js',{scope:'/',updateViaCache:'none'});
      await registration.update();
      if(registration.waiting)registration.waiting.postMessage({type:'SKIP_WAITING'});
      localStorage.setItem('avariiServiceWorkerMode',VERSION);
      if(previous!==VERSION&&!sessionStorage.getItem('avariiFreshReload')){
        sessionStorage.setItem('avariiFreshReload','1');
        setTimeout(()=>location.reload(),350);
      }
    }catch{}
  }
  if(document.readyState==='complete')registerFreshWorker();
  else window.addEventListener('load',registerFreshWorker,{once:true});
})();
