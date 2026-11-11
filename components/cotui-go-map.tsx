"use client";
import {useEffect,useRef,useState} from "react";
import {LocateFixed,Layers,MapPin,AlertCircle} from "lucide-react";
import {loadCotuiGoMapLibre,COTUI_GO_MAP_STYLES,COTUI_GO_CENTER} from "@/lib/cotui-go-maplibre";
type Point={lat:number;lng:number};
type Props={onPick?:(point:Point)=>void;initial?:Point|null;secondary?:Point|null;target?:"pickup"|"destination";theme?:"dark"|"light"};
function pinElement(kind:"pickup"|"destination"){
 const el=document.createElement("div");
 el.className="cg-map-pin "+(kind==="pickup"?"cg-map-pin-pickup":"cg-map-pin-destination");
 el.innerHTML=kind==="pickup"?"<span>●</span>":"<span>◆</span>";
 return el;
}
export default function CotuiGoMap({onPick,initial,secondary=null,target="pickup",theme="light"}:Props){
 const safeInitial:Point = initial && Number.isFinite(initial.lat) && Number.isFinite(initial.lng) ? initial : COTUI_GO_CENTER;
 const safeSecondary:Point|null = secondary && Number.isFinite(secondary.lat) && Number.isFinite(secondary.lng) ? secondary : null;
 const host=useRef<HTMLDivElement>(null),map=useRef<any>(null),pickupMarker=useRef<any>(null),destinationMarker=useRef<any>(null),onPickRef=useRef(onPick),targetRef=useRef(target),maplibre=useRef<any>(null);
 const [ready,setReady]=useState(false),[style,setStyle]=useState<"dark"|"light">(theme),[locating,setLocating]=useState(false),[locationMessage,setLocationMessage]=useState(""),[mapError,setMapError]=useState("");
 useEffect(()=>{onPickRef.current=onPick;},[onPick]);
 useEffect(()=>{targetRef.current=target;setStyle(theme);},[target,theme]);
 useEffect(()=>{
  let cancelled=false,observer:ResizeObserver|undefined;
  const init=async()=>{
   try{
    const ml=await loadCotuiGoMapLibre();if(cancelled||!host.current)return;maplibre.current=ml;
    const m=new ml.Map({container:host.current,style:COTUI_GO_MAP_STYLES[style],center:[safeInitial.lng,safeInitial.lat],zoom:15,pitch:48,bearing:0,attributionControl:false, maxPitch:65});
    m.addControl(new ml.NavigationControl({visualizePitch:true}),"bottom-right");
    m.addControl(new ml.AttributionControl({compact:true}),"bottom-left");
    m.on("load",()=>{
     if(cancelled)return;
     try{
      const sources=m.getStyle()?.sources||{};
      const vectorSource=Object.keys(sources).find(k=>sources[k]?.type==="vector");
      if(vectorSource&&!m.getLayer("cg-3d-buildings")){
       m.addLayer({id:"cg-3d-buildings",source:vectorSource,"source-layer":"building",type:"fill-extrusion",minzoom:14,paint:{"fill-extrusion-color":"#cbd5d1","fill-extrusion-height":["coalesce",["get","render_height"],["get","height"],8],"fill-extrusion-base":["coalesce",["get","render_min_height"],0],"fill-extrusion-opacity":0.72}});
      }
     }catch(e){console.info("La capa 3D no está disponible en este estilo.",e);}
     setReady(true);
    });
    m.on("click",(event:any)=>onPickRef.current?.({lat:event.lngLat.lat,lng:event.lngLat.lng}));
    map.current=m;observer=new ResizeObserver(()=>m.resize());observer.observe(host.current);
   }catch(error){if(!cancelled)setMapError(error instanceof Error?error.message:"No se pudo iniciar MapLibre.");}
  };
  void init();
  return()=>{cancelled=true;observer?.disconnect();pickupMarker.current?.remove();destinationMarker.current?.remove();map.current?.remove();map.current=null;pickupMarker.current=null;destinationMarker.current=null;};
 },[]);
 useEffect(()=>{
  const m=map.current,ml=maplibre.current;if(!m||!ml||!ready)return;
  const sync=(ref:any,p:Point|null,kind:"pickup"|"destination")=>{
   if(!p){ref.current?.remove();ref.current=null;return;}
   if(!ref.current)ref.current=new ml.Marker({element:pinElement(kind),draggable:targetRef.current===kind,anchor:"bottom"}).addTo(m);
   ref.current.setLngLat([p.lng,p.lat]);ref.current.setDraggable(target===kind);
   ref.current.off?.("dragend");
   ref.current.on("dragend",()=>{const p=ref.current.getLngLat();onPickRef.current?.({lat:p.lat,lng:p.lng});});
  };
  sync(pickupMarker,safeInitial,"pickup");sync(destinationMarker,safeSecondary,"destination");
  if(safeSecondary){const bounds=new ml.LngLatBounds([safeInitial.lng,safeInitial.lat],[safeSecondary.lng,safeSecondary.lat]);m.fitBounds(bounds,{padding:90,maxZoom:16,duration:500});}
  else m.easeTo({center:[safeInitial.lng,safeInitial.lat],duration:350});
 },[ready,safeInitial.lat,safeInitial.lng,safeSecondary?.lat,safeSecondary?.lng,target]);
 useEffect(()=>{const m=map.current;if(!m||!ready)return;const next=COTUI_GO_MAP_STYLES[style];m.setStyle(next);m.once("style.load",()=>{try{const sources=m.getStyle()?.sources||{},vectorSource=Object.keys(sources).find(k=>sources[k]?.type==="vector");if(vectorSource&&!m.getLayer("cg-3d-buildings"))m.addLayer({id:"cg-3d-buildings",source:vectorSource,"source-layer":"building",type:"fill-extrusion",minzoom:14,paint:{"fill-extrusion-color":"#cbd5d1","fill-extrusion-height":["coalesce",["get","render_height"],["get","height"],8],"fill-extrusion-base":["coalesce",["get","render_min_height"],0],"fill-extrusion-opacity":0.72}});}catch{} });},[style]);
 const locate=async()=>{
  if(!window.isSecureContext){setLocationMessage("Abre Cotuí Go mediante HTTPS para usar el GPS.");return;}
  if(!navigator.geolocation){setLocationMessage("Este navegador no ofrece geolocalización. Marca el punto manualmente.");return;}
  setLocating(true);setLocationMessage("");
  try{const pos=await new Promise<GeolocationPosition>((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:true,timeout:12000,maximumAge:60000}));const p={lat:pos.coords.latitude,lng:pos.coords.longitude};map.current?.easeTo({center:[p.lng,p.lat],zoom:17,duration:600});onPickRef.current?.(p);setLocationMessage(pos.coords.accuracy>1000?"Ubicación aproximada. Ajusta el pin si hace falta.":"Ubicación encontrada correctamente.");}
  catch(error:any){setLocationMessage(error?.code===1?"Permiso denegado. Activa la ubicación para tu navegador.":error?.code===3?"El GPS tardó demasiado. Marca el punto manualmente.":"No se pudo obtener la ubicación. Marca el punto manualmente.");}
  finally{setLocating(false);}
 };
 return <div className="relative h-full min-h-[330px] w-full overflow-hidden rounded-none bg-[#e9edf0]">
  <div ref={host} className="absolute inset-0 z-0 cg-maplibre-canvas"/>
  <div className="absolute right-4 top-20 z-[400] flex flex-col gap-2"><button type="button" onClick={()=>setStyle(v=>v==="dark"?"light":"dark")} aria-label="Cambiar estilo del mapa" title="Cambiar estilo del mapa" className="grid h-11 w-11 place-items-center rounded-2xl border border-white bg-white text-slate-700 shadow-lg"><Layers size={18}/></button><button type="button" onClick={locate} disabled={locating} aria-label="Mi ubicación" title="Mi ubicación" className="grid h-11 w-11 place-items-center rounded-2xl border border-white bg-white text-slate-700 shadow-lg disabled:opacity-50"><LocateFixed size={18}/></button></div>
  <div className="absolute left-4 right-4 top-[150px] z-[400] flex flex-col items-start gap-2"><div className="rounded-xl bg-[#14251d]/90 px-3 py-2 text-[10px] font-semibold text-white shadow-lg"><MapPin size={12} className="mr-1 inline text-lime-300"/>{ready?"MapLibre · Mapa vectorial":"Cargando mapa vectorial…"}</div>{(locationMessage||mapError)&&<div role="status" className="max-w-full rounded-xl border border-white/80 bg-white px-3 py-2 text-[11px] font-semibold leading-4 text-slate-800 shadow-lg"><AlertCircle size={13} className="mr-1 inline"/>{locationMessage||mapError}</div>}</div>
  <style jsx global>{".cg-maplibre-canvas{height:100%;width:100%}.cg-map-pin{width:34px;height:42px;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:grid;place-items:center;box-shadow:0 3px 12px #14251d55;font-weight:900}.cg-map-pin span{transform:rotate(45deg)}.cg-map-pin-pickup{background:#a3e635;color:#14251d}.cg-map-pin-destination{background:#2563eb;color:white}.maplibregl-ctrl-group{border-radius:12px!important;overflow:hidden}.maplibregl-ctrl button{width:32px;height:32px}"}</style>
 </div>;
}
