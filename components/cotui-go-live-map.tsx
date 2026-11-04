"use client";
import {useEffect,useRef} from "react";
import {LocateFixed,Navigation} from "lucide-react";
declare global {interface Window{L?:any}}
type Props={driver?:{lat:number|null;lng:number|null}|null;pickup?:{lat:number|null;lng:number|null}|null;destination?:{lat:number|null;lng:number|null}|null;className?:string};
const center={lat:19.0527,lng:-70.1494};
export default function CotuiGoLiveMap({driver,pickup,destination,className=""}:Props){
 const host=useRef<HTMLDivElement>(null),map=useRef<any>(null),driverMarker=useRef<any>(null),route=useRef<any>(null),pickupMarker=useRef<any>(null),destMarker=useRef<any>(null);
 const latest=useRef({driver,pickup,destination});
 useEffect(()=>{latest.current={driver,pickup,destination};},[driver,pickup,destination]);
 useEffect(()=>{
  let cancelled=false;
  const setup=()=>{if(cancelled||!host.current||!window.L)return;const L=window.L;const m=L.map(host.current,{zoomControl:false,scrollWheelZoom:true}).setView([center.lat,center.lng],14);
   L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",{maxZoom:20,attribution:'&copy; OpenStreetMap &copy; CARTO'}).addTo(m);
   L.control.zoom({position:"bottomright"}).addTo(m);map.current=m;render();setTimeout(()=>m.invalidateSize(),150);
  };
  const render=()=>{const L=window.L,m=map.current;if(!L||!m)return;const v=latest.current;
   const icon=(color:string,symbol:string)=>L.divIcon({className:"cg-live-pin",html:`<div style="width:38px;height:38px;border:3px solid white;border-radius:50%;background:${color};display:grid;place-items:center;box-shadow:0 5px 16px #10251d44;color:#10251d;font-weight:900">${symbol}</div>`,iconSize:[38,38],iconAnchor:[19,19]});
   if(v.driver?.lat!=null&&v.driver.lng!=null){const p=[v.driver.lat,v.driver.lng];if(driverMarker.current)driverMarker.current.setLatLng(p);else driverMarker.current=L.marker(p,{icon:icon("#a3e635","●"),zIndexOffset:1000}).addTo(m).bindTooltip("Conductor");}
   if(v.pickup?.lat!=null&&v.pickup.lng!=null){const p=[v.pickup.lat,v.pickup.lng];if(pickupMarker.current)pickupMarker.current.setLatLng(p);else pickupMarker.current=L.marker(p,{icon:icon("#ffffff","P")}).addTo(m).bindTooltip("Recogida");}
   if(v.destination?.lat!=null&&v.destination.lng!=null){const p=[v.destination.lat,v.destination.lng];if(destMarker.current)destMarker.current.setLatLng(p);else destMarker.current=L.marker(p,{icon:icon("#dbeafe","D")}).addTo(m).bindTooltip("Destino");}
   const pts:any[]=[];if(v.driver?.lat!=null&&v.driver.lng!=null)pts.push([v.driver.lat,v.driver.lng]);if(v.pickup?.lat!=null&&v.pickup.lng!=null)pts.push([v.pickup.lat,v.pickup.lng]);if(v.destination?.lat!=null&&v.destination.lng!=null)pts.push([v.destination.lat,v.destination.lng]);
   if(pts.length>1){if(route.current)route.current.setLatLngs(pts);else route.current=L.polyline(pts,{color:"#65a30d",weight:5,opacity:.85,dashArray:"10 8"}).addTo(m);}
   if(pts.length)m.fitBounds(L.latLngBounds(pts).pad(.25),{maxZoom:16});
  };
  if(window.L){setup();}else{const css=document.createElement("link");css.rel="stylesheet";css.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";css.dataset.cgLiveCss="1";if(!document.querySelector('link[data-cg-live-css]'))document.head.appendChild(css);const existing=document.querySelector<HTMLScriptElement>('script[data-cg-leaflet]');if(existing){existing.addEventListener("load",setup);}else{const s=document.createElement("script");s.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";s.async=true;s.dataset.cgLeaflet="1";s.onload=setup;document.body.appendChild(s);}}
  return()=>{cancelled=true;if(map.current){map.current.remove();map.current=null;}};
 },[]);
 useEffect(()=>{if(!map.current)return;const L=window.L,m=map.current,v={driver,pickup,destination};if(driver?.lat!=null&&driver.lng!=null){const p=[driver.lat,driver.lng];if(driverMarker.current)driverMarker.current.setLatLng(p);else driverMarker.current=L.marker(p).addTo(m);}if(pickup?.lat!=null&&pickup.lng!=null){const p=[pickup.lat,pickup.lng];if(pickupMarker.current)pickupMarker.current.setLatLng(p);else pickupMarker.current=L.marker(p).addTo(m);}const pts:any[]=[];if(v.driver?.lat!=null&&v.driver.lng!=null)pts.push([v.driver.lat,v.driver.lng]);if(v.pickup?.lat!=null&&v.pickup.lng!=null)pts.push([v.pickup.lat,v.pickup.lng]);if(v.destination?.lat!=null&&v.destination.lng!=null)pts.push([v.destination.lat,v.destination.lng]);if(pts.length>1){if(route.current)route.current.setLatLngs(pts);else route.current=L.polyline(pts,{color:"#65a30d",weight:5,opacity:.85,dashArray:"10 8"}).addTo(m);}},[driver?.lat,driver?.lng,pickup?.lat,pickup?.lng,destination?.lat,destination?.lng]);
 return <div className={`relative h-full min-h-[280px] w-full overflow-hidden rounded-3xl bg-[#edf2eb] ${className}`}><div ref={host} className="absolute inset-0"/><div className="pointer-events-none absolute left-3 top-3 z-[400] rounded-xl border border-white/80 bg-white/95 px-3 py-2 text-xs font-extrabold text-slate-800 shadow"><Navigation size={13} className="mr-1 inline text-lime-700"/> Cotuí Go · Mapa en vivo</div><button onClick={()=>{if(driver?.lat!=null&&driver.lng!=null)map.current?.setView([driver.lat,driver.lng],17);}} className="absolute right-3 top-3 z-[400] grid h-10 w-10 place-items-center rounded-xl bg-white shadow"><LocateFixed size={17}/></button></div>;
}