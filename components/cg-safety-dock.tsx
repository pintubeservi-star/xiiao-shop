"use client";
import {useState} from "react";
import {usePathname} from "next/navigation";
import {getSupabase} from "@/lib/supabase/client";
import {AlertTriangle,PhoneCall,ShieldAlert,MessageCircle,X,Send} from "lucide-react";
const SUPPORT="8492865774";
export default function CgSafetyDock(){
 const path=usePathname();
 const role=path==="/conductores"?"driver":"customer";
 const [open,setOpen]=useState(false),[kind,setKind]=useState<"unsafe"|"support">("unsafe"),[details,setDetails]=useState(""),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 if(path.startsWith("/admin")||path.startsWith("/acceso")||path.startsWith("/seguimiento"))return null;
 async function report(){
  setBusy(true);setNotice("");
  try{
   const s=getSupabase();const {data:{user}}=await s.auth.getUser();
   if(!user)throw new Error("Inicia sesión para enviar un reporte privado a administración.");
   const {error}=await s.from("cg_safety_reports").insert({user_id:user.id,reporter_role:role,report_type:kind,details:details.trim()||null});
   if(error)throw error;
   setNotice("Reporte enviado. Administración recibirá el aviso y podrá darle seguimiento.");
   setDetails("");
  }catch(e){setNotice(e instanceof Error?e.message:"No se pudo enviar el reporte.");}
  finally{setBusy(false);}
 }
 const wa="https://wa.me/1"+SUPPORT+"?text="+encodeURIComponent("Hola, necesito ayuda con Cotuí Go. Mi caso requiere soporte humano.");
 return <><div className="fixed bottom-20 right-3 z-[8500] flex flex-col items-end gap-2 sm:bottom-5">
  <a href="tel:911" className="flex items-center gap-2 rounded-full bg-red-600 px-4 py-3 text-xs font-black text-white shadow-xl"><PhoneCall size={16}/> Emergencia 911</a>
  <button onClick={()=>setOpen(true)} className="flex items-center gap-2 rounded-full bg-[#14251d] px-4 py-3 text-xs font-black text-white shadow-xl"><ShieldAlert size={16}/> Seguridad y soporte</button>
 </div>
 {open&&<div className="fixed inset-0 z-[9500] grid items-end bg-black/50 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
  <section className="mx-auto w-full max-w-md rounded-t-3xl bg-white p-5 text-slate-900 shadow-2xl sm:rounded-3xl">
   <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Cotuí Go · Protección</p><h2 className="mt-1 text-xl font-black">¿Necesitas ayuda?</h2></div><button onClick={()=>setOpen(false)} aria-label="Cerrar"><X/></button></div>
   <p className="mt-2 text-xs leading-5 text-slate-600">Si hay peligro inmediato, llama al 911. Para una situación dentro del servicio, avisa a administración.</p>
   <button onClick={()=>{setKind("unsafe");setNotice("");}} className={"mt-4 w-full rounded-xl border p-3 text-left text-sm font-bold "+(kind==="unsafe"?"border-amber-400 bg-amber-50":"border-slate-200")}> <ShieldAlert className="mr-2 inline" size={17}/> No me siento seguro/a</button>
   <button onClick={()=>{setKind("support");setNotice("");}} className={"mt-2 w-full rounded-xl border p-3 text-left text-sm font-bold "+(kind==="support"?"border-emerald-400 bg-emerald-50":"border-slate-200")}><MessageCircle className="mr-2 inline" size={17}/> Necesito soporte</button>
   <textarea value={details} onChange={e=>setDetails(e.target.value)} rows={3} placeholder="Cuéntanos brevemente qué sucede (opcional)" className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm"/>
   <button disabled={busy} onClick={report} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#14251d] p-3 text-sm font-black text-white disabled:opacity-50"><Send size={16}/>{busy?"Enviando…":"Avisar a administración"}</button>
   <a href={wa} target="_blank" rel="noreferrer" className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-800"><MessageCircle size={16}/> Contactar soporte por WhatsApp</a>
   {notice&&<p role="status" className="mt-3 rounded-xl bg-slate-50 p-3 text-xs font-semibold">{notice}</p>}
   <p className="mt-3 text-[10px] leading-4 text-slate-400">WhatsApp se ofrece como alternativa de soporte humano. No sustituye al 911 en emergencias.</p>
  </section>
 </div>}
 </>;
}
