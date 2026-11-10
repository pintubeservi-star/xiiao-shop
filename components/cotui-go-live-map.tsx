"use client";
import {useEffect,useRef,useState} from "react";
import {LocateFixed,Navigation,AlertCircle} from "lucide-react";
import {loadCotuiGoLeaflet} from "@/lib/cotui-go-leaflet";
type Point={lat:number|null;lng:number|null};
type Props={driver?:Point|null;pickup?:Point|null;destination?:Point|null;routeToDestination?:boolean;className?:string};
const center={lat:19.0527,lng:-70.1494};
const CARTO_KEY="cb1_564_1_cbce9929de4935e1d11868dd";

export default function CotuiGoLiveMap({driver,pickup,destination,routeToDestination=false,className=""}:Props){
 const host=useRef<HTMLDivElement>(null),map=useRef<any>(null),driverMarker=useRef<any>(null),pickupMarker=useRef<any>(null),destMarker=useRef<any>(null),route=useRef<any>(null),lastRouteAt=useRef(0);
 const [nextInstruction,setNextInstruction]=useState(""),[ready,setReady]=useState(false),[mapError,setMapError]=useState("");
 const points=[driver,pickup,destination].filter((p):p is Point=>!!p&&p.lat!=null&&p.lng!=null);

 useEffect(()=>{
  let cancelled=false;
  const setup=async()=>{
   try{
    const L=await loadCotuiGoLeaflet();
    if(cancelled||!host.current)return;
    const m=L.map(host.current,{zoomControl:false,scrollWheelZoom:true}).setView([center.lat,center.lng],14);
    const tiles=L.tileLayer("https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key="+CARTO_KEY,{maxZoom:20,attribution:'&copy; OpenStreetMap contributors &copy; CARTO'});
    let fallback=false;
    tiles.on("tileerror",()=>{
     if(fallback||cancelled)return;
     fallback=true;
     L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(m);
     setMapError("Mapa alternativo activo por un problema del proveedor principal.");
    });
    tiles.addTo(m);
    L.control.zoom({position:"bottomright"}).addTo(m);
    map.current=m;setReady(true);
    window.setTimeout(()=>{if(!cancelled)m.invalidateSize();},180);
   }catch(error){if(!cancelled)setMapError(error instanceof Error?error.message:"No se pudo iniciar el mapa.");}
  };
  void setup();
  return()=>{cancelled=true;if(map.current){map.current.remove();map.current=null;}driverMarker.current=null;pickupMarker.current=null;destMarker.current=null;route.current=null;};
 },[]);

 useEffect(()=>{
  const L=window.L,m=map.current;if(!L||!m)return;
  const icon=(color:string,letter:string)=>L.divIcon({className:"cg-live-pin",html:'<div style="width:38px;height:38px;border:3px solid white;border-radius:50%;background:'+color+';display:grid;place-items:center;box-shadow:0 5px 16px #10251d44;color:#14251d;font-size:13px;font-weight:900">'+letter+'</div>',iconSize:[38,38],iconAnchor:[19,19]});
  const sync=(ref:any,p:Point|null|undefined,color:string,letter:string,label:string,z=0)=>{
   if(!p||p.lat==null||p.lng==null){if(ref.current){m.removeLayer(ref.current);ref.current=null;}return;}
   const ll=[p.lat,p.lng];if(ref.current)ref.current.setLatLng(ll);else ref.current=L.marker(ll,{icon:icon(color,letter),zIndexOffset:z}).addTo(m).bindTooltip(label);
  };
  sync(driverMarker,driver,"#a3e635","●","Conductor",1000);sync(pickupMarker,pickup,"#ffffff","P","Recogida");sync(destMarker,destination,"#bfdbfe","D","Destino");
  const routePoints=(routeToDestination?[driver,destination]:[driver,pickup]).filter((p):p is Point=>!!p&&p.lat!=null&&p.lng!=null);
  if(routePoints.length<2){if(route.current){m.removeLayer(route.current);route.current=null;}setNextInstruction("");}
  else if(Date.now()-lastRouteAt.current>12000){
   lastRouteAt.current=Date.now();
   const coords=routePoints.map(p=>p.lng+","+p.lat).join(";");
   fetch("https://router.project-osrm.org/route/v1/driving/"+coords+"?overview=full&geometries=geojson&steps=true")
    .then(r=>r.ok?r.json():null)
    .then(data=>{
     if(!data?.routes?.[0]||!map.current)return;
     const result=data.routes[0],latlngs=result.geometry.coordinates.map((p:number[])=>[p[1],p[0]]);
     if(route.current)route.current.setLatLngs(latlngs);else route.current=L.polyline(latlngs,{color:"#65a30d",weight:6,opacity:.9,lineCap:"round",lineJoin:"round"}).addTo(m);
     const step=result.legs?.flatMap((leg:any)=>leg.steps||[]).find((x:any)=>x.distance>15);
     if(step){const type=step.maneuver?.type,mod=step.maneuver?.modifier,street=step.name?" en "+step.name:"";const action=type==="arrive"?"Llegada próxima":type==="depart"?"Continúa":type==="roundabout"?"Entra a la rotonda":mod==="left"?"Gira a la izquierda":mod==="right"?"Gira a la derecha":mod==="slight left"?"Mantente a la izquierda":mod==="slight right"?"Mantente a la derecha":mod==="uturn"?"Haz un retorno":"Continúa recto";setNextInstruction(action+street);}
    })
    .catch(()=>{
     if(!map.current)return;
     const latlngs=routePoints.map(p=>[p.lat,p.lng]);
     if(route.current)route.current.setLatLngs(latlngs);else route.current=L.polyline(latlngs,{color:"#65a30d",weight:5,opacity:.8,dashArray:"8 8"}).addTo(m);
     setNextInstruction("Sigue la ruta marcada");
    });
  }
  if(points.length>1)m.fitBounds(L.latLngBounds(points.map(p=>[p.lat,p.lng])).pad(.22),{maxZoom:16});
  else if(points.length===1)m.setView([points[0].lat,points[0].lng],15);
 },[ready,driver?.lat,driver?.lng,pickup?.lat,pickup?.lng,destination?.lat,destination?.lng,routeToDestination]);

 const centerDriver=()=>{if(driver?.lat!=null&&driver.lng!=null)map.current?.setView([driver.lat,driver.lng],17);else setMapError("La ubicación del conductor todavía no está disponible.");};
 return <div className={"relative h-full min-h-[280px] w-full overflow-hidden rounded-3xl bg-[#edf2eb] "+className}>
  <div ref={host} className="absolute inset-0"/>
  <div className="pointer-events-none absolute left-3 top-3 z-[400] rounded-xl border border-white/80 bg-white/95 px-3 py-2 text-xs font-extrabold text-slate-800 shadow"><Navigation size={13} className="mr-1 inline text-lime-700"/> Cotuí Go · Mapa en vivo</div>
  <button type="button" onClick={centerDriver} aria-label="Centrar conductor" title="Centrar conductor" className="absolute right-3 top-3 z-[500] grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-800 shadow"><LocateFixed size={17}/></button>
  {nextInstruction&&<div className="pointer-events-none absolute bottom-3 left-3 z-[400] max-w-[75%] rounded-xl border border-white bg-white/95 px-3 py-2 text-[11px] font-extrabold text-slate-800 shadow-lg">Siguiente indicación: {nextInstruction}</div>}
  {mapError&&<div role="status" className="absolute bottom-3 right-3 z-[500] max-w-[70%] rounded-xl bg-white/95 p-2 text-[10px] font-semibold text-slate-700 shadow"><AlertCircle size={12} className="mr-1 inline"/>{mapError}</div>}
  {!ready&&!mapError&&<div className="absolute bottom-3 left-3 z-[400] rounded-lg bg-white/90 px-3 py-2 text-[10px] font-bold text-slate-600">Cargando mapa…</div>}
 </div>;
}
