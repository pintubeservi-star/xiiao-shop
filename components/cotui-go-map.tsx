"use client";
import {useEffect,useRef,useState} from "react";
import {LocateFixed,Layers,MapPin} from "lucide-react";

declare global { interface Window { L?: any } }
type Point={lat:number;lng:number};
type Props={onPick?:(point:Point)=>void; initial?:Point };
const cotui={lat:19.0527,lng:-70.1494};

export default function CotuiGoMap({onPick,initial=cotui}:Props){
 const host=useRef<HTMLDivElement>(null), map=useRef<any>(null), marker=useRef<any>(null), layers=useRef<any>({});
 const [ready,setReady]=useState(false),[style,setStyle]=useState<"street"|"light">("light"),[locating,setLocating]=useState(false);
 useEffect(()=>{
  let cancelled=false;
  const addCss=()=>{if(!document.querySelector('link[data-cg-leaflet]')){const link=document.createElement("link");link.rel="stylesheet";link.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";link.dataset.cgLeaflet="1";document.head.appendChild(link);}};
  const init=()=>{
   if(cancelled||!host.current||!window.L)return;
   const L=window.L;
   const m=L.map(host.current,{zoomControl:false,scrollWheelZoom:true}).setView([initial.lat,initial.lng],15);
   layers.current.street=L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:20,attribution:'&copy; OpenStreetMap'});
   layers.current.light=L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",{maxZoom:20,attribution:'&copy; OpenStreetMap &copy; CARTO'});
   layers.current.light.addTo(m);
   L.control.zoom({position:"bottomright"}).addTo(m);
   const pin=L.divIcon({className:"cg-map-pin-wrap",html:'<div class="cg-map-pin"><span></span></div>',iconSize:[34,42],iconAnchor:[17,38]});
   marker.current=L.marker([initial.lat,initial.lng],{icon:pin,draggable:true}).addTo(m);
   marker.current.on("dragend",()=>{const p=marker.current.getLatLng();onPick?.({lat:p.lat,lng:p.lng});});
   m.on("click",(e:any)=>{marker.current.setLatLng(e.latlng);onPick?.({lat:e.latlng.lat,lng:e.latlng.lng});});
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
 const locate=()=>{if(!navigator.geolocation)return;setLocating(true);navigator.geolocation.getCurrentPosition(pos=>{const p={lat:pos.coords.latitude,lng:pos.coords.longitude};map.current?.setView([p.lat,p.lng],17);marker.current?.setLatLng([p.lat,p.lng]);onPick?.(p);setLocating(false);},()=>setLocating(false),{enableHighAccuracy:true,timeout:12000});};
 return <div className="relative h-full min-h-[330px] w-full overflow-hidden rounded-[26px] bg-[#e9efe9]">
  <div ref={host} className="absolute inset-0 z-0"/>
  <style jsx global>{`.cg-map-pin-wrap{background:transparent;border:0}.cg-map-pin{width:30px;height:30px;border-radius:50% 50% 50% 0;background:#a3e635;border:4px solid white;transform:rotate(-45deg);box-shadow:0 5px 18px #10251d55;display:grid;place-items:center}.cg-map-pin span{width:8px;height:8px;background:#14251d;border-radius:50%;transform:rotate(45deg)}.leaflet-control-zoom{border:0!important;box-shadow:0 3px 14px #10251d22!important;border-radius:12px!important;overflow:hidden}.leaflet-control-zoom a{color:#14251d!important;width:34px!important;height:34px!important;line-height:34px!important}`}</style>
  <div className="pointer-events-none absolute left-4 top-4 z-[400] rounded-2xl border border-white/70 bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur"><div className="flex items-center gap-2 text-xs font-black text-slate-800"><span className="h-2 w-2 rounded-full bg-lime-500 ring-4 ring-lime-100"/> Cotuí Go <span className="font-medium text-slate-400">· Cotuí</span></div><p className="mt-0.5 text-[10px] text-slate-500">Mueve el pin para elegir recogida</p></div>
  <div className="absolute right-4 top-4 z-[400] flex flex-col gap-2">
   <button type="button" onClick={()=>setStyle(v=>v==="street"?"light":"street")} aria-label="Cambiar estilo del mapa" className="grid h-11 w-11 place-items-center rounded-2xl border border-white bg-white text-slate-700 shadow-lg"><Layers size={18}/></button>
   <button type="button" onClick={locate} disabled={locating} aria-label="Mi ubicación" className="grid h-11 w-11 place-items-center rounded-2xl border border-white bg-white text-slate-700 shadow-lg"><LocateFixed size={18}/></button>
  </div>
  <div className="absolute bottom-4 left-4 z-[400] rounded-xl bg-[#14251d]/90 px-3 py-2 text-[10px] font-semibold text-white shadow-lg"><MapPin size={12} className="mr-1 inline text-lime-300"/> {ready?"Mapa interactivo":"Cargando mapa…"}</div>
 </div>;
}
