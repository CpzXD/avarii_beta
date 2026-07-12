window.AVARII_MAP_CONFIG={center:[44.215,28.635],bounds:[[44.10,28.50],[44.34,28.75]],minZoom:12,maxZoom:19,defaultZoom:13};
window.AVARII_ADMIN_MAP_CONFIG={center:[44.22,28.635],bounds:[[44.07,28.45],[44.37,28.80]],minZoom:11,maxZoom:19,defaultZoom:12};
window.avariiMapBounds=function(){return L.latLngBounds(window.AVARII_MAP_CONFIG.bounds[0],window.AVARII_MAP_CONFIG.bounds[1])};
window.avariiAdminMapBounds=function(){return L.latLngBounds(window.AVARII_ADMIN_MAP_CONFIG.bounds[0],window.AVARII_ADMIN_MAP_CONFIG.bounds[1])};
window.isInsideAvariiArea=function(lat,lng){return window.avariiMapBounds().contains(L.latLng(Number(lat),Number(lng)))};
window.refreshAvariiMap=function(map,force=false){
  if(!map)return;
  const container=map.getContainer?.();
  if(!container||!document.body.contains(container))return;
  const rect=container.getBoundingClientRect();
  const width=Math.round(rect.width);
  const height=Math.round(rect.height);
  if(width<2||height<2)return;
  const last=map._avariiLastSize;
  if(!force&&last&&last.width===width&&last.height===height)return;
  map._avariiLastSize={width,height};
  if(map._avariiRefreshFrame)cancelAnimationFrame(map._avariiRefreshFrame);
  map._avariiRefreshFrame=requestAnimationFrame(()=>{
    map._avariiRefreshFrame=null;
    const current=map.getContainer?.();
    if(!current||!document.body.contains(current)||current.offsetWidth<2||current.offsetHeight<2)return;
    map.invalidateSize({pan:false,animate:false,debounceMoveend:false});
  });
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
    minZoom,
    maxZoom,
    scrollWheelZoom:options.scrollWheelZoom!==false,
    wheelDebounceTime:options.wheelDebounceTime||40,
    wheelPxPerZoomLevel:options.wheelPxPerZoomLevel||80,
    zoomAnimation:true,
    fadeAnimation:false,
    markerZoomAnimation:true,
    preferCanvas:true,
    inertia:true,
    inertiaDeceleration:3000,
    bounceAtZoomLimits:false
  };
  if(options.limitBounds!==false){
    mapOptions.maxBounds=bounds;
    mapOptions.maxBoundsViscosity=options.maxBoundsViscosity??0.55;
  }
  const map=L.map(element,mapOptions).setView(center,zoom);
  element._avariiMapInstance=map;
  const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution:'&copy; OpenStreetMap contributors',
    noWrap:true,
    minZoom,
    maxZoom,
    keepBuffer:8,
    updateWhenIdle:false,
    updateWhenZooming:false,
    updateInterval:180,
    crossOrigin:true
  });
  tiles.on('tileerror',event=>{
    if(event.tile)event.tile.style.visibility='hidden';
  });
  tiles.addTo(map);
  map._avariiTiles=tiles;
  map.whenReady(()=>{
    window.refreshAvariiMap(map,true);
  });
  return map;
};
