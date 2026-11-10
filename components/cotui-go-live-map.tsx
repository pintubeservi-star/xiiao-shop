"use client";
import {useEffect,useRef,useState} from "react";
import {LocateFixed,Navigation,AlertCircle} from "lucide-react";
import {loadCotuiGoMapLibre} from "@/lib/cotui-go-maplibre";
type Point={lat:number|null;lng:number|null};
type Props={driver?:Point|null;pickup?:Point|null;destination?:Point|null;routeToDestination?:boolean;className?:string};
const center={lat:19.0527,lng:-70.1494};
const mapStyle="https://tiles.openfreemap.org/styles/positron";
export default function CotuiGoLiveMap({driver,pickup,destination,routeToDestination=false,className=""}:Props){
 const host=useRef<HTMLDivElement>(null),map=useRef<any>(null),driverMarker=useRef<any>(null),pickupMarker=useRef<any>(null),destMarker=useRef<any>(null),routeCoords=useRef<number[][]>([]),lastRouteAt=useRef(0),requestId=useRef(0);
 const [nextInstruction,setNextInstruction]=useState(""),[ready,setReady]=useState(false),[mapError,setMapError]=useState("");
 const points=[driver,pickup,destination].filter((p):p is Point=>!!p&&p.lat!=null&&p.lng!=null);
 useEffect(()=>{
  let cancelled=false;
  const setup=async()=>{
   try{
    const ml=await loadCotuiGoMapLibre();if(cancelled||!host.current)return;
    const m=new ml.Map({container:host.current,style:mapStyle,center:[center.lng,center.lat],zoom:14,attributionControl:false,dragRotate:false,touchPitch:false});
    m.addControl(new ml.NavigationControl({showCompass:false}),"bottom-right");
    m.addControl(new ml.AttributionControl({compact:true}),"bottom-left");
    m.on("load",()=>{if(cancelled)return;requestAnimationFrame(()=>m.resize());m.addSource("cg-route",{type:"geojson",data:{type:"Feature",properties:{},geometry:{type:"LineString",coordinates:[]}}});m.addLayer({id:"cg-route-shadow",type:"line",source:"cg-route",layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":"#14251d","line-width":10,"line-opacity":0.18}});m.addLayer({id:"cg-route-line",type:"line",source:"cg-route",layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":"#84cc16","line-width":6,"line-opacity":0.96}});setReady(true);});
    m.on("error",(event:any)=>{if(!cancelled&&event?.error)setMapError("Problema cargando el mapa. Comprueba tu conexión.");});
    const observer=new ResizeObserver(()=>{if(!cancelled)m.resize();});observer.observe(host.current);
    map.current=m;
   }catch(error){if(!cancelled)setMapError(error instanceof Error?error.message:"No se pudo iniciar el mapa.");}
  };
  void setup();
  return()=>{cancelled=true;requestId.current++;if(map.current){map.current.remove();map.current=null;}driverMarker.current=null;pickupMarker.current=null;destMarker.current=null;};
 },[]);
 useEffect(()=>{
  const ml=window.maplibregl,m=map.current;if(!ml||!m||!ready)return;
  const makeElement=(kind:"driver"|"pickup"|"destination")=>{const el=document.createElement("div");el.className="cg-live-map-marker cg-live-"+kind;el.textContent=kind==="driver"?"●":kind==="pickup"?"P":"D";return el;};
  const sync=(ref:any,p:Point|null|undefined,kind:"driver"|"pickup"|"destination")=>{
   if(!p||p.lat==null||p.lng==null){if(ref.current){ref.current.remove();ref.current=null;}return;}
   const ll=[p.lng,p.lat];if(ref.current)ref.current.setLngLat(ll);else ref.current=new ml.Marker({element:makeElement(kind),anchor:"center"}).setLngLat(ll).addTo(m);
  };
  sync(driverMarker,driver,"driver");sync(pickupMarker,pickup,"pickup");sync(destMarker,destination,"destination");
  const routePoints=(routeToDestination?[driver,destination]:[driver,pickup]).filter((p):p is Point=>!!p&&p.lat!=null&&p.lng!=null);
  if(routePoints.length<2){routeCoords.current=[];if(m.getSource("cg-route"))m.getSource("cg-route").setData({type:"Feature",properties:{},geometry:{type:"LineString",coordinates:[]}});setNextInstruction("");}
  else if(Date.now()-lastRouteAt.current>10000){
   lastRouteAt.current=Date.now();const id=++requestId.current;const coords=routePoints.map(p=>p.lng+","+p.lat).join(";");
   fetch("https://router.project-osrm.org/route/v1/driving/"+coords+"?overview=full&geometries=geojson&steps=true")
    .then(r=>r.ok?r.json():null).then(data=>{
     if(id!==requestId.current||!map.current)return;
     const result=data?.routes?.[0];if(!result)return;
     routeCoords.current=result.geometry.coordinates;
     m.getSource("cg-route")?.setData({type:"Feature",properties:{},geometry:result.geometry});
     const step=result.legs?.flatMap((leg:any)=>leg.steps||[]).find((x:any)=>x.distance>15);
     if(step){const type=step.maneuver?.type,mod=step.maneuver?.modifier,street=step.name?" en "+step.name:"";const action=type==="arrive"?"Llegada próxima":type==="depart"?"Continúa":type==="roundabout"?"Entra a la rotonda":mod==="left"?"Gira a la izquierda":mod==="right"?"Gira a la derecha":mod==="slight left"?"Mantente a la izquierda":mod==="slight right"?"Mantente a la derecha":mod==="uturn"?"Haz un retorno":"Continúa recto";setNextInstruction(action+street);}
    }).catch(()=>{if(id!==requestId.current||!map.current)return;const coordsLine:number[][]=routePoints.map(p=>[Number(p.lng),Number(p.lat)]);routeCoords.current=coordsLine;m.getSource("cg-route")?.setData({type:"Feature",properties:{},geometry:{type:"LineString",coordinates:coordsLine}});setNextInstruction("Sigue la ruta marcada");});
  }
  if(points.length>1){const bounds=new ml.LngLatBounds();points.forEach(p=>bounds.extend([p.lng!,p.lat!]));m.fitBounds(bounds,{padding:55,maxZoom:16,duration:450});}
  else if(points.length===1)m.easeTo({center:[points[0].lng,points[0].lat],zoom:15,duration:400});
 },[ready,driver?.lat,driver?.lng,pickup?.lat,pickup?.lng,destination?.lat,destination?.lng,routeToDestination]);
 const centerDriver=()=>{if(driver?.lat!=null&&driver.lng!=null)map.current?.flyTo({center:[driver.lng,driver.lat],zoom:17});else setMapError("La ubicación del conductor todavía no está disponible.");};
 return <div className={"relative h-full min-h-[280px] w-full overflow-hidden rounded-3xl bg-[#e9edf0] "+className}>
  <div ref={host} className="absolute inset-0"/>
  <style jsx global>{".cg-live-map-marker{width:36px;height:36px;border:3px solid white;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:950;box-shadow:0 5px 18px #10251d55}.cg-live-driver{background:#a3e635;color:#14251d;width:42px;height:42px}.cg-live-pickup{background:#14251d;color:white}.cg-live-destination{background:#2563eb;color:white}.maplibregl-ctrl-group{border:0!important;border-radius:12px!important;overflow:hidden;box-shadow:0 3px 14px #10251d22!important}.maplibregl-ctrl button{width:34px!important;height:34px!important}.maplibregl-ctrl-attrib{font-size:9px!important;opacity:.78}"}</style>
  <div className="pointer-events-none absolute left-3 top-3 z-[400] rounded-xl border border-white/80 bg-white/95 px-3 py-2 text-xs font-extrabold text-slate-800 shadow"><Navigation size={13} className="mr-1 inline text-lime-700"/> Cotuí Go · Mapa en vivo</div>
  <button type="button" onClick={centerDriver} aria-label="Centrar conductor" title="Centrar conductor" className="absolute right-3 top-3 z-[500] grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-800 shadow"><LocateFixed size={17}/></button>
  {nextInstruction&&<div className="pointer-events-none absolute bottom-3 left-3 z-[400] max-w-[75%] rounded-xl border border-white bg-white/95 px-3 py-2 text-[11px] font-extrabold text-slate-800 shadow-lg">Siguiente indicación: {nextInstruction}</div>}
  {mapError&&<div role="status" className="absolute bottom-3 right-3 z-[500] max-w-[70%] rounded-xl bg-white/95 p-2 text-[10px] font-semibold text-slate-700 shadow"><AlertCircle size={12} className="mr-1 inline"/>{mapError}</div>}
  {!ready&&!mapError&&<div className="absolute bottom-3 left-3 z-[400] rounded-lg bg-white/90 px-3 py-2 text-[10px] font-bold text-slate-600">Cargando mapa vectorial…</div>}
 </div>;
}
