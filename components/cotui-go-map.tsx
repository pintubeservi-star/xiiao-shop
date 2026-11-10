"use client";
import {useEffect,useRef,useState} from "react";
import {LocateFixed,Layers,MapPin,AlertCircle} from "lucide-react";
import {loadCotuiGoMapLibre} from "@/lib/cotui-go-maplibre";
type Point={lat:number;lng:number};
type Props={onPick?:(point:Point)=>void;initial?:Point;theme?:"dark"|"light"};
const cotui={lat:19.0527,lng:-70.1494};
const mapStyleUrl=(dark=false)=>dark?"https://tiles.openfreemap.org/styles/dark":"https://tiles.openfreemap.org/styles/positron";
export default function CotuiGoMap({onPick,initial=cotui,theme="light"}:Props){
 const host=useRef<HTMLDivElement>(null),map=useRef<any>(null),marker=useRef<any>(null),onPickRef=useRef(onPick),themeRef=useRef(theme),fallbackUsed=useRef(false);
 const [ready,setReady]=useState(false),[style,setStyle]=useState<"dark"|"light">(theme),[locating,setLocating]=useState(false),[locationMessage,setLocationMessage]=useState(""),[mapError,setMapError]=useState("");
 useEffect(()=>{onPickRef.current=onPick;},[onPick]);
 useEffect(()=>{themeRef.current=theme;setStyle(theme);},[theme]);
 useEffect(()=>{
  let cancelled=false;
  const init=async()=>{
   try{
    const ml=await loadCotuiGoMapLibre();if(cancelled||!host.current)return;
    const m=new ml.Map({container:host.current,style:mapStyleUrl(themeRef.current==="dark"),center:[initial.lng,initial.lat],zoom:15,attributionControl:false,dragRotate:false,touchPitch:false,maxPitch:55});
    m.addControl(new ml.NavigationControl({showCompass:false,visualizePitch:false}),"bottom-right");
    m.addControl(new ml.AttributionControl({compact:true}),"bottom-left");
    const el=document.createElement("div");el.className="cg-vector-pickup-pin";el.innerHTML="<span></span>";
    const mk=new ml.Marker({element:el,draggable:true,anchor:"bottom"}).setLngLat([initial.lng,initial.lat]).addTo(m);
    mk.on("dragend",()=>{const p=mk.getLngLat();onPickRef.current?.({lat:p.lat,lng:p.lng});});
    m.on("click",(e:any)=>{mk.setLngLat(e.lngLat);onPickRef.current?.({lat:e.lngLat.lat,lng:e.lngLat.lng});});
    m.on("error",()=>{if(!fallbackUsed.current&&!cancelled){fallbackUsed.current=true;setMapError("No se pudo cargar una parte del mapa. Comprueba tu conexión.");}});
    m.on("load",()=>{if(!cancelled){setReady(true);setMapError("");requestAnimationFrame(()=>m.resize());}});
    const observer=new ResizeObserver(()=>{if(!cancelled)m.resize();});observer.observe(host.current);
    map.current=m;marker.current=mk;
   }catch(error){if(!cancelled)setMapError(error instanceof Error?error.message:"No se pudo iniciar el mapa.");}
  };
  void init();
  return()=>{cancelled=true;if(map.current){map.current.remove();map.current=null;}marker.current=null;};
 },[]);
 useEffect(()=>{if(!map.current)return;map.current.setStyle(mapStyleUrl(style==="dark"));},[style]);
 useEffect(()=>{if(map.current&&marker.current){map.current.easeTo({center:[initial.lng,initial.lat],zoom:16,duration:450});marker.current.setLngLat([initial.lng,initial.lat]);}},[initial.lat,initial.lng]);
 const locate=async()=>{
  if(!window.isSecureContext){setLocationMessage("Abre Cotuí Go mediante HTTPS para usar el GPS.");return;}
  if(!navigator.geolocation){setLocationMessage("Este navegador no ofrece geolocalización. Marca el punto manualmente.");return;}
  setLocating(true);setLocationMessage("");
  const getPosition=(options:PositionOptions)=>new Promise<GeolocationPosition>((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,options));
  try{
   let pos:GeolocationPosition;
   try{pos=await getPosition({enableHighAccuracy:true,timeout:15000,maximumAge:60000});}
   catch(first:any){if(first?.code===1)throw first;pos=await getPosition({enableHighAccuracy:false,timeout:15000,maximumAge:300000});}
   const p={lat:pos.coords.latitude,lng:pos.coords.longitude};if(!Number.isFinite(p.lat)||!Number.isFinite(p.lng))throw new Error("La ubicación recibida no es válida.");
   map.current?.flyTo({center:[p.lng,p.lat],zoom:17});marker.current?.setLngLat([p.lng,p.lat]);onPickRef.current?.(p);
   setLocationMessage(pos.coords.accuracy>1000?"Ubicación aproximada. Ajusta el pin si hace falta.":"Ubicación encontrada correctamente.");
  }catch(error:any){setLocationMessage(error?.code===1?"Permiso denegado. Activa la ubicación para tu navegador.":error?.code===2?"No se pudo determinar la ubicación. Activa Wi-Fi y GPS.":error?.code===3?"El GPS tardó demasiado. Marca el punto manualmente.":error instanceof Error?error.message:"No se pudo obtener la ubicación.");}
  finally{setLocating(false);}
 };
 return <div className="relative h-full min-h-[330px] w-full overflow-hidden rounded-none bg-[#e9edf0]">
  <div ref={host} className="absolute inset-0 z-0"/>
  <div className="absolute right-4 top-20 z-[400] flex flex-col gap-2">
   <button type="button" onClick={()=>setStyle(v=>v==="dark"?"light":"dark")} aria-label="Cambiar estilo del mapa" title="Cambiar estilo del mapa" className="grid h-11 w-11 place-items-center rounded-2xl border border-white bg-white text-slate-700 shadow-lg"><Layers size={18}/></button>
   <button type="button" onClick={locate} disabled={locating} aria-label="Mi ubicación" title="Mi ubicación" className="grid h-11 w-11 place-items-center rounded-2xl border border-white bg-white text-slate-700 shadow-lg disabled:opacity-50"><LocateFixed size={18}/></button>
  </div>
  <div className="absolute left-4 right-4 top-[150px] z-[400] flex flex-col items-start gap-2">
   <div className="rounded-xl bg-[#14251d]/90 px-3 py-2 text-[10px] font-semibold text-white shadow-lg"><MapPin size={12} className="mr-1 inline text-lime-300"/>{ready?"Mapa listo":"Cargando mapa…"} · OpenFreeMap</div>
   {(locationMessage||mapError)&&<div role="status" className="max-w-full rounded-xl border border-white/80 bg-white px-3 py-2 text-[11px] font-semibold leading-4 text-slate-800 shadow-lg"><AlertCircle size={13} className="mr-1 inline"/>{locationMessage||mapError}</div>}
  </div>
 </div>;
}
