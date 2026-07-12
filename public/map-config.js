window.AVARII_MAP_CONFIG={center:[44.22,28.60],bounds:[[44.06,28.43],[44.40,28.80]],minZoom:10,maxZoom:19,defaultZoom:11};
window.AVARII_ADMIN_MAP_CONFIG={center:[44.24,28.60],bounds:[[44.00,28.30],[44.48,28.92]],minZoom:9,maxZoom:19,defaultZoom:11};
window.avariiMapBounds=function(){return L.latLngBounds(window.AVARII_MAP_CONFIG.bounds[0],window.AVARII_MAP_CONFIG.bounds[1])};
window.avariiAdminMapBounds=function(){return L.latLngBounds(window.AVARII_ADMIN_MAP_CONFIG.bounds[0],window.AVARII_ADMIN_MAP_CONFIG.bounds[1])};
window.isInsideAvariiArea=function(lat,lng){return window.avariiMapBounds().contains(L.latLng(Number(lat),Number(lng)))};
window.refreshAvariiMap=function(map){
  if(!map)return;
  const refresh=()=>{
    const container=map.getContainer?.();
    if(!container||!document.body.contains(container)||container.offsetWidth<2||container.offsetHeight<2)return;
    map.invalidateSize({pan:false,animate:false});
    if(map._avariiTiles&&map._avariiTiles._map)map._avariiTiles.redraw();
  };
  requestAnimationFrame(()=>requestAnimationFrame(refresh));
  [60,180,450,900].forEach(delay=>setTimeout(refresh,delay));
};
window.createAvariiMap=function(id,options={}){
  const element=typeof id==='string'?document.getElementById(id):id;
  if(!element)throw new Error('Containerul hărții nu există.');
  if(element._avariiMapInstance){window.refreshAvariiMap(element._avariiMapInstance);return element._avariiMapInstance}
  const config=options.mode==='admin'?window.AVARII_ADMIN_MAP_CONFIG:window.AVARII_MAP_CONFIG;
  const rawBounds=options.bounds||config.bounds;
  const bounds=L.latLngBounds(rawBounds[0],rawBounds[1]);
  const center=options.center||config.center;
  const zoom=options.zoom??config.defaultZoom;
  const minZoom=options.minZoom??config.minZoom;
  const maxZoom=options.maxZoom??config.maxZoom;
  const mapOptions={
    minZoom,maxZoom,
    scrollWheelZoom:options.scrollWheelZoom!==false,
    wheelDebounceTime:options.wheelDebounceTime||40,
    wheelPxPerZoomLevel:options.wheelPxPerZoomLevel||80,
    zoomAnimation:false,
    fadeAnimation:false,
    markerZoomAnimation:false,
    preferCanvas:true
  };
  if(options.limitBounds!==false){mapOptions.maxBounds=bounds;mapOptions.maxBoundsViscosity=options.maxBoundsViscosity??0.85}
  const map=L.map(element,mapOptions).setView(center,zoom);
  element._avariiMapInstance=map;
  if(options.limitBounds!==false)map.on('drag',()=>map.panInsideBounds(bounds,{animate:false}));
  const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution:'&copy; OpenStreetMap contributors',
    noWrap:true,minZoom,maxZoom,
    keepBuffer:3,
    updateWhenIdle:true,
    updateWhenZooming:false
  });
  let retried=false;
  tiles.on('tileerror',()=>{
    if(retried)return;
    retried=true;
    setTimeout(()=>{if(tiles._map)tiles.redraw()},900);
  });
  tiles.on('load',()=>{retried=false});
  tiles.addTo(map);
  map._avariiTiles=tiles;
  if('ResizeObserver' in window){
    const observer=new ResizeObserver(()=>window.refreshAvariiMap(map));
    observer.observe(element);
    map._avariiResizeObserver=observer;
  }
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting))window.refreshAvariiMap(map);
    },{threshold:.01});
    observer.observe(element);
    map._avariiIntersectionObserver=observer;
  }
  map.whenReady(()=>window.refreshAvariiMap(map));
  return map;
};
