"use client";
import {useEffect,useState} from "react";
import {BellRing,BellOff,LoaderCircle,ShieldCheck} from "lucide-react";
import {getSupabase} from "@/lib/supabase/client";

const endpoint="https://hezjaxdmuwgejgcitavw.supabase.co/functions/v1/cg-admin-push";
const publicKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"";
function decodeKey(value:string){const padding="=".repeat((4-value.length%4)%4);const raw=atob((value+padding).replace(/-/g,"+").replace(/_/g,"/"));return Uint8Array.from(raw,c=>c.charCodeAt(0));}
export default function AdminPushNotifications(){
 const [busy,setBusy]=useState(false),[enabled,setEnabled]=useState(false),[notice,setNotice]=useState("");
 useEffect(()=>{let live=true;(async()=>{try{if(!("serviceWorker" in navigator)||!("PushManager" in window))return;const reg=await navigator.serviceWorker.ready;const sub=await reg.pushManager.getSubscription();if(live)setEnabled(!!sub);}catch{}})();return()=>{live=false}},[]);
 async function request(method:"enable"|"disable"){
  setBusy(true);setNotice("");
  try{
   const s=getSupabase();const {data:{session},error:sessionError}=await s.auth.getSession();if(sessionError)throw sessionError;if(!session)throw new Error("Inicia sesión como administrador.");
   const headers={"Content-Type":"application/json","apikey":publicKey,"Authorization":"Bearer "+session.access_token};
   const reg=await navigator.serviceWorker.register("/sw.js");await navigator.serviceWorker.ready;
   const current=await reg.pushManager.getSubscription();
   if(method==="disable"){
    if(current){await fetch(endpoint,{method:"POST",headers,body:JSON.stringify({action:"unsubscribe",endpoint:current.endpoint})});await current.unsubscribe();}
    setEnabled(false);setNotice("Notificaciones desactivadas en este dispositivo.");return;
   }
   if(!("Notification" in window)||!("PushManager" in window))throw new Error("Este navegador no admite notificaciones push.");
   const permission=Notification.permission==="granted"?"granted":await Notification.requestPermission();
   if(permission!=="granted")throw new Error("Permite las notificaciones de Cotuí Go en los ajustes del navegador.");
   const keyResponse=await fetch(endpoint,{headers:{"apikey":publicKey}});const keyData=await keyResponse.json();if(!keyResponse.ok||!keyData.publicKey)throw new Error(keyData.error||"No se pudo preparar el servicio de notificaciones.");
   const subscription=current||await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decodeKey(keyData.publicKey)});
   const saved=await fetch(endpoint,{method:"POST",headers,body:JSON.stringify({action:"subscribe",subscription:subscription.toJSON(),userAgent:navigator.userAgent})});
   const result=await saved.json();if(!saved.ok)throw new Error(result.error||"No se pudo registrar el teléfono.");
   setEnabled(true);setNotice("Este teléfono quedó registrado. Recibirás avisos de conductores y solicitudes aunque cierres Cotuí Go.");
  }catch(e){setNotice(e instanceof Error?e.message:"No se pudo configurar este dispositivo.");}
  finally{setBusy(false);}
 }
 return <section className="mb-5 flex flex-col gap-3 rounded-2xl border border-lime-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
  <div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-lime-100 text-lime-800"><BellRing size={21}/></span><div><h3 className="font-black text-slate-900">Alertas en tu teléfono</h3><p className="mt-1 text-xs leading-5 text-slate-500">Nuevos conductores registrados y nuevas solicitudes de motos o paquetes, incluso con la app cerrada.</p><p className="mt-2 flex items-center gap-1 text-[11px] font-bold text-slate-600"><ShieldCheck size={13}/>{enabled?"Este dispositivo está activado":"Activa las alertas en este dispositivo"}</p></div></div>
  <button type="button" disabled={busy} onClick={()=>request(enabled?"disable":"enable")} className={enabled?"inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-black text-slate-700 disabled:opacity-50":"inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#14251d] px-4 py-3 text-xs font-black text-white disabled:opacity-50"}>
   {busy?<LoaderCircle size={16} className="animate-spin"/>:enabled?<BellOff size={16}/>:<BellRing size={16}/>}
   {busy?"Configurando…":enabled?"Desactivar en este teléfono":"Activar notificaciones"}
  </button>
  {notice&&<p role="status" className="w-full text-xs font-semibold text-slate-700 sm:basis-full">{notice}</p>}
 </section>;
}
