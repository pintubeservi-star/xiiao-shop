"use client";
import {useState} from "react";
import {usePathname} from "next/navigation";
import {getSupabase} from "@/lib/supabase/client";
import {PhoneCall,ShieldAlert,MessageCircle,X,Send,Bot,UserRound} from "lucide-react";
const SUPPORT="8492865774";
type ChatMessage={role:"user"|"assistant";content:string};
export default function CgSafetyDock(){
 const path=usePathname();
 const role=path==="/conductores"?"driver":"customer";
 const [open,setOpen]=useState(false),[kind,setKind]=useState<"unsafe"|"support">("unsafe"),[details,setDetails]=useState(""),[busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[human,setHuman]=useState(false);
 const [messages,setMessages]=useState<ChatMessage[]>([{role:"assistant",content:"Hola. Soy el asistente de Cotuí Go. Cuéntame qué necesitas y te ayudaré. Si existe peligro inmediato, llama al 911."}]);
 const [draft,setDraft]=useState("");
 if(path.startsWith("/admin")||path.startsWith("/acceso")||path.startsWith("/seguimiento"))return null;
 async function report(reportType:"unsafe"|"support"|"emergency",description:string){
  const s=getSupabase();const {data:{user}}=await s.auth.getUser();
  if(!user)throw new Error("Inicia sesión para enviar un reporte privado a administración.");
  const {error}=await s.from("cg_safety_reports").insert({user_id:user.id,reporter_role:role,report_type:reportType,details:description||null});
  if(error)throw error;
 }
 async function sendUnsafeReport(){
  setBusy(true);setNotice("");
  try{await report("unsafe",details.trim());setNotice("Reporte enviado. Administración podrá darle seguimiento.");setDetails("");}
  catch(e){setNotice(e instanceof Error?e.message:"No se pudo enviar el reporte.");}
  finally{setBusy(false);}
 }
 async function sendChat(e:React.FormEvent){
  e.preventDefault();const content=draft.trim();if(!content||busy)return;
  const next=[...messages,{role:"user" as const,content}];setMessages(next);setDraft("");setBusy(true);setNotice("");
  try{
   const s=getSupabase();const {data:{session}}=await s.auth.getSession();
   if(!session?.access_token)throw new Error("Inicia sesión para usar el asistente de soporte.");
   const response=await fetch("/api/support",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+session.access_token},body:JSON.stringify({messages:next.slice(-10)})});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||"El asistente no está disponible.");
   setMessages(v=>[...v,{role:"assistant",content:data.reply}]);
   if(data.emergency||data.escalate){
    setHuman(true);
    try{await report(data.emergency?"emergency":"support",next.map(m=>(m.role==="user"?"Pasajero/conductor: ":"Asistente: ")+m.content).join("\n"));}
    catch{}
    if(data.emergency)setNotice("Si hay peligro o lesiones, llama al 911 ahora. También hemos preparado la escalación a soporte.");
   }
  }catch(error){setNotice(error instanceof Error?error.message:"No se pudo consultar al asistente. Puedes solicitar ayuda humana.");}
  finally{setBusy(false);}
 }
 const wa="https://wa.me/1"+SUPPORT+"?text="+encodeURIComponent("Hola, necesito ayuda con Cotuí Go. Mi caso requiere soporte humano.");
 return <><div className="fixed bottom-20 right-3 z-[8500] flex flex-col items-end gap-2 sm:bottom-5">
  <a href="tel:911" className="flex items-center gap-2 rounded-full bg-red-600 px-4 py-3 text-xs font-black text-white shadow-xl"><PhoneCall size={16}/> Emergencia 911</a>
  <button onClick={()=>setOpen(true)} className="flex items-center gap-2 rounded-full bg-[#14251d] px-4 py-3 text-xs font-black text-white shadow-xl"><ShieldAlert size={16}/> Seguridad y soporte</button>
 </div>
 {open&&<div className="fixed inset-0 z-[9500] grid items-end bg-black/50 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
  <section className="mx-auto flex max-h-[90svh] w-full max-w-md flex-col rounded-t-3xl bg-white p-5 text-slate-900 shadow-2xl sm:rounded-3xl">
   <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Cotuí Go · Protección</p><h2 className="mt-1 text-xl font-black">¿Necesitas ayuda?</h2></div><button onClick={()=>setOpen(false)} aria-label="Cerrar"><X/></button></div>
   <p className="mt-2 text-xs leading-5 text-slate-600">Si hay peligro inmediato, llama al 911. Para una situación dentro del servicio, avisa a administración.</p>
   <div className="mt-4 grid grid-cols-2 gap-2"><button onClick={()=>{setKind("unsafe");setHuman(false);setNotice("");}} className={"rounded-xl border p-3 text-left text-xs font-bold "+(kind==="unsafe"?"border-amber-400 bg-amber-50":"border-slate-200")}><ShieldAlert className="mb-1" size={17}/>No me siento seguro/a</button><button onClick={()=>{setKind("support");setNotice("");}} className={"rounded-xl border p-3 text-left text-xs font-bold "+(kind==="support"?"border-emerald-400 bg-emerald-50":"border-slate-200")}><MessageCircle className="mb-1" size={17}/>Chat con asistente IA</button></div>
   {kind==="unsafe"?<><textarea value={details} onChange={e=>setDetails(e.target.value)} rows={4} placeholder="Cuéntanos brevemente qué sucede (opcional)" className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm"/><button disabled={busy} onClick={sendUnsafeReport} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#14251d] p-3 text-sm font-black text-white disabled:opacity-50"><Send size={16}/>{busy?"Enviando…":"Avisar a administración"}</button></>:<><div className="mt-3 min-h-[170px] flex-1 space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-3">{messages.map((m,i)=><div key={i} className={"flex gap-2 "+(m.role==="user"?"justify-end":"justify-start")}>{m.role==="assistant"&&<Bot size={16} className="mt-1 shrink-0 text-emerald-700"/>}<p className={"max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-xs leading-5 "+(m.role==="user"?"bg-[#14251d] text-white":"bg-white text-slate-700 shadow-sm")}>{m.content}</p>{m.role==="user"&&<UserRound size={16} className="mt-1 shrink-0 text-slate-500"/>}</div>)}{busy&&<p className="text-[10px] text-slate-500">El asistente está respondiendo…</p>}</div><form onSubmit={sendChat} className="mt-2 flex gap-2"><input value={draft} onChange={e=>setDraft(e.target.value)} maxLength={1200} placeholder="Escribe tu consulta…" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-3 text-sm"/><button disabled={busy||!draft.trim()} className="rounded-xl bg-[#14251d] px-4 text-white disabled:opacity-50"><Send size={17}/></button></form><button type="button" onClick={()=>setHuman(true)} className="mt-2 text-xs font-bold text-emerald-800 underline">Necesito hablar con una persona</button>{human&&<a href={wa} target="_blank" rel="noreferrer" className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-800"><MessageCircle size={16}/> Continuar por WhatsApp · 849 286 5774</a>}</>}
   {notice&&<p role="status" className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-900">{notice}</p>}
   <p className="mt-3 text-[10px] leading-4 text-slate-400">El asistente no sustituye al 911. Los casos de seguridad o los que no pueda resolver se derivan a soporte humano.</p>
  </section>
 </div>}
 </>;
}
