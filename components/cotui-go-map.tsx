"use client";
import {useEffect,useRef,useState} from "react";
import {LocateFixed,Layers,MapPin,AlertCircle} from "lucide-react";
import {loadCotuiGoLeaflet} from "@/lib/cotui-go-maplibre";
type Point={lat:number;lng:number};
type Props={onPick?:(point:Point)=>void;initial?:Point;secondary?:Point|null;target?:"pickup"|"destination";theme?:"dark"|"light"};
const cotui={lat:19.0527,lng:-70.1494};
export default function CotuiGoMap({onPick,initial=cotui,secondary=null,target="pickup",theme="light"}:Props){
 const host=useRef<HTMLDivElement>(null),map=useRef<any>(null),pickupMarker=useRef<any>(null),destinationMarker=useRef<any>(null),onPickRef=useRef(onPick),targetRef=useRef(target);
 const [ready,setReady]=useState(false),[style,setStyle]=useState<"dark"|"light">(theme),[locating,setLocating]=useState(false),[locationMessage,setLocationMessage]=useState(""),[mapError,setMapError]=useState("");
 useEffect(()=>{onPickRef.current=onPick;},[onPick]);
 useEffect(()=>{targetRef.current=target;setStyle(theme);},[target,theme]);
 useEffect(()=>{
  let cancelled=false,observer:ResizeObserver|undefined;
  const init=async()=>{
   try{
    const L=await loadCotuiGoLeaflet();if(cancelled||!host.current)return;
    const m=L.map(host.current,{zoomControl:false,attributionControl:false,preferCanvas:true,scrollWheelZoom:true}).setView([initial.lat,initial.lng],15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap contributors",crossOrigin:true}).addTo(m);
    L.control.zoom({position:"bottomright"}).addTo(m);L.control.attribution({position:"bottomleft",prefix:false}).addTo(m);
    const pickupIcon=L.divIcon({className:"cg-leaflet-pin-wrap",html:'<span class="cg-leaflet-pin cg-pickup-pin"><i></i></span>',iconSize:[34,42],iconAnchor:[17,42]});
    const destinationIcon=L.divIcon({className:"cg-leaflet-pin-wrap",html:'<span class="cg-leaflet-pin cg-destination-pin"><i></i></span>',iconSize:[34,42],iconAnchor:[17,42]});
    const pm=L.marker([initial.lat,initial.lng],{icon:pickupIcon,draggable:targetRef.current==="pickup"}).addTo(m);
    const dm=secondary?L.marker([secondary.lat,secondary.lng],{icon:destinationIcon,draggable:targetRef.current==="destination"}).addTo(m):null;
    pm.on("dragend",()=>{const p=pm.getLatLng();onPickRef.current?.({lat:p.lat,lng:p.lng});});
    if(dm)dm.on("dragend",()=>{const p=dm.getLatLng();onPickRef.current?.({lat:p.lat,lng:p.lng});});
    m.on("click",(e:any)=>onPickRef.current?.({lat:e.latlng.lat,lng:e.latlng.lng}));
    map.current=m;pickupMarker.current=pm;destinationMarker.current=dm;setReady(true);
    observer=new ResizeObserver(()=>m.invalidateSize({pan:false}));observer.observe(host.current);
    window.setTimeout(()=>{if(!cancelled)m.invalidateSize({pan:false});},250);
   }catch(error){if(!cancelled)setMapError(error instanceof Error?error.message:"No se pudo iniciar el mapa.");}
  };
  void init();
  return()=>{cancelled=true;observer?.disconnect();if(map.current){map.current.remove();map.current=null;}pickupMarker.current=null;destinationMarker.current=null;};
 },[]);
 useEffect(()=>{
  const m=map.current,pm=pickupMarker.current,dm=destinationMarker.current;if(!m||!pm)return;
  pm.setLatLng([initial.lat,initial.lng]);pm.dragging?.[target==="pickup"?"enable":"disable"]();
  if(secondary){if(dm)dm.setLatLng([secondary.lat,secondary.lng]);else{const L=window.L;const icon=L.divIcon({className:"cg-leaflet-pin-wrap",html:'<span class="cg-leaflet-pin cg-destination-pin"><i></i></span>',iconSize:[34,42],iconAnchor:[17,42]});const marker=L.marker([secondary.lat,secondary.lng],{icon,draggable:target==="destination"}).addTo(m);marker.on("dragend",()=>{const p=marker.getLatLng();onPickRef.current?.({lat:p.lat,lng:p.lng});});destinationMarker.current=marker;}destinationMarker.current?.dragging?.[target==="destination"?"enable":"disable"]();}
  else if(dm){m.removeLayer(dm);destinationMarker.current=null;}
 },[initial.lat,initial.lng,secondary?.lat,secondary?.lng,target]);
 const locate=async()=>{
  if(!window.isSecureContext){setLocationMessage("Abre Cotuí Go mediante HTTPS para usar el GPS.");return;}
  if(!navigator.geolocation){setLocationMessage("Este navegador no ofrece geolocalización. Marca el punto manualmente.");return;}
  setLocating(true);setLocationMessage("");
  try{const pos=await new Promise<GeolocationPosition>((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:true,timeout:12000,maximumAge:60000}));const p={lat:pos.coords.latitude,lng:pos.coords.longitude};map.current?.setView([p.lat,p.lng],17);onPickRef.current?.(p);setLocationMessage(pos.coords.accuracy>1000?"Ubicación aproximada. Ajusta el pin si hace falta.":"Ubicación encontrada correctamente.");}
  catch(error:any){setLocationMessage(error?.code===1?"Permiso denegado. Activa la ubicación para tu navegador.":error?.code===3?"El GPS tardó demasiado. Marca el punto manualmente.":"No se pudo obtener la ubicación. Marca el punto manualmente.");}
  finally{setLocating(false);}
 };
 return <div className="relative h-full min-h-[330px] w-full overflow-hidden rounded-none bg-[#e9edf0]">
  <div ref={host} className="absolute inset-0 z-0 cg-leaflet-map"/>
  <style jsx global>{".cg-leaflet-map{height:100%;width:100%;background:#e9edf0}.cg-leaflet-map .leaflet-tile{max-width:none!important}.cg-leaflet-pin-wrap{background:transparent;border:0}.cg-leaflet-pin{display:block;position:relative;width:34px;height:42px;border-radius:50% 50% 50% 0;background:#a3e635;border:3px solid white;transform:rotate(-45deg);box-shadow:0 3px 12px #14251d55}.cg-leaflet-pin i{position:absolute;width:10px;height:10px;border-radius:50%;background:#14251d;left:9px;top:9px}.cg-leaflet-pin.cg-destination-pin{background:#2563eb}.cg-leaflet-pin.cg-destination-pin i{background:white}.leaflet-control-attribution{font-size:9px!important}.leaflet-control-zoom a{color:#14251d!important}"}</style>
  <div className="absolute right-4 top-20 z-[400] flex flex-col gap-2"><button type="button" onClick={()=>setStyle(v=>v==="dark"?"light":"dark")} aria-label="Cambiar estilo del mapa" title="Cambiar estilo del mapa" className="grid h-11 w-11 place-items-center rounded-2xl border border-white bg-white text-slate-700 shadow-lg"><Layers size={18}/></button><button type="button" onClick={locate} disabled={locating} aria-label="Mi ubicación" title="Mi ubicación" className="grid h-11 w-11 place-items-center rounded-2xl border border-white bg-white text-slate-700 shadow-lg disabled:opacity-50"><LocateFixed size={18}/></button></div>
  <div className="absolute left-4 right-4 top-[150px] z-[400] flex flex-col items-start gap-2"><div className="rounded-xl bg-[#14251d]/90 px-3 py-2 text-[10px] font-semibold text-white shadow-lg"><MapPin size={12} className="mr-1 inline text-lime-300"/>{ready?"Mapa interactivo listo":"Cargando mapa…"} · OpenStreetMap</div>{(locationMessage||mapError)&&<div role="status" className="max-w-full rounded-xl border border-white/80 bg-white px-3 py-2 text-[11px] font-semibold leading-4 text-slate-800 shadow-lg"><AlertCircle size={13} className="mr-1 inline"/>{locationMessage||mapError}</div>}</div>
 </div>;
}
