(()=>{
  const STORAGE_KEY='avariiTheme';
  const LIGHT='light';
  const DARK='dark';

  function systemTheme(){
    try{return window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?DARK:LIGHT}catch{return LIGHT}
  }

  function savedTheme(){
    try{
      const value=localStorage.getItem(STORAGE_KEY);
      return value===LIGHT||value===DARK?value:null;
    }catch{return null}
  }

  function currentTheme(){
    const value=document.documentElement.dataset.theme;
    return value===DARK?DARK:LIGHT;
  }

  function syncControls(theme){
    const isDark=theme===DARK;
    document.querySelectorAll('[data-theme-toggle]').forEach(control=>{
      control.checked=isDark;
      control.setAttribute('aria-checked',String(isDark));
      control.setAttribute('aria-label',isDark?'Dezactivează modul întunecat':'Activează modul întunecat');
    });
    document.querySelectorAll('[data-theme-state]').forEach(label=>{
      label.textContent=isDark?'Pornit':'Oprit';
    });
  }

  function syncThemeColor(theme){
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.setAttribute('content',theme===DARK?'#0b1220':'#ffffff');
  }

  function applyTheme(theme,{persist=true}={}){
    const next=theme===DARK?DARK:LIGHT;
    document.documentElement.dataset.theme=next;
    document.documentElement.style.colorScheme=next;
    syncThemeColor(next);
    syncControls(next);
    if(persist){
      try{localStorage.setItem(STORAGE_KEY,next)}catch{}
    }
    window.dispatchEvent(new CustomEvent('avarii:themechange',{detail:{theme:next}}));
    return next;
  }

  function bindControls(){
    syncControls(currentTheme());
    document.querySelectorAll('[data-theme-toggle]').forEach(control=>{
      if(control.dataset.themeBound==='1')return;
      control.dataset.themeBound='1';
      control.addEventListener('change',()=>applyTheme(control.checked?DARK:LIGHT));
    });
  }

  const initial=savedTheme()||systemTheme();
  applyTheme(initial,{persist:false});

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{
      syncThemeColor(currentTheme());
      bindControls();
    },{once:true});
  }else{
    syncThemeColor(currentTheme());
    bindControls();
  }

  window.addEventListener('storage',event=>{
    if(event.key!==STORAGE_KEY)return;
    const next=event.newValue===DARK?DARK:event.newValue===LIGHT?LIGHT:systemTheme();
    applyTheme(next,{persist:false});
  });

  try{
    const media=window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemChange=event=>{
      if(savedTheme())return;
      applyTheme(event.matches?DARK:LIGHT,{persist:false});
    };
    if(media.addEventListener)media.addEventListener('change',onSystemChange);
    else if(media.addListener)media.addListener(onSystemChange);
  }catch{}

  window.AvariiTheme={apply:applyTheme,current:currentTheme,storageKey:STORAGE_KEY};
})();
