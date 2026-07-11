window.isGenericAvariiLocation=function(value){
  const text=String(value||'').trim().toLowerCase();
  return !text||text==='locație gps'||text==='locatie gps'||text==='gps'||/^-?\d+(?:\.\d+)?,\s*-?\d+(?:\.\d+)?$/.test(text);
};
window.avariiCoordinateLabel=function(lat,lng){
  const latitude=Number(lat),longitude=Number(lng);
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude))return 'Locație nespecificată';
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
};
window.avariiLocationLabel=function(avarie){
  if(avarie&&!window.isGenericAvariiLocation(avarie.adresaText))return avarie.adresaText;
  return window.avariiCoordinateLabel(avarie?.lat,avarie?.lng);
};
window.reverseAvariiLocation=async function(lat,lng){
  const fallback=window.avariiCoordinateLabel(lat,lng);
  try{
    const response=await fetch(`/geocoding/reverse?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`);
    if(!response.ok)return fallback;
    const data=await response.json();
    return data.adresa||fallback;
  }catch{return fallback}
};
