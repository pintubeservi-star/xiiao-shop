"use client";
import {useEffect,useRef,useState} from "react";
import {LocateFixed,Navigation,AlertCircle} from "lucide-react";
import {loadCotuiGoLeaflet} from "@/lib/cotui-go-maplibre";
type Point={lat:number|null;lng:number|null};
type Props={driver?:Point|null;pickup?:Point|null;destination?:Point|null;routeToDestination?:boolean;className?:string};
const center={lat:19.0527,lng:-70.1494};
export default function CotuiGoLiveMap({driver,pickup,destination,routeToDestination=false,className=""}:Props){
 const host=useRef<HTMLDivElement>(null),map=useRef<any>(null),driverMarker=useRef<any>(null),pickupMarker=useRef<any>(null),destMarker=useRef<any>(null),routeLine=useRef<any>(null),lastRouteAt=useRef(0),requestId=useRef(0);
 const [nextInstruction,setNextInstruction]=useState(""),[ready,setReady]=useState(false),[mapError,setMapError]=useState("");
 const points=[driver,pickup,destination].filter((p):p is Point=>!!p&&p.lat!=null&&p.lng!=null);
 useEffect(()=>{
  let cancelled=false,observer:ResizeObserver|undefined;
  const setup=async()=>{
   try{
    const L=await loadCotuiGoLeaflet();if(cancelled||!host.current)return;
    const m=L.map(host.current,{zoomControl:false,attributionControl:false,preferCanvas:true}).setView([center.lat,center.lng],14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap contributors",crossOrigin:true}).addTo(m);
    L.control.zoom({position:"bottomright"}).addTo(m);L.control.attribution({position:"bottomleft",prefix:false}).addTo(m);
    map.current=m;setReady(true);observer=new ResizeObserver(()=>m.invalidateSize({pan:false}));observer.observe(host.current);
    window.setTimeout(()=>{if(!cancelled)m.invalidateSize({pan:false});},250);
   }catch(error){if(!cancelled)setMapError(error instanceof Error?error.message:"No se pudo iniciar el mapa.");}
  };
  void setup();
  return()=>{cancelled=true;observer?.disconnect();requestId.current++;if(map.current){map.current.remove();map.current=null;}driverMarker.current=null;pickupMarker.current=null;destMarker.current=null;routeLine.current=null;};
 },[]);
 useEffect(()=>{
  const L=window.L,m=map.current;if(!L||!m||!ready)return;
  const makeIcon=(kind:"driver"|"pickup"|"destination")=>L.divIcon({className:"cg-live-pin-wrap",html:'<span class="cg-live-pin cg-live-'+kind+'">'+(kind==="driver"?"●":kind==="pickup"?"P":"D")+"</span>",iconSize:[42,42],iconAnchor:[21,21]});
  const sync=(ref:any,p:Point|null|undefined,kind:"driver"|"pickup"|"destination")=>{
   if(!p||p.lat==null||p.lng==null){if(ref.current){m.removeLayer(ref.current);ref.current=null;}return;}
   const ll=[p.lat,p.lng];if(ref.current)ref.current.setLatLng(ll);else ref.current=L.marker(ll,{icon:makeIcon(kind),keyboard:false}).addTo(m);
  };
  sync(driverMarker,driver,"driver");sync(pickupMarker,pickup,"pickup");sync(destMarker,destination,"destination");
  const routePoints=(routeToDestination?[driver,destination]:[driver,pickup]).filter((p):p is Point=>!!p&&p.lat!=null&&p.lng!=null);
  if(routePoints.length<2){if(routeLine.current){m.removeLayer(routeLine.current);routeLine.current=null;}setNextInstruction("");}
  else if(Date.now()-lastRouteAt.current>10000){
   lastRouteAt.current=Date.now();const id=++requestId.current;const coords=routePoints.map(p=>p.lng+","+p.lat).join(";");
   fetch("https://router.project-osrm.org/route/v1/driving/"+coords+"?overview=full&geometries=geojson&steps=true")
    .then(r=>r.ok?r.json():null).then(data=>{
     if(id!==requestId.current||!map.current)return;
     const result=data?.routes?.[0];if(!result)return;
     const latlngs=result.geometry.coordinates.map((c:number[])=>[c[1],c[0]]);
     if(routeLine.current)routeLine.current.setLatLngs(latlngs);else routeLine.current=L.polyline(latlngs,{color:"#84cc16",weight:6,opacity:.96,lineCap:"round",lineJoin:"round"}).addTo(m);
     const step=result.legs?.flatMap((leg:any)=>leg.steps||[]).find((x:any)=>x.distance>15);
     if(step){const type=step.maneuver?.type,mod=step.maneuver?.modifier,street=step.name?" en "+step.name:"";const action=type==="arrive"?"Llegada próxima":type==="depart"?"Continúa":type==="roundabout"?"Entra a la rotonda":mod==="left"?"Gira a la izquierda":mod==="right"?"Gira a la derecha":mod==="slight left"?"Mantente a la izquierda":mod==="slight right"?"Mantente a la derecha":mod==="uturn"?"Haz un retorno":"Continúa recto";setNextInstruction(action+street);}
    }).catch(()=>{if(id!==requestId.current||!map.current)return;const ll=routePoints.map(p=>[p.lat!,p.lng!]);if(routeLine.current)routeLine.current.setLatLngs(ll);else routeLine.current=L.polyline(ll,{color:"#84cc16",weight:6,opacity:.96}).addTo(m);setNextInstruction("Sigue la ruta marcada");});
  }
  if(points.length>1)m.fitBounds(L.latLngBounds(points.map(p=>[p.lat!,p.lng!])),{padding:[55,55],maxZoom:16});else if(points.length===1)m.setView([points[0].lat!,points[0].lng!],15);
 },[ready,driver?.lat,driver?.lng,pickup?.lat,pickup?.lng,destination?.lat,destination?.lng,routeToDestination]);
 const centerDriver=()=>{if(driver?.lat!=null&&driver.lng!=null)map.current?.setView([driver.lat,driver.lng],17);else setMapError("La ubicación del conductor todavía no está disponible.");};
 return <div className={"relative h-full min-h-[280px] w-full overflow-hidden rounded-3xl bg-[#e9edf0] "+className}>
  <div ref={host} className="absolute inset-0 cg-live-leaflet-map"/>
  <style jsx global>{".cg-live-leaflet-map{height:100%;width:100%;background:#e9edf0}.cg-live-pin-wrap{background:transparent;border:0}.cg-live-pin{width:40px;height:40px;border:3px solid white;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:950;box-shadow:0 5px 18px #10251d55}.cg-live-driver{background:#a3e635;color:#14251d;width:44px;height:44px}.cg-live-pickup{background:#14251d;color:white}.cg-live-destination{background:#2563eb;color:white}.leaflet-control-attribution{font-size:9px!important}.leaflet-control-zoom a{color:#14251d!important}"}</style>
  <div className="pointer-events-none absolute left-3 top-3 z-[400] rounded-xl border border-white/80 bg-white/95 px-3 py-2 text-xs font-extrabold text-slate-800 shadow"><Navigation size={13} className="mr-1 inline text-lime-700"/> Cotuí Go · Mapa en vivo</div>
  <button type="button" onClick={centerDriver} aria-label="Centrar conductor" title="Centrar conductor" className="absolute right-3 top-3 z-[500] grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-800 shadow"><LocateFixed size={17}/></button>
  {nextInstruction&&<div className="pointer-events-none absolute bottom-3 left-3 z-[400] max-w-[75%] rounded-xl border border-white bg-white/95 px-3 py-2 text-[11px] font-extrabold text-slate-800 shadow-lg">Siguiente indicación: {nextInstruction}</div>}
  {mapError&&<div role="status" className="absolute bottom-3 right-3 z-[500] max-w-[70%] rounded-xl bg-white/95 p-2 text-[10px] font-semibold text-slate-700 shadow"><AlertCircle size={12} className="mr-1 inline"/>{mapError}</div>}
  {!ready&&!mapError&&<div className="absolute bottom-3 left-3 z-[400] rounded-lg bg-white/90 px-3 py-2 text-[10px] font-bold text-slate-600">Cargando mapa…</div>}
 </div>;
}
