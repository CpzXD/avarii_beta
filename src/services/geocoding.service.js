const cache=new Map();

function fallback(lat,lng){return `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`}

function compactAddress(data){
  const a=data?.address||{};
  const street=[a.road||a.pedestrian||a.footway||a.path,a.house_number].filter(Boolean).join(' ');
  const area=a.neighbourhood||a.suburb||a.quarter||a.residential;
  const city=a.city||a.town||a.village||a.municipality;
  const parts=[street,area,city].filter(Boolean).filter((value,index,array)=>array.indexOf(value)===index);
  return parts.join(', ')||data?.display_name||'';
}

async function reverseGeocode(lat,lng){
  const latitude=Number(lat),longitude=Number(lng);
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude))return '';
  const key=`${latitude.toFixed(5)},${longitude.toFixed(5)}`;
  if(cache.has(key))return cache.get(key);
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),5000);
  try{
    const url=new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('format','jsonv2');
    url.searchParams.set('lat',String(latitude));
    url.searchParams.set('lon',String(longitude));
    url.searchParams.set('zoom','18');
    url.searchParams.set('addressdetails','1');
    url.searchParams.set('accept-language','ro');
    const response=await fetch(url,{headers:{'User-Agent':'AvariiIluminatBeta/1.0 (+https://avarii-beta.onrender.com)','Accept-Language':'ro'},signal:controller.signal});
    if(!response.ok)throw new Error('Geocodarea nu este disponibilă.');
    const address=compactAddress(await response.json())||fallback(latitude,longitude);
    cache.set(key,address);
    return address;
  }catch{
    return fallback(latitude,longitude);
  }finally{
    clearTimeout(timer);
  }
}

module.exports={reverseGeocode};
