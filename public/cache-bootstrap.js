(()=>{
  if(!('serviceWorker' in navigator))return;
  const register=async()=>{
    try{
      const registration=await navigator.serviceWorker.register('/service-worker.js',{scope:'/',updateViaCache:'none'});
      await registration.update();
    }catch{}
  };
  if(document.readyState==='complete')register();
  else window.addEventListener('load',register,{once:true});
})();
