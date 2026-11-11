"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import { ArrowRight, ArrowLeft, Bike, Mail, LockKeyhole, UserRound, Phone, Eye, EyeOff, ShieldCheck, MapPin } from "lucide-react";

const field = "w-full rounded-xl border border-[#dce5df] bg-white px-4 py-3 text-[14px] text-[#172820] outline-none transition placeholder:text-[#9aa9a0] focus:border-[#16845b] focus:ring-4 focus:ring-[#16845b]/10";

function RideIllustration(){return <div className="cg-login-art cg-immersive-scene absolute inset-0 h-full w-full max-w-none overflow-hidden rounded-none bg-[#0c3027]">
 <div className="cg-scene-glow absolute -right-12 -top-24 h-64 w-64 rounded-full bg-[#b8e66b]/20 blur-3xl"/>
 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(187,230,113,.22),transparent_40%),linear-gradient(155deg,#164536_0%,#0b2924_65%,#102b25_100%)]"/>
 <div className="cg-stars absolute inset-0 opacity-60" style={{backgroundImage:"radial-gradient(#e9ffd1 1px,transparent 1px)",backgroundSize:"37px 37px"}}/>
 <svg viewBox="0 0 520 250" className="absolute inset-0 h-full w-full" role="img" aria-label="Cotuí Go: una moto recorre la ciudad de noche">
  <circle cx="405" cy="52" r="27" fill="#d7f5a5" opacity=".8"/><circle cx="405" cy="52" r="42" fill="#d7f5a5" opacity=".08"/>
  <g fill="#173f34"><path d="M0 142V89h34v53zm38 0V66h39v76zm45 0V97h35v45zm42 0V76h42v66zm50 0V54h36v88zm44 0V91h35v51zm42 0V72h44v70zm52 0V96h37v46zm45 0V61h43v81zm51 0V88h42v54z"/></g>
  <g fill="#c9ef91" opacity=".5"><path d="M47 80h5v7h-5zm14 0h5v7h-5zm0 15h5v7h-5zm76-5h5v7h-5zm14 0h5v7h-5zm56-22h5v7h-5zm14 0h5v7h-5zm58 17h5v7h-5zm15 0h5v7h-5zm80-9h5v7h-5zm15 0h5v7h-5zm57 20h5v7h-5z"/></g>
  <path d="M0 151 Q130 128 260 150 T520 144V250H0Z" fill="#1d4438"/><path d="M0 190 Q150 146 290 179T520 164V250H0Z" fill="#142c27"/>
  <path d="M-10 216 Q150 174 290 203T530 187" fill="none" stroke="#d5edb2" strokeOpacity=".38" strokeWidth="2"/><path d="M-10 232 Q150 190 290 219T530 203" fill="none" stroke="#d5edb2" strokeOpacity=".22" strokeWidth="2"/>
  <path className="cg-route-line" d="M20 190 Q120 155 200 181T370 169" fill="none" stroke="#c9f77d" strokeWidth="3" strokeDasharray="6 9" strokeLinecap="round"/>
  <g className="cg-floating-pin" transform="translate(370 110)"><path d="M0 0c-15 0-25 11-25 24 0 18 25 42 25 42s25-24 25-42C25 11 15 0 0 0" fill="#c9f77d"/><circle r="9" cy="23" fill="#173d30"/><circle r="3" cy="23" fill="#fff"/></g>
  <g className="cg-moving-bike" transform="translate(185 128)"><ellipse cx="75" cy="77" rx="84" ry="10" fill="#071d18" opacity=".45"/>
   <circle cx="25" cy="66" r="20" fill="#10251f" stroke="#e8f4dc" strokeWidth="4"/><circle cx="25" cy="66" r="6" fill="#9bb8a0"/><circle cx="132" cy="66" r="20" fill="#10251f" stroke="#e8f4dc" strokeWidth="4"/><circle cx="132" cy="66" r="6" fill="#9bb8a0"/>
   <path d="M25 66 52 32 91 66 25 66 77 66 105 31 132 66" fill="none" stroke="#d9f2bd" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/><path d="M51 32h34l20-9h20" fill="none" stroke="#d9f2bd" strokeWidth="6" strokeLinecap="round"/>
   <path d="M67 28c0-23 15-37 35-37 18 0 31 12 31 32v7H67z" fill="#c7f36b" stroke="#173d30" strokeWidth="4"/><path d="M96 28v-9c0-9 7-16 16-16" fill="none" stroke="#173d30" strokeWidth="4" strokeLinecap="round"/>
   <path d="M75 43 61 59l30 12 20-24" fill="none" stroke="#e8a477" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round"/><path d="m91 69 20 0 14-19" fill="none" stroke="#c7f36b" strokeWidth="11" strokeLinecap="round"/>
   <rect x="111" y="22" width="28" height="25" rx="5" fill="#102d25"/><path d="M117 29h16" stroke="#c7f36b" strokeWidth="3"/>
  </g>
 </svg>
 <div className="absolute left-4 top-4 rounded-full border border-white/15 bg-[#0b2b23]/65 px-3 py-1.5 text-[9px] font-black tracking-[.18em] text-[#d7f5a5] backdrop-blur">COTUÍ · REPÚBLICA DOMINICANA</div>
 <div className="absolute bottom-4 left-4"><div className="text-[10px] font-bold uppercase tracking-[.2em] text-[#d5efb6]/70">Tu ciudad, en movimiento</div><div className="mt-1 text-xl font-black tracking-tight text-white">COTUÍ <span className="text-[#c7f36b]">GO</span></div></div>
 <div className="absolute bottom-4 right-4 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[9px] font-bold text-white/90 backdrop-blur">MOTO · PAQUETES</div>
</div>}

export default function AccessPage() {
 const router=useRouter();
 const [mode,setMode]=useState<"login"|"register"|"reset">("login");
 const [role,setRole]=useState<"customer"|"driver">("customer");
 const [showAuth,setShowAuth]=useState(false);
 const [form,setForm]=useState({name:"",phone:"",email:"",password:""});
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[showPassword,setShowPassword]=useState(false);
 useEffect(()=>{let live=true;const params=new URLSearchParams(window.location.search);const requested=params.get("mode");if(requested==="register"||requested==="login"){setMode(requested);setShowAuth(true);}if(params.get("reset")==="1"){setMode("reset");setShowAuth(true);}if(params.get("verified")==="1")setNotice("¡Correo confirmado! Ya puedes iniciar sesión.");getSupabase().auth.getUser().then(({data})=>{if(live&&data.user)router.replace("/");}).catch(()=>{if(live)setNotice("No pudimos comprobar tu sesión. Inténtalo nuevamente.");});return()=>{live=false;};},[router]);
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setNotice("");try{const s=getSupabase();if(mode==="register"){if(form.password.length<8)throw new Error("La contraseña debe tener al menos 8 caracteres.");const {data,error}=await s.auth.signUp({email:form.email.trim().toLowerCase(),password:form.password,options:{data:{full_name:form.name.trim(),phone:form.phone.trim(),role},emailRedirectTo:window.location.origin+"/acceso?verified=1"}});if(error)throw error;if(data.session){router.replace("/");router.refresh();}else setNotice("Cuenta creada. Revisa tu correo para confirmar y activar el acceso.");}else if(mode==="login"){const {error}=await s.auth.signInWithPassword({email:form.email.trim().toLowerCase(),password:form.password});if(error)throw error;router.replace("/");router.refresh();}else{const {error}=await s.auth.resetPasswordForEmail(form.email.trim().toLowerCase(),{redirectTo:window.location.origin+"/acceso?reset=1"});if(error)throw error;setNotice("Si el correo está registrado, recibirás un enlace para recuperar tu acceso.");}}catch(e){setNotice(e instanceof Error?e.message:"No se pudo completar. Inténtalo nuevamente.");}finally{setBusy(false);}}
 const title=mode==="register"?"Crea tu cuenta":mode==="reset"?"Recupera tu acceso":"¡Qué bueno verte!";
 return <main className="cg-immersive-cover relative min-h-[100svh] overflow-hidden bg-[#071b14] text-white">
  <div className="absolute inset-0"><RideIllustration/></div>
  <div className="cg-cover-shade absolute inset-0"/>
  <header className="relative z-10 mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 py-5 sm:px-9 lg:px-14">
   <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/20 bg-white/10 text-[#d5f79a] backdrop-blur"><Bike size={22}/></div><div><div className="text-[19px] font-black tracking-[-.04em]">COTUÍ <span className="text-[#c7f36b]">GO</span></div><div className="text-[8px] font-bold uppercase tracking-[.25em] text-white/55">Movilidad inteligente</div></div></div>
   <div className="hidden items-center gap-7 text-[11px] font-bold text-white/75 md:flex"><span>Viajes en moto</span><span>Envío de paquetes</span><span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-white">Cotuí, República Dominicana</span></div>
   <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-[10px] font-bold text-white/80 backdrop-blur">Cotuí, República Dominicana</span>
  </header>
  <div className="relative z-10 mx-auto grid min-h-[calc(100svh-80px)] w-full max-w-[1440px] items-center gap-8 px-5 pb-8 pt-3 sm:px-9 lg:grid-cols-[1.1fr_.72fr] lg:gap-16 lg:px-14 lg:pb-14">
   <section className="cg-cover-copy max-w-[690px] self-center pb-2 pt-4 lg:pt-0">
    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d9f99d]/30 bg-[#d9f99d]/10 px-3.5 py-2 text-[9px] font-black uppercase tracking-[.2em] text-[#e4ffb5] backdrop-blur"><span className="h-1.5 w-1.5 rounded-full bg-[#c7f36b] shadow-[0_0_12px_#c7f36b]"/> Cotuí está en movimiento</div>
    <h1 className="max-w-[700px] text-[clamp(42px,7vw,88px)] font-black leading-[.91] tracking-[-.065em] text-white">Tu ciudad.<br/><span className="text-[#c7f36b]">Tu camino.</span><br/>A tu manera.</h1>
    <p className="mt-6 max-w-[460px] text-[14px] leading-7 text-white/75 sm:text-[16px]">Muévete por Cotuí con facilidad. Pide una moto o envía tus paquetes desde un solo lugar, con seguimiento de tu servicio en tiempo real.</p>
    <div className="mt-8 grid w-full max-w-[540px] gap-3 sm:grid-cols-2">
     <button type="button" onClick={()=>{setRole("driver");setShowAuth(true);setMode("login");setNotice("");}} className="group flex min-h-[76px] items-center justify-between rounded-2xl border border-white/25 bg-white/[.10] px-5 py-4 text-left text-white shadow-xl backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#c7f36b]/70 hover:bg-white/[.16]">
      <span className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#c7f36b] text-[#10291e]"><Bike size={23}/></span><span><span className="block text-[14px] font-black">Soy conductor</span><span className="mt-1 block text-[10px] text-white/65">Quiero recibir servicios</span></span></span><ArrowRight size={19} className="text-[#c7f36b] transition group-hover:translate-x-1"/>
     </button>
     <button type="button" onClick={()=>{setRole("customer");setShowAuth(true);setMode("login");setNotice("");}} className="group flex min-h-[76px] items-center justify-between rounded-2xl bg-[#c7f36b] px-5 py-4 text-left text-[#10291e] shadow-[0_14px_40px_#b7ef5b35] transition hover:-translate-y-1 hover:bg-[#d7ff91]">
      <span className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#10291e]/10"><MapPin size={23}/></span><span><span className="block text-[14px] font-black">Quiero un viaje</span><span className="mt-1 block text-[10px] text-[#25452f]/75">Pedir moto o enviar paquete</span></span></span><ArrowRight size={19}/>
     </button>
    </div>
    <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/15 pt-5 text-[10px] font-bold text-white/65"><span className="flex items-center gap-2"><Bike size={15} className="text-[#c7f36b]"/> Viajes en moto</span><span className="flex items-center gap-2"><ArrowRight size={14} className="text-[#c7f36b}"/> Entrega de paquetes</span><span className="flex items-center gap-2"><ShieldCheck size={14} className="text-[#c7f36b}"/> Fácil, local y seguro</span></div>
   </section>
   {showAuth&&<section id="acceso" className="cg-cover-auth w-full self-center">
    <div className="mx-auto w-full max-w-[410px] rounded-[28px] border border-white/65 bg-[#fbfdf9]/[.97] p-5 text-[#172820] shadow-[0_30px_100px_rgba(0,0,0,.35)] backdrop-blur-2xl sm:p-7">
     <button type="button" onClick={()=>setShowAuth(false)} className="mb-4 inline-flex items-center gap-2 text-[11px] font-extrabold text-[#16845b]"><ArrowLeft size={15}/> Volver a elegir</button>
     <div className="mb-3 rounded-xl bg-[#eaf5e7] px-3 py-2 text-[10px] font-black uppercase tracking-[.12em] text-[#174b35]">{role==="driver"?"Acceso para conductores":"Acceso para pasajeros"}</div>
     <div className="mb-5 flex items-center justify-between"><div><div className="text-[9px] font-black uppercase tracking-[.2em] text-[#16845b]">Bienvenido a Cotuí Go</div><h2 className="mt-1 text-[25px] font-black tracking-[-.04em]">{title}</h2><p className="mt-1 text-[11px] text-[#718078]">{mode==="register"?"Regístrate y comienza a moverte.":mode==="reset"?"Recupera tu acceso de forma segura.":"Entra y pide tu servicio en segundos."}</p></div><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eaf5e7] text-[#174b35]"><Bike size={22}/></div></div>
     {mode!=="reset"&&<div className="mb-4 grid grid-cols-2 rounded-xl bg-[#edf2ec] p-1"><button type="button" onClick={()=>{setMode("login");setNotice("");}} className={mode==="login"?"rounded-lg bg-white px-3 py-2.5 text-xs font-extrabold text-[#17382a] shadow-sm":"rounded-lg px-3 py-2.5 text-xs font-bold text-[#7b8980]"}>Iniciar sesión</button><button type="button" onClick={()=>{setMode("register");setNotice("");}} className={mode==="register"?"rounded-lg bg-white px-3 py-2.5 text-xs font-extrabold text-[#17382a] shadow-sm":"rounded-lg px-3 py-2.5 text-xs font-bold text-[#7b8980]"}>Crear cuenta</button></div>}
     <form onSubmit={submit} className="space-y-3">
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
   </section>}
  </div>
 </main>;
}
