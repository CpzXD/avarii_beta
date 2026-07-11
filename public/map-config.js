window.AVARII_MAP_CONFIG={center:[44.215,28.635],bounds:[[44.10,28.50],[44.34,28.75]],minZoom:12,maxZoom:19,defaultZoom:13};
window.AVARII_ADMIN_MAP_CONFIG={center:[44.23,28.64],bounds:[[44.02,28.35],[44.48,28.90]],minZoom:10,maxZoom:19,defaultZoom:12};
window.avariiMapBounds=function(){return L.latLngBounds(window.AVARII_MAP_CONFIG.bounds[0],window.AVARII_MAP_CONFIG.bounds[1])};
window.avariiAdminMapBounds=function(){return L.latLngBounds(window.AVARII_ADMIN_MAP_CONFIG.bounds[0],window.AVARII_ADMIN_MAP_CONFIG.bounds[1])};
window.isInsideAvariiArea=function(lat,lng){return window.avariiMapBounds().contains(L.latLng(Number(lat),Number(lng)))};
window.createAvariiMap=function(id,options={}){
  const config=options.mode==='admin'?window.AVARII_ADMIN_MAP_CONFIG:window.AVARII_MAP_CONFIG;
  const bounds=L.latLngBounds((options.bounds||config.bounds)[0],(options.bounds||config.bounds)[1]);
  const center=options.center||config.center;
  const zoom=options.zoom??config.defaultZoom;
  const minZoom=options.minZoom??config.minZoom;
  const maxZoom=options.maxZoom??config.maxZoom;
  const mapOptions={minZoom,maxZoom,scrollWheelZoom:options.scrollWheelZoom!==false,wheelDebounceTime:options.wheelDebounceTime||40,wheelPxPerZoomLevel:options.wheelPxPerZoomLevel||80};
  if(options.limitBounds!==false){mapOptions.maxBounds=bounds;mapOptions.maxBoundsViscosity=options.maxBoundsViscosity??0.85}
  const map=L.map(id,mapOptions).setView(center,zoom);
  if(options.limitBounds!==false){map.on('drag',()=>map.panInsideBounds(bounds,{animate:false}))}
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap',noWrap:true,minZoom,maxZoom}).addTo(map);
  return map;
};
