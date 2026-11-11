"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import { ArrowRight, Bike, Mail, LockKeyhole, UserRound, Phone, Eye, EyeOff, Package, ShieldCheck } from "lucide-react";

const field = "w-full rounded-xl border border-[#dce5df] bg-white px-4 py-3 text-[14px] text-[#172820] outline-none transition placeholder:text-[#9aa9a0] focus:border-[#16845b] focus:ring-4 focus:ring-[#16845b]/10";

function RideIllustration(){return <div className="cg-login-art relative mx-auto h-[154px] w-full max-w-[340px] overflow-hidden rounded-[26px] bg-[#eaf5e7]">
 <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full bg-[#d7efb6]"/>
 <div className="absolute left-7 top-8 h-8 w-8 rounded-full bg-[#f8d36a]"/>
 <div className="absolute bottom-0 left-0 h-10 w-full rounded-t-[50%] bg-[#c6e7aa]"/>
 <svg viewBox="0 0 340 154" className="absolute inset-0 h-full w-full" role="img" aria-label="Ilustración animada de un motorista de Cotuí Go">
  <path d="M0 126 Q80 112 170 126 T340 120" fill="none" stroke="#91c77b" strokeWidth="3" strokeDasharray="7 7"/>
  <g className="cg-art-cloud"><path d="M220 39c0-8 7-14 15-14 5-10 21-10 26 0 10-2 17 5 17 14z" fill="#fff" opacity=".9"/></g>
  <g transform="translate(70 25)">
   <circle cx="36" cy="91" r="20" fill="#fff" stroke="#173b2b" strokeWidth="5"/><circle cx="36" cy="91" r="5" fill="#173b2b"/>
   <circle cx="151" cy="91" r="20" fill="#fff" stroke="#173b2b" strokeWidth="5"/><circle cx="151" cy="91" r="5" fill="#173b2b"/>
   <path d="M36 91 65 56 104 91 36 91 81 91 111 52 151 91" fill="none" stroke="#173b2b" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
   <path d="M66 55h30l15-10h18" fill="none" stroke="#173b2b" strokeWidth="6" strokeLinecap="round"/>
   <path d="M85 42c0-18 13-29 29-29 15 0 26 10 26 25v7h-55z" fill="#c7f36b" stroke="#173b2b" strokeWidth="4"/>
   <path d="M105 46v-8c0-8 6-14 14-14" fill="none" stroke="#173b2b" strokeWidth="4" strokeLinecap="round"/>
   <circle cx="119" cy="57" r="4" fill="#173b2b"/>
   <path d="M91 61 77 79l27 12 20-23" fill="none" stroke="#e6a16b" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
   <path d="m106 89 17 2 12-19" fill="none" stroke="#173b2b" strokeWidth="10" strokeLinecap="round"/>
   <rect x="130" y="38" width="29" height="24" rx="5" fill="#173b2b"/><path d="M136 44h17" stroke="#c7f36b" strokeWidth="3"/>
  </g>
 </svg>
 <div className="absolute bottom-3 right-4 rounded-full bg-white/90 px-3 py-1 text-[9px] font-black tracking-[.14em] text-[#28543a] shadow-sm">COTUÍ SE MUEVE</div>
</div>}

export default function AccessPage() {
 const router=useRouter();
 const [mode,setMode]=useState<"login"|"register"|"reset">("login");
 const [form,setForm]=useState({name:"",phone:"",email:"",password:""});
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[showPassword,setShowPassword]=useState(false);
 useEffect(()=>{let live=true;const params=new URLSearchParams(window.location.search);const requested=params.get("mode");if(requested==="register"||requested==="login")setMode(requested);if(params.get("verified")==="1")setNotice("¡Correo confirmado! Ya puedes iniciar sesión.");getSupabase().auth.getUser().then(({data})=>{if(live&&data.user)router.replace("/");}).catch(()=>{if(live)setNotice("No pudimos comprobar tu sesión. Inténtalo nuevamente.");});return()=>{live=false;};},[router]);
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setNotice("");try{const s=getSupabase();if(mode==="register"){if(form.password.length<8)throw new Error("La contraseña debe tener al menos 8 caracteres.");const {data,error}=await s.auth.signUp({email:form.email.trim().toLowerCase(),password:form.password,options:{data:{full_name:form.name.trim(),phone:form.phone.trim()},emailRedirectTo:window.location.origin+"/acceso?verified=1"}});if(error)throw error;if(data.session){router.replace("/");router.refresh();}else setNotice("Cuenta creada. Revisa tu correo para confirmar y activar el acceso.");}else if(mode==="login"){const {error}=await s.auth.signInWithPassword({email:form.email.trim().toLowerCase(),password:form.password});if(error)throw error;router.replace("/");router.refresh();}else{const {error}=await s.auth.resetPasswordForEmail(form.email.trim().toLowerCase(),{redirectTo:window.location.origin+"/acceso?reset=1"});if(error)throw error;setNotice("Si el correo está registrado, recibirás un enlace para recuperar tu acceso.");}}catch(e){setNotice(e instanceof Error?e.message:"No se pudo completar. Inténtalo nuevamente.");}finally{setBusy(false);}}
 const title=mode==="register"?"Crea tu cuenta":mode==="reset"?"Recupera tu acceso":"¡Qué bueno verte!";
 return <main className="cg-login-screen min-h-[100svh] h-[100svh] overflow-y-auto bg-[#f3f6f2] px-3 py-3 text-[#172820] sm:grid sm:place-items-center sm:px-6">
  <div className="mx-auto grid min-h-[calc(100svh-24px)] w-full max-w-5xl overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_20px_70px_rgba(18,45,31,.12)] lg:min-h-[min(720px,calc(100svh-40px))] lg:grid-cols-[.92fr_1.08fr]">
   <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#102c22] p-8 text-white lg:flex">
    <div className="absolute -right-24 -top-20 h-80 w-80 rounded-full border border-white/10"/><div className="absolute -right-10 top-20 h-52 w-52 rounded-full border border-white/10"/>
    <div className="relative"><div className="text-[10px] font-black uppercase tracking-[.2em] text-[#d8f6a5]">Cotuí · República Dominicana</div><div className="mt-4 text-3xl font-black">COTUÍ <span className="text-[#c7f36b]">GO</span></div></div>
    <div className="relative"><RideIllustration/><h1 className="mt-7 text-4xl font-black leading-[1.05]">Tu ciudad se mueve <span className="text-[#c7f36b]">contigo.</span></h1><p className="mt-3 max-w-sm text-sm leading-6 text-white/70">Pide tu moto o envía un paquete sin complicaciones.</p></div>
    <div className="relative flex items-center gap-2 text-[10px] text-white/60"><ShieldCheck size={14} className="text-[#c7f36b]"/> Acceso seguro y sencillo</div>
   </aside>
   <section className="flex min-h-[calc(100svh-24px)] flex-col justify-center px-5 py-4 sm:px-10 lg:px-12">
    <div className="mx-auto w-full max-w-[390px]">
     <div className="mb-3 flex items-center justify-between lg:hidden"><div><div className="text-[19px] font-black tracking-tight">COTUÍ <span className="text-[#16845b]">GO</span></div><div className="text-[9px] font-bold uppercase tracking-[.16em] text-[#829187]">Movilidad de aquí</div></div><div className="rounded-xl bg-[#eaf5e7] p-2 text-[#173b2b]"><Bike size={21}/></div></div>
     <div className="lg:hidden"><RideIllustration/></div>
     <div className="mt-4 text-[9px] font-black uppercase tracking-[.2em] text-[#16845b]">Acceso de clientes</div>
     <h2 className="mt-1 text-[26px] font-black leading-tight tracking-[-.035em] sm:text-[30px]">{title}</h2>
     <p className="mt-1 text-[12px] leading-5 text-[#718078]">{mode==="register"?"Regístrate una vez y pide viajes o envía paquetes.":mode==="reset"?"Te enviaremos un enlace seguro a tu correo.":"Inicia sesión y pide tu viaje en unos segundos."}</p>
     {mode!=="reset"&&<div className="mt-4 grid grid-cols-2 rounded-xl bg-[#f1f5f1] p-1"><button type="button" onClick={()=>{setMode("login");setNotice("");}} className={mode==="login"?"rounded-lg bg-white px-3 py-2.5 text-xs font-extrabold text-[#17382a] shadow-sm":"rounded-lg px-3 py-2.5 text-xs font-bold text-[#7b8980]"}>Iniciar sesión</button><button type="button" onClick={()=>{setMode("register");setNotice("");}} className={mode==="register"?"rounded-lg bg-white px-3 py-2.5 text-xs font-extrabold text-[#17382a] shadow-sm":"rounded-lg px-3 py-2.5 text-xs font-bold text-[#7b8980]"}>Crear cuenta</button></div>}
     <form onSubmit={submit} className="mt-4 space-y-3">
      {mode==="register"&&<><label className="block"><span className="mb-1 block text-[11px] font-bold text-[#405248]">Nombre y apellido</span><span className="relative block"><UserRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#91a097]"/><input required autoComplete="name" className={field+" pl-10"} placeholder="Tu nombre completo" value={form.name} onChange={e=>setForm(v=>({...v,name:e.target.value}))}/></span></label><label className="block"><span className="mb-1 block text-[11px] font-bold text-[#405248]">Teléfono</span><span className="relative block"><Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#91a097]"/><input required type="tel" autoComplete="tel" className={field+" pl-10"} placeholder="809 000 0000" value={form.phone} onChange={e=>setForm(v=>({...v,phone:e.target.value}))}/></span></label></>}
      <label className="block"><span className="mb-1 block text-[11px] font-bold text-[#405248]">Correo electrónico</span><span className="relative block"><Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#91a097]"/><input required type="email" autoComplete="email" className={field+" pl-10"} placeholder="tucorreo@ejemplo.com" value={form.email} onChange={e=>setForm(v=>({...v,email:e.target.value}))}/></span></label>
      {mode!=="reset"&&<label className="block"><span className="mb-1 block text-[11px] font-bold text-[#405248]">Contraseña</span><span className="relative block"><LockKeyhole size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#91a097]"/><input required minLength={8} type={showPassword?"text":"password"} autoComplete={mode==="register"?"new-password":"current-password"} className={field+" pl-10 pr-11"} placeholder="Tu contraseña" value={form.password} onChange={e=>setForm(v=>({...v,password:e.target.value}))}/><button type="button" aria-label={showPassword?"Ocultar contraseña":"Mostrar contraseña"} onClick={()=>setShowPassword(v=>!v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#91a097]">{showPassword?<EyeOff size={16}/>:<Eye size={16}/>}</button></span></label>}
      {mode==="login"&&<div className="flex justify-end"><button type="button" onClick={()=>{setMode("reset");setNotice("");}} className="text-[11px] font-bold text-[#16845b]">¿Olvidaste tu contraseña?</button></div>}
      <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#123b2b] px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#123b2b]/15 disabled:opacity-50">{busy?"Procesando…":mode==="register"?"Crear mi cuenta":mode==="reset"?"Enviar enlace":"Entrar a Cotuí Go"}<ArrowRight size={17}/></button>
     </form>
     {notice&&<p role="status" className="mt-3 rounded-xl border border-[#cfe6d6] bg-[#f0faf2] p-3 text-xs leading-5 text-[#24553a]">{notice}</p>}
     {mode==="reset"&&<button type="button" onClick={()=>{setMode("login");setNotice("");}} className="mt-3 text-xs font-bold text-[#16845b]">Volver al inicio de sesión</button>}
     <div className="mt-4 flex items-center justify-center gap-1.5 text-[9px] font-semibold text-[#9aa69e]"><ShieldCheck size={12}/> Tu cuenta está protegida · Cotuí, RD</div>
    </div>
   </section>
  </div>
 </main>;
}
