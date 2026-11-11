"use client";
import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
import {getSupabase} from "@/lib/supabase/client";
import CotuiGoDriverLiveMap from "@/components/cg-driver-live-location-map";
import DriverDocumentsForm from "@/components/cg-driver-documents-form";
import DriverWallet from "@/components/cg-driver-wallet";
import DriverDispatch from "@/components/cg-driver-dispatch";
import {Bike,Package,Power,RefreshCw,LogOut,MapPin,Clock3,ShieldCheck,CheckCircle2,Navigation,UserRound,ClipboardList} from "lucide-react";

type Profile={id:string;user_id:string;full_name:string;phone:string;status:string;is_available:boolean;current_lat?:number|null;current_lng?:number|null};
type Job={id:string;cancellation_fee_dop?:number|null;agreed_fare_dop?:number|null;agreed_fee_dop?:number|null;estimated_fare_dop?:number|null;estimated_fee_dop?:number|null;platform_commission_dop?:number|null;driver_payout_dop?:number|null;distance_km?:number|null;commission_rate_pct?:number|null;tracking_token?:string;customer_name?:string;customer_phone?:string;pickup_address:string;pickup_lat?:number|null;pickup_lng?:number|null;destination_lat?:number|null;destination_lng?:number|null;destination_address?:string;sender_name?:string;sender_phone?:string;recipient_name?:string;recipient_phone?:string;delivery_address?:string;package_type?:string;tracking_code?:string;status:string;created_at:string};
const field="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-lime-500 focus:ring-4 focus:ring-lime-100";
const label="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500";
const driverNet=(j:Job)=>{if(j.driver_payout_dop!=null)return Number(j.driver_payout_dop);const gross=Number(j.agreed_fare_dop??j.agreed_fee_dop??j.estimated_fare_dop??j.estimated_fee_dop??0);const commission=Number(j.platform_commission_dop??(gross*Number(j.commission_rate_pct??15)/100));return Math.max(0,gross-commission);};
export default function DriverPortal(){
 const [mode,setMode]=useState<"login"|"signup">("login"),[user,setUser]=useState<any>(null),[profile,setProfile]=useState<Profile|null>(null);
 const [phoneMode,setPhoneMode]=useState(false),[otpSent,setOtpSent]=useState(false),[otp,setOtp]=useState("");
 const [rides,setRides]=useState<Job[]>([]),[deliveries,setDeliveries]=useState<Job[]>([]),[tab,setTab]=useState<"available"|"mine"|"wallet">("available"),[walletBalance,setWalletBalance]=useState(0);
 const [form,setForm]=useState({name:"",phone:"",email:"",password:"",brand:"",model:"",color:"",plate:"",nationalId:"",insuranceExpiry:""});
 const [notice,setNotice]=useState(""),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[cancelOpenId,setCancelOpenId]=useState(""),[cancelReason,setCancelReason]=useState("Cliente no responde"),[pinInputs,setPinInputs]=useState<Record<string,string>>({});
 const loadJobs=useCallback(async(p:Profile)=>{const s=getSupabase();const [r,d,w]=await Promise.all([
  s.from("cg_ride_requests").select("*").or("status.eq.requested,driver_id.eq."+p.id).order("created_at",{ascending:false}).limit(80),
  s.from("cg_delivery_requests").select("*").or("status.eq.requested,courier_id.eq."+p.id).order("created_at",{ascending:false}).limit(80),
  s.from("cg_driver_wallets").select("available_balance_dop,reserved_balance_dop").eq("driver_id",p.id).maybeSingle()
 ]);if(r.error)throw r.error;if(d.error)throw d.error;if(w.error)throw w.error;setRides(r.data||[]);setDeliveries(d.data||[]);setWalletBalance(Number(w.data?.available_balance_dop??0));},[]);
 const ensureProfile=useCallback(async(u:any)=>{const s=getSupabase();let {data,error}=await s.from("cg_driver_profiles").select("*").eq("user_id",u.id).maybeSingle();if(error)throw error;
  if(!data){const m=u.user_metadata||{};if(!m.full_name||!m.phone)throw new Error("No encontramos tu solicitud de conductor. Regístrate primero.");const ins=await s.from("cg_driver_profiles").insert({user_id:u.id,full_name:m.full_name,phone:m.phone,status:"pending",is_available:false}).select("*").single();if(ins.error)throw ins.error;data=ins.data;
   const v=await s.from("cg_vehicles").insert({driver_id:data.id,vehicle_type:"moto",brand:m.vehicle_brand||null,model:m.vehicle_model||null,color:m.vehicle_color||null,plate:m.vehicle_plate||null,seats:1,is_active:false});if(v.error)throw v.error;
  }
  setProfile(data);if(data.status==="approved")await loadJobs(data);else{setRides([]);setDeliveries([]);}return data;
 },[loadJobs]);
 const refresh=useCallback(async()=>{const s=getSupabase();const {data:{user:u}}=await s.auth.getUser();if(!u){setUser(null);setProfile(null);setLoading(false);return;}setUser(u);try{await ensureProfile(u);}catch(e){setNotice(e instanceof Error?e.message:"No se pudo cargar el portal.");}finally{setLoading(false);}},[ensureProfile]);
 useEffect(()=>{refresh();},[refresh]);
 useEffect(()=>{if(!profile||profile.status!=="approved")return;const driver={id:profile.id} as Profile;const timer=window.setInterval(()=>{if(document.visibilityState==="visible")void loadJobs(driver).catch(e=>setNotice(e instanceof Error?e.message:"No se pudieron actualizar tus servicios."));},5000);return()=>window.clearInterval(timer);},[profile?.id,profile?.status,loadJobs]);
 async function sendDriverOtp(e:React.FormEvent){e.preventDefault();setBusy(true);setNotice("");try{const digits=form.phone.replace(/\D/g,"");const phone=digits.startsWith("1")&&digits.length===11?"+"+digits:digits.length===10?"+1"+digits:form.phone.startsWith("+")?form.phone:"+"+digits;if(!/^\+1\d{10}$/.test(phone))throw new Error("Introduce un número dominicano válido con 10 dígitos.");const {error}=await getSupabase().auth.signInWithOtp({phone,options:{shouldCreateUser:false}});if(error)throw error;setForm(v=>({...v,phone}));setOtpSent(true);setNotice("Código enviado por SMS. Verifica tu número para entrar al portal.");}catch(e){setNotice(e instanceof Error?e.message:"No se pudo enviar el código.");}finally{setBusy(false)}}
 async function verifyDriverOtp(e:React.FormEvent){e.preventDefault();setBusy(true);setNotice("");try{const {error}=await getSupabase().auth.verifyOtp({phone:form.phone,token:otp.trim(),type:"sms"});if(error)throw error;await refresh();}catch(e){setNotice(e instanceof Error?e.message:"Código incorrecto o vencido.");}finally{setBusy(false);setLoading(false)}}
 async function submitAuth(e:React.FormEvent){e.preventDefault();setBusy(true);setNotice("");try{const s=getSupabase();if(mode==="signup"){const {data,error}=await s.auth.signUp({email:form.email,password:form.password,options:{data:{full_name:form.name,phone:form.phone,vehicle_brand:form.brand,vehicle_model:form.model,vehicle_color:form.color,vehicle_plate:form.plate,national_id:form.nationalId,insurance_expiry:form.insuranceExpiry}}});if(error)throw error;if(data.session&&data.user){setUser(data.user);const p=await ensureProfile(data.user);setNotice(p.status==="approved"?"Registro completado. Ya puedes conectarte.":"Solicitud recibida. Tu cuenta está pendiente de aprobación.");}else setNotice("Registro iniciado. Confirma tu correo y luego inicia sesión para completar tu perfil.");}else{const {data,error}=await s.auth.signInWithPassword({email:form.email,password:form.password});if(error)throw error;if(data.user){setUser(data.user);const p=await ensureProfile(data.user);setNotice(p.status==="approved"?"Bienvenido.":"Tu solicitud está pendiente de aprobación.");}}}catch(e){setNotice(e instanceof Error?e.message:"No se pudo completar el acceso.");}finally{setBusy(false);setLoading(false);}}
 async function logout(){await getSupabase().auth.signOut();setUser(null);setProfile(null);setRides([]);setDeliveries([]);setMode("login");}
 async function availability(){if(!profile)return;setBusy(true);setNotice("");try{let coords:any={};if(!profile.is_available&&navigator.geolocation){coords=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(p=>resolve({current_lat:p.coords.latitude,current_lng:p.coords.longitude,last_location_at:new Date().toISOString()}),()=>resolve({}),{enableHighAccuracy:true,timeout:9000}));}const next=!profile.is_available;const {data,error}=await getSupabase().from("cg_driver_profiles").update({is_available:next,...coords,updated_at:new Date().toISOString()}).eq("id",profile.id).select("*").single();if(error)throw error;setProfile(data);setNotice(next?"Ahora apareces disponible para recibir servicios.":"Te has desconectado.");}catch(e){setNotice(e instanceof Error?e.message:"No se pudo cambiar tu disponibilidad.");}finally{setBusy(false);}}
 async function accept(kind:"ride"|"delivery",id:string){if(walletBalance<100){setTab("wallet");setNotice("Tu billetera tiene RD$ "+walletBalance.toFixed(2)+". Recarga RD$ "+(100-walletBalance).toFixed(2)+" para alcanzar el mínimo de RD$100 y aceptar servicios.");return;}setBusy(true);setNotice("");try{const {data,error}=await getSupabase().rpc(kind==="ride"?"cg_driver_accept_ride":"cg_driver_accept_delivery",kind==="ride"?{p_ride_id:id}:{p_delivery_id:id});if(error)throw error;if(!data||data.status!=="accepted")throw new Error("El servidor no confirmó la asignación. Actualiza las ofertas e inténtalo de nuevo.");if(profile)await loadJobs(profile);setTab("mine");setNotice("Servicio asignado correctamente. Revisa la ruta y los datos del cliente.");}catch(e){setNotice(e instanceof Error?e.message:"No se pudo aceptar el servicio.");}finally{setBusy(false);}}
 async function cancelService(kind:"ride"|"delivery",job:Job){setBusy(true);setNotice("");try{const {data,error}=await getSupabase().rpc("cg_driver_cancel_service",{p_service_type:kind,p_service_id:job.id,p_reason:cancelReason});if(error)throw error;if(!data||data.status!=="cancelled")throw new Error("No se pudo confirmar la cancelación.");setCancelOpenId("");await refresh();setNotice("Servicio cancelado. La comisión reservada fue liberada de tu billetera.");}catch(e){setNotice(e instanceof Error?e.message:"No se pudo cancelar el servicio.");}finally{setBusy(false)}}
 async function advance(kind:"ride"|"delivery",job:Job,pin?:string){const sequence=kind==="ride"?["accepted","driver_arriving","in_progress","completed"]:["accepted","picked_up","on_the_way","delivered"];const next=sequence[sequence.indexOf(job.status)+1];if(!next)return;if((next==="completed"||next==="delivered")&&Number(job.cancellation_fee_dop||0)>0&&!window.confirm("Antes de finalizar, confirma que recibiste en efectivo los RD$"+Number(job.cancellation_fee_dop||0).toFixed(0)+" del cargo por cancelación anterior, además del precio del servicio."))return;if(kind==="ride"&&next==="in_progress"&&(!pin||!/^[0-9]{4}$/.test(pin))){setNotice("Introduce los 4 dígitos del PIN del pasajero.");return;}setBusy(true);try{if(kind==="ride"&&next==="in_progress"){const {data,error}=await getSupabase().rpc("cg_driver_start_ride",{p_ride_id:job.id,p_pin:pin||""});if(error)throw error;if(data!==true)throw new Error("PIN incorrecto o bloqueado. Verifica el código con el pasajero.");}else{const {error}=await getSupabase().rpc(kind==="ride"?"cg_driver_update_ride_status":"cg_driver_update_delivery_status",kind==="ride"?{p_ride_id:job.id,p_status:next}:{p_delivery_id:job.id,p_status:next});if(error)throw error;}await refresh();setPinInputs(v=>({...v,[job.id]:""}));setNotice(next==="in_progress"?"PIN verificado. El viaje ha comenzado.":next==="completed"?"Viaje finalizado correctamente.":"Estado del servicio actualizado.");}catch(e){setNotice(e instanceof Error?e.message:"No se pudo actualizar.");}finally{setBusy(false);}}
 const hasActiveService=rides.some(j=>["accepted","driver_arriving","in_progress"].includes(j.status))||deliveries.some(j=>["accepted","picked_up","on_the_way"].includes(j.status));
 const availableRides=rides.filter(j=>!hasActiveService&&j.status==="requested"&&driverNet(j)>0),availableDeliveries=deliveries.filter(j=>!hasActiveService&&j.status==="requested"&&driverNet(j)>0);
 useEffect(()=>{
  if(!profile||profile.status!=="approved"||!hasActiveService||!navigator.geolocation)return;
  let lastSent=0;
  const watch=navigator.geolocation.watchPosition(async pos=>{
   const now=Date.now();if(now-lastSent<4500)return;lastSent=now;
   const coords={current_lat:pos.coords.latitude,current_lng:pos.coords.longitude,last_location_at:new Date().toISOString()};
   const {error}=await getSupabase().from("cg_driver_profiles").update(coords).eq("id",profile.id);
   if(error)console.warn("No se pudo actualizar la ubicación del conductor.",error.message);
  },err=>setNotice("Activa el permiso de ubicación para compartir el recorrido con el cliente."),{enableHighAccuracy:true,maximumAge:3000,timeout:15000});
  return()=>navigator.geolocation.clearWatch(watch);
 },[profile?.id,profile?.status,hasActiveService]);

 const mineRides=rides.filter(j=>j.status!=="requested"&&j.status!=="completed"&&j.status!=="cancelled"),mineDeliveries=deliveries.filter(j=>j.status!=="requested"&&j.status!=="delivered"&&j.status!=="cancelled");
 const activeMapJob=mineRides[0]||mineDeliveries[0]||null;
 const activeMapToDestination=!!activeMapJob&&(activeMapJob.status==="in_progress"||activeMapJob.status==="on_the_way");
 const statusLabel:Record<string,string>={accepted:"Aceptado",driver_arriving:"En camino a recogida",in_progress:"Viaje en curso",completed:"Completado",picked_up:"Paquete recogido",on_the_way:"En camino",delivered:"Entregado"};
 function JobCard({job,kind,open}:{job:Job;kind:"ride"|"delivery";open:boolean}){
  const title=kind==="ride"?(job.customer_name||"Viaje en moto"):(job.sender_name+" → "+job.recipient_name);
  const sequence=kind==="ride"?["accepted","driver_arriving","in_progress","completed"]:["accepted","picked_up","on_the_way","delivered"];
  const next=sequence[sequence.indexOf(job.status)+1];
  const canCancel=!open&&(kind==="ride"?["accepted","driver_arriving"].includes(job.status):job.status==="accepted");
  const active=job.status==="in_progress"||job.status==="on_the_way";
  const destination=active?(job.destination_lat!=null&&job.destination_lng!=null?job.destination_lat+","+job.destination_lng:(kind==="ride"?job.destination_address||"":job.delivery_address||"")):(job.pickup_lat!=null&&job.pickup_lng!=null?job.pickup_lat+","+job.pickup_lng:job.pickup_address);
  return (
   <article className={open?"relative overflow-hidden rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_12px_35px_rgba(15,35,25,.10)] sm:p-5":"rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"}>
    <div className="flex items-start justify-between gap-3">
     <div className="flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-lime-50 text-lime-800">{kind==="ride"?<Bike size={18}/>:<Package size={18}/>}</span>
      <div><b className="text-sm">{title}</b><p className="text-[11px] text-slate-500">{kind==="ride"?"Solicitud de moto":"Entrega de paquete"}</p></div>
     </div>
     <span className={open?"rounded-full bg-lime-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-lime-900":"rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600"}>{open?"Nueva oferta":statusLabel[job.status]||"Disponible"}</span>
    </div>
    <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-[#f5f8f3] p-3">
     <div><p className="text-[9px] font-bold uppercase text-slate-400">Total a cobrar en efectivo</p><b className="text-sm">RD$ {(Number(job.agreed_fare_dop??job.agreed_fee_dop??job.estimated_fare_dop??job.estimated_fee_dop??0)+Number(job.cancellation_fee_dop||0)).toFixed(0)}</b>{Number(job.cancellation_fee_dop||0)>0&&<p className="mt-1 text-[9px] font-bold text-amber-700">Incluye RD$25 por cancelación anterior</p>}</div>
     <div><p className="text-[9px] font-bold uppercase text-slate-400">Tu ganancia</p><b className="text-sm text-emerald-700">RD$ {driverNet(job).toFixed(0)}</b></div>
     <div><p className="text-[9px] font-bold uppercase text-slate-400">Distancia</p><b className="text-sm">{Number(job.distance_km??0).toFixed(1)} km</b></div>
    </div>
    <div className="mt-4 space-y-2 text-xs">
     <p><span className="font-bold text-slate-500">Recogida:</span> {job.pickup_address}</p>
     <p><span className="font-bold text-slate-500">{kind==="ride"?"Destino:":"Entrega:"}</span> {kind==="ride"?job.destination_address:job.delivery_address}</p>
     {kind==="delivery"&&<p><span className="font-bold text-slate-500">Tipo:</span> {job.package_type} · Código {job.tracking_code}</p>}
     <p className="flex items-center gap-1 text-[10px] text-slate-400"><Clock3 size={12}/>{new Date(job.created_at).toLocaleString("es-DO")}</p>
    </div>
    {!open&&!(kind==="ride"&&next==="in_progress")&&(
     <>
      <div className="mt-4 h-40 overflow-hidden rounded-2xl">
       <CotuiGoDriverLiveMap driverId={profile?.id||""} pickup={active?null:{lat:job.pickup_lat??null,lng:job.pickup_lng??null}} destination={{lat:job.destination_lat??null,lng:job.destination_lng??null}} routeToDestination={active}/>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
       <a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&origin=${profile?.current_lat??""},${profile?.current_lng??""}&destination=${encodeURIComponent(destination)}&travelmode=driving`} className="rounded-xl bg-[#14251d] px-3 py-3 text-center text-[11px] font-extrabold text-white">Navegar en Google Maps</a>
       <a target="_blank" rel="noreferrer" href={`https://waze.com/ul?q=${encodeURIComponent(destination)}&navigate=yes`} className="rounded-xl border border-slate-200 px-3 py-3 text-center text-[11px] font-extrabold">Abrir en Waze</a>
      </div>
     </>
    )}
    {open?(
     <div className="mt-4">
      <button disabled={busy||walletBalance<100} onClick={()=>accept(kind,job.id)} className="w-full rounded-full bg-black px-5 py-4 text-sm font-black tracking-wide text-white shadow-lg transition hover:bg-[#14251d] disabled:opacity-40">{walletBalance<100?"RECARGA PARA ACEPTAR":"ACEPTAR SERVICIO"}</button>
      {walletBalance<100&&<p className="mt-2 text-center text-[11px] font-semibold text-amber-700">Necesitas RD$100 disponibles. Tu balance: RD$ {walletBalance.toFixed(2)}.</p>}
     </div>
    ):(
     <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
      <p className="text-[10px] font-semibold text-slate-500">{kind==="ride"?job.customer_phone:job.sender_phone+" · Recibe: "+job.recipient_phone}</p>
      {next&&kind==="ride"&&next==="in_progress"?(
       <div className="mt-3 flex w-full flex-col gap-2 sm:flex-row">
        <input inputMode="numeric" autoComplete="one-time-code" maxLength={4} pattern="[0-9]{4}" value={pinInputs[job.id]||""} onChange={e=>setPinInputs(v=>({...v,[job.id]:e.target.value.replace(/[^0-9]/g,"").slice(0,4)}))} placeholder="PIN de 4 dígitos del pasajero" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-black tracking-[.3em] outline-none focus:border-lime-500"/>
        <button disabled={busy} onClick={()=>advance(kind,job,pinInputs[job.id]||"")} className="rounded-xl bg-lime-400 px-4 py-3 text-xs font-extrabold text-[#14251d] disabled:opacity-50">Verificar PIN e iniciar</button>
       </div>
      ):next?(
       <button disabled={busy} onClick={()=>advance(kind,job)} className="rounded-xl bg-lime-400 px-4 py-2.5 text-xs font-extrabold text-[#14251d] disabled:opacity-50">{next==="driver_arriving"?"Voy a recoger":next==="completed"?"Finalizar":next==="picked_up"?"Marcar recogido":next==="on_the_way"?"En camino":"Confirmar entrega"}</button>
      ):null}
     </div>
    )}
    {canCancel&&(
     <div className="mt-3 border-t border-slate-100 pt-3">
      <button type="button" onClick={()=>{setCancelOpenId(v=>v===job.id?"":job.id);setCancelReason("Cliente no responde");}} className="text-[11px] font-bold text-rose-600">Cancelar servicio</button>
      {cancelOpenId===job.id&&<div className="mt-3 rounded-xl border border-rose-100 bg-rose-50 p-3">
       <p className="text-[10px] font-black uppercase tracking-wide text-rose-800">Motivo de cancelación</p>
       <select value={cancelReason} onChange={e=>setCancelReason(e.target.value)} className="mt-2 w-full rounded-lg border border-rose-200 bg-white p-2.5 text-xs"><option>Cliente no responde</option><option>El cliente solicitó cancelar</option><option>Dirección incorrecta o incompleta</option><option>Problema con mi vehículo</option><option>Emergencia o imprevisto</option></select>
       <div className="mt-2 grid grid-cols-2 gap-2">
        <button type="button" onClick={()=>setCancelOpenId("")} className="rounded-lg border bg-white p-2.5 text-[10px] font-bold">Volver</button>
        <button type="button" disabled={busy} onClick={()=>cancelService(kind,job)} className="rounded-lg bg-rose-600 p-2.5 text-[10px] font-black text-white disabled:opacity-50">{busy?"Cancelando…":"Confirmar cancelación"}</button>
       </div>
      </div>}
     </div>
    )}
   </article>
  );
 }
 if(loading)return <main className="grid min-h-screen place-items-center bg-[#f4f6f3] text-sm font-semibold text-slate-500">Cargando portal de conductores…</main>;
 if(!user||!profile)return <main className="flex min-h-screen items-center justify-center bg-[#f4f6f3] p-4"><section className="w-full max-w-md rounded-[28px] border border-white bg-white p-7 shadow-xl"><Link href="/" className="text-xs font-bold text-slate-400">← Volver a Cotuí Go</Link><div className="mt-6 grid h-12 w-12 place-items-center rounded-2xl bg-lime-400 text-[#14251d]"><Bike size={24}/></div><h1 className="mt-4 text-2xl font-black">Portal de conductores</h1><p className="mt-1 text-sm text-slate-500">Trabaja con Cotuí Go y recibe solicitudes de motos y paquetes.</p><div className="my-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1"><button onClick={()=>setMode("login")} className={mode==="login"?"rounded-lg bg-white py-2 text-xs font-bold shadow":"py-2 text-xs text-slate-500"}>Iniciar sesión</button><button onClick={()=>setMode("signup")} className={mode==="signup"?"rounded-lg bg-white py-2 text-xs font-bold shadow":"py-2 text-xs text-slate-500"}>Registrarme</button></div><form onSubmit={submitAuth} className="space-y-3">{mode==="signup"&&<><label className={label}>Nombre completo<input required className={field} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label className={label}>Teléfono<input required type="tel" className={field} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label><label className={label}>Número de cédula<input required inputMode="numeric" minLength={11} maxLength={13} pattern="[0-9-]{11,13}" placeholder="000-0000000-0" className={field} value={form.nationalId} onChange={e=>setForm({...form,nationalId:e.target.value})}/></label><label className={label}>Vencimiento del seguro<input required type="date" min={new Date().toISOString().slice(0,10)} className={field} value={form.insuranceExpiry} onChange={e=>setForm({...form,insuranceExpiry:e.target.value})}/></label><div className="grid grid-cols-2 gap-3"><label className={label}>Marca de moto<input className={field} placeholder="Honda" value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})}/></label><label className={label}>Modelo<input className={field} placeholder="CG 150" value={form.model} onChange={e=>setForm({...form,model:e.target.value})}/></label><label className={label}>Color<input className={field} value={form.color} onChange={e=>setForm({...form,color:e.target.value})}/></label><label className={label}>Placa<input className={field} value={form.plate} onChange={e=>setForm({...form,plate:e.target.value})}/></label></div></>}<label className={label}>Correo electrónico<input required type="email" className={field} value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label className={label}>Contraseña<input required type="password" minLength={8} className={field} value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label><button disabled={busy} className="w-full rounded-xl bg-[#14251d] py-3.5 text-sm font-extrabold text-white disabled:opacity-50">{busy?"Procesando…":mode==="login"?"Entrar al portal":"Enviar solicitud de conductor"}</button></form>{mode==="login"&&<div className="mt-4 border-t border-slate-100 pt-4"><button type="button" onClick={()=>{setPhoneMode(v=>!v);setOtpSent(false);setOtp("");setNotice("");}} className="w-full rounded-xl border border-slate-200 p-3 text-xs font-bold text-slate-700">{phoneMode?"Volver al acceso por correo":"Iniciar sesión con número de teléfono"}</button>{phoneMode&&<form onSubmit={otpSent?verifyDriverOtp:sendDriverOtp} className="mt-3 space-y-3 rounded-xl bg-slate-50 p-3"><label className={label}>Teléfono<input required type="tel" value={form.phone} disabled={otpSent} onChange={e=>setForm(v=>({...v,phone:e.target.value}))} className={field} placeholder="809 000 0000"/></label>{otpSent&&<label className={label}>Código SMS<input required inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,"").slice(0,6))} className={field} placeholder="123456"/></label>}<button disabled={busy} className="w-full rounded-xl bg-lime-400 py-3 text-xs font-black text-[#14251d]">{busy?"Procesando…":otpSent?"Verificar y entrar":"Enviar código SMS"}</button></form>}</div>}{notice&&<p role="status" className="mt-4 rounded-xl bg-lime-50 p-3 text-xs font-semibold text-lime-900">{notice}</p>}<p className="mt-5 text-[10px] leading-5 text-slate-400">Los conductores nuevos deben ser aprobados por Cotuí Go antes de recibir servicios.</p></section></main>;
 return <main className="cg-customer-screen relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-[#101010] text-white">
 <div className="absolute inset-0 z-0"><CotuiGoDriverLiveMap driverId={profile.id} pickup={activeMapJob?{lat:activeMapJob.pickup_lat??null,lng:activeMapJob.pickup_lng??null}:null} destination={activeMapJob?{lat:activeMapJob.destination_lat??null,lng:activeMapJob.destination_lng??null}:null} routeToDestination={activeMapToDestination}/></div>
 <header className="absolute left-4 right-4 top-4 z-[700] flex items-center justify-between">
  <Link href="/" className="rounded-full bg-[#171717]/95 px-4 py-3 text-sm font-black tracking-tight text-white shadow-xl ring-1 ring-white/10">Cotuí <span className="text-lime-400">Go</span></Link>
  <div className="flex items-center gap-2">
   <span className="hidden rounded-full bg-[#171717]/95 px-3 py-2 text-[10px] font-bold text-white shadow-xl sm:inline">{profile.full_name.split(" ")[0]}</span>
   <button onClick={()=>refresh()} aria-label="Actualizar" className="grid h-12 w-12 place-items-center rounded-full bg-[#171717] text-white shadow-xl ring-1 ring-white/10"><RefreshCw size={18}/></button>
   <button onClick={logout} aria-label="Cerrar sesión" className="grid h-12 w-12 place-items-center rounded-full bg-[#171717] text-white shadow-xl ring-1 ring-white/10"><LogOut size={18}/></button>
  </div>
 </header>
 <div className="absolute inset-x-0 bottom-0 z-[650] mx-auto max-h-[78svh] w-full max-w-3xl overflow-y-auto rounded-t-[30px] bg-[#191919] px-4 pb-[max(18px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_50px_rgba(0,0,0,.42)] sm:rounded-t-[30px]">
  <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-white/25"/>
  <section className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-[#292929] p-4 ring-1 ring-white/5">
   <div className="min-w-0">
    <p className="text-[10px] font-black uppercase tracking-[.18em] text-lime-300">Centro de conductor</p>
    <h1 className="mt-1 truncate text-xl font-black text-white">Hola, {profile.full_name.split(" ")[0]}</h1>
    <p className="mt-1 text-[11px] text-white/55">{profile.status==="approved"?(profile.is_available?"Estás conectado y visible":"Estás desconectado"):"Cuenta en revisión"}</p>
   </div>
   {profile.status==="approved"?<button onClick={availability} disabled={busy} className={profile.is_available?"shrink-0 rounded-full bg-lime-300 px-4 py-3 text-xs font-black text-[#14251d]":"shrink-0 rounded-full bg-white px-4 py-3 text-xs font-black text-[#14251d]"}><Power size={15} className="mr-1 inline"/>{profile.is_available?"Desconectarme":"Conectarme"}</button>:<Clock3 size={24}/>}
  </section>
  {profile.status!=="approved"&&<DriverDocumentsForm driver={profile} onSaved={()=>{void refresh();}}/>}
  {notice&&<p role="status" className="mb-4 rounded-xl border border-lime-300/20 bg-lime-300/10 p-3 text-xs font-semibold text-lime-100">{notice}</p>}
  {profile.status==="approved"&&<>
   <nav className="mb-4 grid grid-cols-3 gap-2">
    <button onClick={()=>setTab("available")} className={tab==="available"?"rounded-xl bg-lime-300 px-2 py-3 text-xs font-black text-[#14251d]":"rounded-xl bg-[#303030] px-2 py-3 text-xs font-bold text-white/75"}><ClipboardList size={14} className="mr-1 inline"/> Ofertas ({availableRides.length+availableDeliveries.length})</button>
    <button onClick={()=>setTab("mine")} className={tab==="mine"?"rounded-xl bg-lime-300 px-2 py-3 text-xs font-black text-[#14251d]":"rounded-xl bg-[#303030] px-2 py-3 text-xs font-bold text-white/75"}><Navigation size={14} className="mr-1 inline"/> Mis viajes ({mineRides.length+mineDeliveries.length})</button>
    <button onClick={()=>setTab("wallet")} className={tab==="wallet"?"rounded-xl bg-lime-300 px-2 py-3 text-xs font-black text-[#14251d]":"rounded-xl bg-[#303030] px-2 py-3 text-xs font-bold text-white/75"}>RD$ Billetera</button>
   </nav>
   {walletBalance<100&&<div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3">
    <div><p className="text-xs font-black text-amber-200">Recarga necesaria para aceptar</p><p className="mt-1 text-[11px] text-white/70">Disponible: RD$ {walletBalance.toFixed(2)} · Te faltan RD$ {(100-walletBalance).toFixed(2)} para el mínimo de RD$100.</p></div>
    <button onClick={()=>setTab("wallet")} className="shrink-0 rounded-full bg-amber-300 px-3 py-2 text-[10px] font-black text-[#292014]">Recargar</button>
   </div>}
   {tab==="wallet"&&<div className="overflow-hidden rounded-2xl bg-white p-2 text-slate-900"><DriverWallet/></div>}
   {tab==="available"&&<>
    <DriverDispatch driverId={profile.id} isAvailable={profile.is_available&&!hasActiveService} canAccept={walletBalance>=100&&!hasActiveService} walletMessage={"Recarga RD$ "+Math.max(0,100-walletBalance).toFixed(2)+" para alcanzar el mínimo de RD$100."} onAccepted={()=>{void refresh();setTab("mine");}}/>
    <div className="my-4 flex items-center justify-between gap-3"><div><h2 className="text-lg font-black text-white">Ofertas disponibles</h2><p className="text-xs text-white/50">Revisa tu ganancia antes de aceptar.</p></div><button onClick={()=>refresh()} className="rounded-full bg-[#303030] px-3 py-2 text-xs font-bold text-white"><RefreshCw size={13} className="mr-1 inline"/>Actualizar</button></div>
    {!profile.is_available&&<div className="mb-4 rounded-xl border border-amber-200/20 bg-amber-200/10 p-3 text-xs text-amber-100">Conéctate para recibir solicitudes. Puedes revisar las ofertas disponibles.</div>}
    <div className="grid gap-3">{availableRides.map(j=><JobCard key={j.id} job={j} kind="ride" open/>)}{availableDeliveries.map(j=><JobCard key={j.id} job={j} kind="delivery" open/>)}{availableRides.length+availableDeliveries.length===0&&<p className="rounded-2xl bg-[#292929] p-6 text-sm text-white/55">No hay solicitudes disponibles ahora mismo.</p>}</div>
   </>}
   {tab==="mine"&&<section className="mx-auto max-w-3xl"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-black text-white">Tus servicios activos</h2><p className="text-xs text-white/50">Datos, mapa y controles en una sola pantalla.</p></div><button onClick={()=>refresh()} className="rounded-xl bg-[#303030] p-3 text-white"><RefreshCw size={15}/></button></div><div className="grid gap-4">{mineRides.map(j=><JobCard key={j.id} job={j} kind="ride" open={false}/>)}{mineDeliveries.map(j=><JobCard key={j.id} job={j} kind="delivery" open={false}/>)}{mineRides.length+mineDeliveries.length===0&&<p className="rounded-2xl bg-[#292929] p-6 text-sm text-white/55">Todavía no tienes servicios asignados.</p>}</div></section>}
  </>}
  <p className="mt-6 text-center text-[10px] text-white/30">Cotuí Go · Portal seguro de conductores</p>
 </div>
</main>;
}
