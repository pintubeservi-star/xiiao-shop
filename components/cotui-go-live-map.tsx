"use client";
import {useEffect,useRef,useState} from "react";
import {LocateFixed,Navigation,AlertCircle} from "lucide-react";
import {loadCotuiGoMapLibre,COTUI_GO_MAP_STYLES,COTUI_GO_CENTER} from "@/lib/cotui-go-maplibre";
type Point={lat:number|null;lng:number|null};
type Props={driver?:Point|null;pickup?:Point|null;destination?:Point|null;routeToDestination?:boolean;className?:string};
function markerElement(kind:"driver"|"pickup"|"destination"){
 const el=document.createElement("div");el.className="cg-live-marker cg-live-marker-"+kind;
 el.innerHTML=kind==="driver"?"<span>🛵</span>":kind==="pickup"?"<b>P</b>":"<b>D</b>";
 return el;
}
function bearing(a:Point,b:Point){if(a.lat==null||a.lng==null||b.lat==null||b.lng==null)return 0;const toRad=Math.PI/180;const y=Math.sin((b.lng-a.lng)*toRad)*Math.cos(b.lat*toRad);const x=Math.cos(a.lat*toRad)*Math.sin(b.lat*toRad)-Math.sin(a.lat*toRad)*Math.cos(b.lat*toRad)*Math.cos((b.lng-a.lng)*toRad);return (Math.atan2(y,x)*180/Math.PI+360)%360;}
export default function CotuiGoLiveMap({driver,pickup,destination,routeToDestination=false,className=""}:Props){
 const host=useRef<HTMLDivElement>(null),map=useRef<any>(null),mlRef=useRef<any>(null),driverMarker=useRef<any>(null),pickupMarker=useRef<any>(null),destMarker=useRef<any>(null),lastDriver=useRef<Point|null>(null),lastRouteAt=useRef(0),requestId=useRef(0);
 const [nextInstruction,setNextInstruction]=useState(""),[ready,setReady]=useState(false),[mapError,setMapError]=useState("");
 const points=[driver,pickup,destination].filter((p):p is Point=>!!p&&p.lat!=null&&p.lng!=null);
 useEffect(()=>{
  let cancelled=false,observer:ResizeObserver|undefined;
  const setup=async()=>{
   try{
    const ml=await loadCotuiGoMapLibre();if(cancelled||!host.current)return;mlRef.current=ml;
    const m=new ml.Map({container:host.current,style:COTUI_GO_MAP_STYLES.light,center:[COTUI_GO_CENTER.lng,COTUI_GO_CENTER.lat],zoom:14,pitch:42,attributionControl:false,maxPitch:65});
    m.addControl(new ml.NavigationControl({visualizePitch:true}),"bottom-right");m.addControl(new ml.AttributionControl({compact:true}),"bottom-left");
    m.on("load",()=>{if(!cancelled)setReady(true);});
    map.current=m;observer=new ResizeObserver(()=>m.resize());observer.observe(host.current);
   }catch(error){if(!cancelled)setMapError(error instanceof Error?error.message:"No se pudo iniciar MapLibre.");}
  };
  void setup();
  return()=>{cancelled=true;observer?.disconnect();requestId.current++;driverMarker.current?.remove();pickupMarker.current?.remove();destMarker.current?.remove();map.current?.remove();map.current=null;driverMarker.current=null;pickupMarker.current=null;destMarker.current=null;};
 },[]);
 useEffect(()=>{
  const ml=mlRef.current,m=map.current;if(!ml||!m||!ready)return;
  const sync=(ref:any,p:Point|null|undefined,kind:"driver"|"pickup"|"destination")=>{
   if(!p||p.lat==null||p.lng==null){ref.current?.remove();ref.current=null;return;}
   if(!ref.current)ref.current=new ml.Marker({element:markerElement(kind),anchor:"center"}).addTo(m);
   ref.current.setLngLat([p.lng,p.lat]);
  };
  sync(driverMarker,driver,"driver");sync(pickupMarker,pickup,"pickup");sync(destMarker,destination,"destination");
  if(driver&&driver.lat!=null&&driver.lng!=null){
   const previous=lastDriver.current;if(previous&&previous.lat!=null&&previous.lng!=null){const angle=bearing(previous,driver);const el=driverMarker.current?.getElement()?.querySelector("span");if(el)el.style.transform="rotate("+angle+"deg)";}
   lastDriver.current=driver;
  }
  const routePoints=(routeToDestination?[driver,destination]:[driver,pickup]).filter((p):p is Point=>!!p&&p.lat!=null&&p.lng!=null);
  const drawFallback=()=>{if(routePoints.length<2)return;const coords=routePoints.map(p=>[p.lng,p.lat]);const feature={type:"Feature",properties:{},geometry:{type:"LineString",coordinates:coords}};const source=m.getSource("cg-live-route");if(source)source.setData(feature);else{m.addSource("cg-live-route",{type:"geojson",data:feature});m.addLayer({id:"cg-live-route-line",type:"line",source:"cg-live-route",layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":"#84cc16","line-width":5,"line-opacity":0.9}});}setNextInstruction("Ruta directa provisional");};
  if(routePoints.length<2){if(m.getLayer("cg-live-route-line"))m.removeLayer("cg-live-route-line");if(m.getSource("cg-live-route"))m.removeSource("cg-live-route");setNextInstruction("");}
  else if(Date.now()-lastRouteAt.current>10000){
   lastRouteAt.current=Date.now();const id=++requestId.current;const coords=routePoints.map(p=>p.lng+","+p.lat).join(";");
   fetch("https://router.project-osrm.org/route/v1/driving/"+coords+"?overview=full&geometries=geojson&steps=true")
    .then(r=>r.ok?r.json():null).then(data=>{
     if(id!==requestId.current||!map.current)return;const result=data?.routes?.[0];if(!result){drawFallback();return;}
     const feature={type:"Feature",properties:{},geometry:result.geometry};const source=m.getSource("cg-live-route");if(source)source.setData(feature);else{m.addSource("cg-live-route",{type:"geojson",data:feature});m.addLayer({id:"cg-live-route-line",type:"line",source:"cg-live-route",layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":"#84cc16","line-width":5,"line-opacity":0.95}});}
     const step=result.legs?.flatMap((leg:any)=>leg.steps||[]).find((x:any)=>x.distance>15);if(step){const type=step.maneuver?.type,mod=step.maneuver?.modifier,street=step.name?" en "+step.name:"";const action=type==="arrive"?"Llegada próxima":type==="depart"?"Continúa":type==="roundabout"?"Entra a la rotonda":mod==="left"?"Gira a la izquierda":mod==="right"?"Gira a la derecha":mod==="slight left"?"Mantente a la izquierda":mod==="slight right"?"Mantente a la derecha":mod==="uturn"?"Haz un retorno":"Continúa recto";setNextInstruction(action+street);}
    }).catch(()=>{if(id===requestId.current&&map.current)drawFallback();});
  }
  if(points.length>1){const bounds=new ml.LngLatBounds();points.forEach(p=>bounds.extend([p.lng!,p.lat!]));m.fitBounds(bounds,{padding:65,maxZoom:16,duration:350});}else if(points.length===1)m.easeTo({center:[points[0].lng!,points[0].lat!],zoom:15,duration:300});
 },[ready,driver?.lat,driver?.lng,pickup?.lat,pickup?.lng,destination?.lat,destination?.lng,routeToDestination]);
 const centerDriver=()=>{if(driver?.lat!=null&&driver.lng!=null)map.current?.easeTo({center:[driver.lng,driver.lat],zoom:17,duration:500});else setMapError("La ubicación del conductor todavía no está disponible.");};
 return <div className={"relative h-full min-h-[280px] w-full overflow-hidden rounded-3xl bg-[#e9edf0] "+className}>
  <div ref={host} className="absolute inset-0 cg-live-maplibre"/>
  <style jsx global>{".cg-live-maplibre{height:100%;width:100%}.cg-live-marker{width:40px;height:40px;border:3px solid white;border-radius:50%;display:grid;place-items:center;font-size:14px;font-weight:950;box-shadow:0 5px 18px #10251d55}.cg-live-marker-driver{width:48px;height:48px;background:#a3e635;color:#14251d}.cg-live-marker-driver span{display:block;font-size:23px;transform-origin:center}.cg-live-marker-pickup{background:#14251d;color:white}.cg-live-marker-destination{background:#2563eb;color:white}.maplibregl-ctrl-group{border-radius:12px!important;overflow:hidden}.maplibregl-ctrl button{width:32px;height:32px}"}</style>
  <div className="pointer-events-none absolute left-3 top-3 z-[400] rounded-xl border border-white/80 bg-white/95 px-3 py-2 text-xs font-extrabold text-slate-800 shadow"><Navigation size={13} className="mr-1 inline text-lime-700"/> Cotuí Go · MapLibre en vivo</div>
  <button type="button" onClick={centerDriver} aria-label="Centrar conductor" title="Centrar conductor" className="absolute right-3 top-3 z-[500] grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-800 shadow"><LocateFixed size={17}/></button>
  {nextInstruction&&<div className="pointer-events-none absolute bottom-3 left-3 z-[400] max-w-[75%] rounded-xl border border-white bg-white/95 px-3 py-2 text-[11px] font-extrabold text-slate-800 shadow-lg">Siguiente indicación: {nextInstruction}</div>}
  {mapError&&<div role="status" className="absolute bottom-3 right-3 z-[500] max-w-[70%] rounded-xl bg-white/95 p-2 text-[10px] font-semibold text-slate-700 shadow"><AlertCircle size={12} className="mr-1 inline"/>{mapError}</div>}
  {!ready&&!mapError&&<div className="absolute bottom-3 left-3 z-[400] rounded-lg bg-white/90 px-3 py-2 text-[10px] font-bold text-slate-600">Cargando mapa vectorial…</div>}
 </div>;
}
