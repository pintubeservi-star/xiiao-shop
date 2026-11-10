"use client";
import {useEffect,useRef,useState} from "react";
import {LocateFixed,Layers,MapPin,AlertCircle} from "lucide-react";
import {loadCotuiGoLeaflet} from "@/lib/cotui-go-leaflet";

type Point={lat:number;lng:number};
type Props={onPick?:(point:Point)=>void;initial?:Point;theme?:"dark"|"light"};
const cotui={lat:19.0527,lng:-70.1494};
const CARTO_KEY="cb1_564_1_cbce9929de4935e1d11868dd";

export default function CotuiGoMap({onPick,initial=cotui,theme="light"}:Props){
 const host=useRef<HTMLDivElement>(null),map=useRef<any>(null),marker=useRef<any>(null),layers=useRef<Record<string,any>>({}),onPickRef=useRef(onPick);
 const [ready,setReady]=useState(false),[style,setStyle]=useState<"dark"|"light">(theme),[locating,setLocating]=useState(false),[locationMessage,setLocationMessage]=useState(""),[mapError,setMapError]=useState("");
 useEffect(()=>{onPickRef.current=onPick;},[onPick]);

 useEffect(()=>{
  let cancelled=false;
  const init=async()=>{
   try{
    const L=await loadCotuiGoLeaflet();
    if(cancelled||!host.current)return;
    const m=L.map(host.current,{zoomControl:false,scrollWheelZoom:true}).setView([initial.lat,initial.lng],15);
    const addLayer=(name:"light"|"dark",url:string)=>{
     const layer=L.tileLayer(url,{maxZoom:20,attribution:'&copy; OpenStreetMap contributors &copy; CARTO'});
     let fallback=false;
     layer.on("tileerror",()=>{
      if(fallback||cancelled||!map.current)return;
      fallback=true;
      const osm=L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'});
      osm.addTo(m);
      setMapError("El proveedor del mapa no respondió. Mostrando mapa alternativo.");
     });
     layers.current[name]=layer;
    };
    addLayer("light","https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key="+CARTO_KEY);
    addLayer("dark","https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key="+CARTO_KEY);
    layers.current[theme].addTo(m);
    L.control.zoom({position:"bottomright"}).addTo(m);
    const pin=L.divIcon({className:"cg-map-pin-wrap",html:'<div class="cg-map-pin"><span></span></div>',iconSize:[34,42],iconAnchor:[17,38]});
    const markerInstance=L.marker([initial.lat,initial.lng],{icon:pin,draggable:true}).addTo(m);
    marker.current=markerInstance;
    markerInstance.on("dragend",()=>{const p=markerInstance.getLatLng();onPickRef.current?.({lat:p.lat,lng:p.lng});});
    m.on("click",(e:any)=>{markerInstance.setLatLng(e.latlng);onPickRef.current?.({lat:e.latlng.lat,lng:e.latlng.lng});});
    map.current=m;
    setReady(true);
    window.setTimeout(()=>{if(!cancelled)m.invalidateSize();},250);
   }catch(error){
    if(!cancelled)setMapError(error instanceof Error?error.message:"No se pudo iniciar el mapa.");
   }
  };
  void init();
  return()=>{cancelled=true;if(map.current){map.current.remove();map.current=null;}marker.current=null;layers.current={};};
 },[]);

 useEffect(()=>{setStyle(theme);},[theme]);
 useEffect(()=>{
  if(!map.current||!layers.current[style])return;
  Object.entries(layers.current).forEach(([key,layer])=>{if(key!==style&&map.current.hasLayer(layer))map.current.removeLayer(layer);});
  if(!map.current.hasLayer(layers.current[style]))layers.current[style].addTo(map.current);
 },[style,ready]);

 useEffect(()=>{
  if(map.current&&marker.current){map.current.setView([initial.lat,initial.lng],16);marker.current.setLatLng([initial.lat,initial.lng]);}
 },[initial.lat,initial.lng]);

 const locate=async()=>{
  if(!window.isSecureContext){setLocationMessage("Abre Cotuí Go mediante HTTPS para usar el GPS.");return;}
  if(!navigator.geolocation){setLocationMessage("Este navegador no ofrece geolocalización. Marca el punto manualmente.");return;}
  setLocating(true);setLocationMessage("");
  const getPosition=(options:PositionOptions)=>new Promise<GeolocationPosition>((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,options));
  try{
   let pos:GeolocationPosition;
   try{pos=await getPosition({enableHighAccuracy:true,timeout:15000,maximumAge:60000});}
   catch(first:any){if(first?.code===1)throw first;pos=await getPosition({enableHighAccuracy:false,timeout:15000,maximumAge:300000});}
   const p={lat:pos.coords.latitude,lng:pos.coords.longitude};
   if(!Number.isFinite(p.lat)||!Number.isFinite(p.lng))throw new Error("La ubicación recibida no es válida.");
   map.current?.setView([p.lat,p.lng],17);marker.current?.setLatLng([p.lat,p.lng]);onPickRef.current?.(p);
   setLocationMessage(pos.coords.accuracy>1000?"Ubicación aproximada. Ajusta el pin si hace falta.":"Ubicación encontrada correctamente.");
  }catch(error:any){
   setLocationMessage(error?.code===1?"Permiso denegado. Activa la ubicación para tu navegador.":error?.code===2?"No se pudo determinar la ubicación. Activa Wi-Fi y GPS.":error?.code===3?"El GPS tardó demasiado. Marca el punto manualmente.":error instanceof Error?error.message:"No se pudo obtener la ubicación.");
  }finally{setLocating(false);}
 };

 return <div className="relative h-full min-h-[330px] w-full overflow-hidden rounded-none bg-[#e8eee8]">
  <div ref={host} className="absolute inset-0 z-0"/>
  <style jsx global>{`.cg-map-pin-wrap{background:transparent;border:0}.cg-map-pin{width:30px;height:30px;border-radius:50% 50% 50% 0;background:#a3e635;border:4px solid white;transform:rotate(-45deg);box-shadow:0 5px 18px #10251d55;display:grid;place-items:center}.cg-map-pin span{width:8px;height:8px;background:#14251d;border-radius:50%;transform:rotate(45deg)}.leaflet-control-zoom{border:0!important;box-shadow:0 3px 14px #10251d22!important;border-radius:12px!important;overflow:hidden}.leaflet-control-zoom a{color:#14251d!important;width:34px!important;height:34px!important;line-height:34px!important}`}</style>
  <div className="absolute right-4 top-4 z-[400] flex flex-col gap-2">
   <button type="button" onClick={()=>setStyle(v=>v==="dark"?"light":"dark")} aria-label="Cambiar estilo del mapa" title="Cambiar estilo del mapa" className="grid h-11 w-11 place-items-center rounded-2xl border border-white bg-white text-slate-700 shadow-lg"><Layers size={18}/></button>
   <button type="button" onClick={locate} disabled={locating} aria-label="Mi ubicación" title="Mi ubicación" className="grid h-11 w-11 place-items-center rounded-2xl border border-white bg-white text-slate-700 shadow-lg disabled:opacity-50"><LocateFixed size={18}/></button>
  </div>
  <div className="absolute bottom-4 left-4 right-4 z-[400] flex flex-col items-start gap-2">
   <div className="rounded-xl bg-[#14251d]/90 px-3 py-2 text-[10px] font-semibold text-white shadow-lg"><MapPin size={12} className="mr-1 inline text-lime-300"/>{ready?"Mapa interactivo listo":"Cargando mapa…"}</div>
   {(locationMessage||mapError)&&<div role="status" className="max-w-full rounded-xl border border-white/80 bg-white px-3 py-2 text-[11px] font-semibold leading-4 text-slate-800 shadow-lg"><AlertCircle size={13} className="mr-1 inline"/>{locationMessage||mapError}</div>}
  </div>
 </div>;
}
