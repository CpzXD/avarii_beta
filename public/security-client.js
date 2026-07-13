(function(){
  let userAccessToken='';
  let refreshPromise=null;
  localStorage.removeItem('userToken');

  function storageKey(role){return role==='admin'?'admin':'user'}
  function tokenStorageKey(role){return role==='admin'?'adminToken':'userToken'}
  function storedUser(){try{return JSON.parse(localStorage.getItem('user')||'null')}catch{return null}}
  function tokenFor(role){return role==='admin'?(localStorage.getItem('adminToken')||''):userAccessToken}
  function currentUser(){return storedUser()}
  function clientId(){let value=localStorage.getItem('avariiClientId');if(!value){value=crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`;localStorage.setItem('avariiClientId',value)}return value}
  function authHeaders(role,headers){const result={...(headers||{}),'X-Client-Id':clientId()};const token=tokenFor(role);if(token)result.Authorization=`Bearer ${token}`;return result}

  function saveSession(role,data){
    localStorage.setItem(storageKey(role),JSON.stringify(data.user));
    if(role==='admin')localStorage.setItem(tokenStorageKey(role),data.token);
    else{
      userAccessToken=String(data.token||'');
      localStorage.removeItem('userToken');
    }
  }

  function clearSession(role){
    localStorage.removeItem(storageKey(role));
    localStorage.removeItem(tokenStorageKey(role));
    if(role!=='admin')userAccessToken='';
  }

  function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms))}

  async function withRefreshLock(task){
    if(navigator.locks?.request){
      return navigator.locks.request('avarii-user-session-refresh',{mode:'exclusive'},task);
    }

    const key='avarii:user-refresh-lock';
    const owner=crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`;
    for(let attempt=0;attempt<50;attempt+=1){
      const now=Date.now();
      let lock=null;
      try{lock=JSON.parse(localStorage.getItem(key)||'null')}catch{}
      if(!lock||Number(lock.expiresAt||0)<now){
        localStorage.setItem(key,JSON.stringify({owner,expiresAt:now+10000}));
        let confirmed=null;
        try{confirmed=JSON.parse(localStorage.getItem(key)||'null')}catch{}
        if(confirmed?.owner===owner){
          try{return await task()}
          finally{
            let current=null;
            try{current=JSON.parse(localStorage.getItem(key)||'null')}catch{}
            if(current?.owner===owner)localStorage.removeItem(key);
          }
        }
      }
      await sleep(80+Math.floor(Math.random()*70));
    }
    return task();
  }

  async function refreshUserSession({force=false}={}){
    if(!force&&!storedUser())return null;
    if(refreshPromise)return refreshPromise;
    refreshPromise=withRefreshLock(async()=>{
      const response=await fetch('/auth/refresh',{
        method:'POST',
        credentials:'same-origin',
        headers:{'X-Client-Id':clientId()},
        cache:'no-store',
      });
      if(!response.ok){
        if(response.status===401||response.status===403)clearSession('user');
        return null;
      }
      const data=await response.json();
      saveSession('user',data);
      return data.user;
    }).catch(()=>null).finally(()=>{refreshPromise=null});
    return refreshPromise;
  }

  const ready=refreshUserSession();

  async function authFetch(url,options={},role='user'){
    if(role==='user'){
      await ready;
      if(storedUser()&&!userAccessToken)await refreshUserSession({force:true});
    }

    const request=()=>fetch(url,{
      ...options,
      credentials:options.credentials||'same-origin',
      headers:authHeaders(role,options.headers),
    });

    let response=await request();
    if(response.status===401&&role==='user'&&storedUser()){
      const refreshed=await refreshUserSession({force:true});
      if(refreshed)response=await request();
    }

    if(response.status===401){
      clearSession(role);
    }
    return response;
  }

  async function logout(role){
    if(role==='user'){
      try{
        await fetch('/auth/logout',{
          method:'POST',
          credentials:'same-origin',
          headers:{'X-Client-Id':clientId()},
          cache:'no-store',
        });
      }finally{clearSession('user')}
      return;
    }
    clearSession('admin');
  }

  async function loadTurnstile(containerId,inputId){
    const container=document.getElementById(containerId);const input=document.getElementById(inputId);if(!container||!input)return;
    try{
      const config=await fetch('/config/public',{cache:'no-store'}).then(r=>r.json());
      if(!config.turnstileSiteKey){container.style.display='none';return}
      await new Promise((resolve,reject)=>{
        if(window.turnstile)return resolve();
        const script=document.createElement('script');
        script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async=true;script.defer=true;script.onload=resolve;script.onerror=reject;document.head.appendChild(script)
      });
      window.turnstile.render(container,{sitekey:config.turnstileSiteKey,theme:'auto',size:'flexible',callback:token=>{input.value=token},'expired-callback':()=>{input.value=''},'error-callback':()=>{input.value=''}})
    }catch{container.style.display='none'}
  }

  window.AvariiSecurity={
    tokenFor,clientId,authHeaders,authFetch,saveSession,clearSession,logout,
    refreshUserSession,currentUser,ready,loadTurnstile
  };
})();
