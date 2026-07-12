(function(){
  function tokenFor(role){return localStorage.getItem(role==='admin'?'adminToken':'userToken')||''}
  function clientId(){let value=localStorage.getItem('avariiClientId');if(!value){value=crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`;localStorage.setItem('avariiClientId',value)}return value}
  function authHeaders(role,headers){const result={...(headers||{}),'X-Client-Id':clientId()};const token=tokenFor(role);if(token)result.Authorization=`Bearer ${token}`;return result}
  async function authFetch(url,options={},role='user'){
    const response=await fetch(url,{...options,headers:authHeaders(role,options.headers)});
    if(response.status===401){
      if(role==='admin'){localStorage.removeItem('admin');localStorage.removeItem('adminToken')}
      else{localStorage.removeItem('user');localStorage.removeItem('userToken')}
    }
    return response;
  }
  function saveSession(role,data){
    localStorage.setItem(role,JSON.stringify(data.user));
    localStorage.setItem(role==='admin'?'adminToken':'userToken',data.token);
  }
  function clearSession(role){
    localStorage.removeItem(role);
    localStorage.removeItem(role==='admin'?'adminToken':'userToken');
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
  window.AvariiSecurity={tokenFor,clientId,authHeaders,authFetch,saveSession,clearSession,loadTurnstile}
})();
