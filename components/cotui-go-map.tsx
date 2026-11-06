"use client";
import {useEffect,useRef,useState} from "react";
import {LocateFixed,Layers,MapPin} from "lucide-react";

declare global { interface Window { L?: any } }
type Point={lat:number;lng:number};
type Props={onPick?:(point:Point)=>void; initial?:Point };
const cotui={lat:19.0527,lng:-70.1494};

export default function CotuiGoMap({onPick,initial=cotui}:Props){
 const host=useRef<HTMLDivElement>(null), map=useRef<any>(null), marker=useRef<any>(null), layers=useRef<any>({}), onPickRef=useRef(onPick);
 const [ready,setReady]=useState(false),[style,setStyle]=useState<"street"|"light">("light"),[locating,setLocating]=useState(false),[locationMessage,setLocationMessage]=useState("");
 useEffect(()=>{onPickRef.current=onPick;},[onPick]);
 useEffect(()=>{
  let cancelled=false;
  const addCss=()=>{if(!document.querySelector('link[data-cg-leaflet]')){const link=document.createElement("link");link.rel="stylesheet";link.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";link.dataset.cgLeaflet="1";document.head.appendChild(link);}};
  const init=()=>{
   if(cancelled||!host.current||!window.L)return;
   const L=window.L;
   const m=L.map(host.current,{zoomControl:false,scrollWheelZoom:true}).setView([initial.lat,initial.lng],15);
   layers.current.street=L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; OpenStreetMap contributors, HOT'});
   layers.current.light=L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'});
   layers.current.light.addTo(m);
   L.control.zoom({position:"bottomright"}).addTo(m);
   const pin=L.divIcon({className:"cg-map-pin-wrap",html:'<div class="cg-map-pin"><span></span></div>',iconSize:[34,42],iconAnchor:[17,38]});
   marker.current=L.marker([initial.lat,initial.lng],{icon:pin,draggable:true}).addTo(m);
   marker.current.on("dragend",()=>{const p=marker.current.getLatLng();onPickRef.current?.({lat:p.lat,lng:p.lng});});
   m.on("click",(e:any)=>{marker.current.setLatLng(e.latlng);onPickRef.current?.({lat:e.latlng.lat,lng:e.latlng.lng});});
   map.current=m;setReady(true);setTimeout(()=>m.invalidateSize(),250);
  };
  addCss();
  if(window.L){init();}else{
   const script=document.querySelector<HTMLScriptElement>('script[data-cg-leaflet]');
   if(script){script.addEventListener("load",init);return()=>{cancelled=true;script.removeEventListener("load",init);};}
   const s=document.createElement("script");s.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";s.async=true;s.dataset.cgLeaflet="1";s.onload=init;document.body.appendChild(s);
  }
  return()=>{cancelled=true;if(map.current){map.current.remove();map.current=null;}};
 },[]);
 useEffect(()=>{if(map.current&&marker.current){map.current.setView([initial.lat,initial.lng],16);marker.current.setLatLng([initial.lat,initial.lng]);}},[initial.lat,initial.lng]);
 useEffect(()=>{if(!map.current)return;const L=window.L;Object.values(layers.current).forEach((layer:any)=>map.current.removeLayer(layer));layers.current[style].addTo(map.current);},[style,ready]);
 const locate=async()=>{
  if(!window.isSecureContext){setLocationMessage("Abre Cotuí Go mediante HTTPS para usar el GPS.");return;}
  if(!navigator.geolocation){setLocationMessage("Este navegador no ofrece geolocalización. Usa Safari o marca el punto manualmente.");return;}
  setLocating(true);setLocationMessage("");
  const getPosition=(options:PositionOptions)=>new Promise<GeolocationPosition>((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,options));
  try{
   let pos:GeolocationPosition;
   try{pos=await getPosition({enableHighAccuracy:true,timeout:20000,maximumAge:60000});}
   catch(first:any){if(first?.code===1)throw first;pos=await getPosition({enableHighAccuracy:false,timeout:25000,maximumAge:300000});}
   const p={lat:pos.coords.latitude,lng:pos.coords.longitude};
   if(!Number.isFinite(p.lat)||!Number.isFinite(p.lng))throw new Error("El iPhone devolvió una ubicación inválida.");
   map.current?.setView([p.lat,p.lng],17);marker.current?.setLatLng([p.lat,p.lng]);onPickRef.current?.(p);
   setLocationMessage(pos.coords.accuracy>1000?"Ubicación aproximada. Ajusta el pin si es necesario.":"Ubicación encontrada.");
  }catch(e:any){
   setLocationMessage(e?.code===1?"Permiso denegado: activa Localización para Safari en Ajustes del iPhone.":e?.code===2?"No se pudo determinar la ubicación. Activa Wi‑Fi y Localización.":e?.code===3?"El GPS tardó demasiado. Marca el punto manualmente en el mapa.":e instanceof Error?e.message:"No se pudo obtener la ubicación. Marca el punto en el mapa.");
  }finally{setLocating(false);}
 };
 return <div className="relative h-full min-h-[330px] w-full overflow-hidden rounded-[26px] bg-[#e9efe9]">
  <div ref={host} className="absolute inset-0 z-0"/>
  <style jsx global>{`.cg-map-pin-wrap{background:transparent;border:0}.cg-map-pin{width:30px;height:30px;border-radius:50% 50% 50% 0;background:#a3e635;border:4px solid white;transform:rotate(-45deg);box-shadow:0 5px 18px #10251d55;display:grid;place-items:center}.cg-map-pin span{width:8px;height:8px;background:#14251d;border-radius:50%;transform:rotate(45deg)}.leaflet-control-zoom{border:0!important;box-shadow:0 3px 14px #10251d22!important;border-radius:12px!important;overflow:hidden}.leaflet-control-zoom a{color:#14251d!important;width:34px!important;height:34px!important;line-height:34px!important}`}</style>
  
  <div className="absolute right-4 top-4 z-[400] flex flex-col gap-2">
   <button type="button" onClick={()=>setStyle(v=>v==="street"?"light":"street")} aria-label="Cambiar estilo del mapa" className="grid h-11 w-11 place-items-center rounded-2xl border border-white bg-white text-slate-700 shadow-lg"><Layers size={18}/></button>
   <button type="button" onClick={locate} disabled={locating} aria-label="Mi ubicación" className="grid h-11 w-11 place-items-center rounded-2xl border border-white bg-white text-slate-700 shadow-lg"><LocateFixed size={18}/></button>
  </div>
  <div className="absolute bottom-4 left-4 right-4 z-[400] flex flex-col items-start gap-2"><div className="rounded-xl bg-[#14251d]/90 px-3 py-2 text-[10px] font-semibold text-white shadow-lg"><MapPin size={12} className="mr-1 inline text-lime-300"/> {ready?"Mapa interactivo":"Cargando mapa…"}</div>{locationMessage&&<div role="status" className="max-w-full rounded-xl border border-white/80 bg-white px-3 py-2 text-[11px] font-semibold leading-4 text-slate-800 shadow-lg">{locationMessage}</div>}</div>
 </div>;
}
