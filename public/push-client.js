(()=>{
  let configPromise=null;

  function supported(){
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  async function config(){
    if(!configPromise){
      configPromise=fetch('/config/public',{cache:'no-store'})
        .then(response=>response.ok?response.json():Promise.reject(new Error('Configurația notificărilor nu este disponibilă.')))
        .then(value=>value.push||{enabled:false,publicKey:''});
    }
    return configPromise;
  }

  function applicationServerKey(value){
    const padding='='.repeat((4-value.length%4)%4);
    const base64=(value+padding).replace(/-/g,'+').replace(/_/g,'/');
    const raw=atob(base64);
    return Uint8Array.from([...raw].map(character=>character.charCodeAt(0)));
  }

  async function registration(){
    const existing=await navigator.serviceWorker.getRegistration('/');
    if(existing)return existing;
    return navigator.serviceWorker.register('/service-worker.js',{scope:'/',updateViaCache:'none'});
  }

  async function sendSubscription(subscription){
    const response=await AvariiSecurity.authFetch('/notifications/subscription',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(subscription.toJSON()),
    },'user');
    const body=await response.json();
    if(!response.ok)throw new Error(body.eroare||'Abonamentul pentru notificări nu a putut fi salvat.');
    return body;
  }

  async function subscribe(){
    if(!AvariiSecurity.tokenFor('user'))throw new Error('Conectează-te pentru a activa notificările.');
    if(!supported())throw new Error('Acest browser nu acceptă notificări push.');
    const pushConfig=await config();
    if(!pushConfig.enabled||!pushConfig.publicKey)throw new Error('Notificările push nu sunt configurate încă pe server.');

    const permission=await Notification.requestPermission();
    if(permission!=='granted')throw new Error('Permisiunea pentru notificări nu a fost acordată.');

    const worker=await registration();
    let subscription=await worker.pushManager.getSubscription();
    if(!subscription){
      subscription=await worker.pushManager.subscribe({
        userVisibleOnly:true,
        applicationServerKey:applicationServerKey(pushConfig.publicKey),
      });
    }
    await sendSubscription(subscription);
    return subscription;
  }

  async function unsubscribeCurrent({silent=false}={}){
    if(!supported())return false;
    const worker=await navigator.serviceWorker.getRegistration('/');
    if(!worker)return false;
    const subscription=await worker.pushManager.getSubscription();
    if(!subscription)return false;

    try{
      if(AvariiSecurity.tokenFor('user')){
        await AvariiSecurity.authFetch('/notifications/subscription',{
          method:'DELETE',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({endpoint:subscription.endpoint}),
        },'user');
      }
    }catch(error){
      if(!silent)throw error;
    }

    await subscription.unsubscribe();
    return true;
  }

  async function currentState(){
    const pushConfig=await config();
    if(!pushConfig.enabled)return {kind:'disabled-server'};
    if(!supported())return {kind:'unsupported'};
    if(Notification.permission==='denied')return {kind:'denied'};
    const worker=await registration();
    const subscription=await worker.pushManager.getSubscription();
    if(subscription&&Notification.permission==='granted'){
      await sendSubscription(subscription);
      return {kind:'active'};
    }
    return {kind:'inactive'};
  }

  async function renderSettings(containerId,user){
    const box=document.getElementById(containerId);
    if(!box||!user)return;
    box.innerHTML='<div class="hint">🔔 Se verifică notificările...</div>';

    let state;
    try{state=await currentState()}catch(error){
      box.innerHTML=`<div class="hint gps-lipsa">🔔 ${error.message}</div>`;
      return;
    }

    if(state.kind==='disabled-server'){
      box.innerHTML='<div class="hint">🔔 Notificările push nu sunt configurate încă pe server.</div>';
      return;
    }
    if(state.kind==='unsupported'){
      box.innerHTML='<div class="hint">🔔 Acest browser nu acceptă notificări push. Pe iPhone, instalează aplicația pe ecranul principal și deschide-o de acolo.</div>';
      return;
    }
    if(state.kind==='denied'){
      box.innerHTML='<div class="hint gps-lipsa">🔕 Notificările sunt blocate din setările browserului. Permite-le pentru acest site și reîncarcă pagina.</div>';
      return;
    }

    const active=state.kind==='active';
    box.innerHTML=`<div class="hint">${active?'🔔 Vei primi actualizări când sesizările tale sunt confirmate, intră în lucru sau sunt rezolvate.':'🔕 Activează notificările pentru schimbările de status ale sesizărilor tale.'}<br><small>Conținutul notificării poate apărea pe ecranul blocat al dispozitivului.</small></div><button class="btn light" type="button" id="push-toggle">${active?'Dezactivează notificările':'Activează notificările'}</button><div id="push-result" class="result"></div>`;
    const button=document.getElementById('push-toggle');
    const result=document.getElementById('push-result');
    button.onclick=async()=>{
      button.disabled=true;
      try{
        if(active){
          await unsubscribeCurrent();
          result.className='result ok';
          result.textContent='Notificările au fost dezactivate pe acest dispozitiv.';
        }else{
          await subscribe();
          result.className='result ok';
          result.textContent='Notificările au fost activate.';
        }
        setTimeout(()=>renderSettings(containerId,user),500);
      }catch(error){
        result.className='result err';
        result.textContent=error.message;
        button.disabled=false;
      }
    };
  }

  window.AvariiPush={renderSettings,subscribe,unsubscribeCurrent,currentState};
})();
