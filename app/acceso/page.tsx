"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import { ArrowRight, Bike, Mail, LockKeyhole, UserRound, Phone, Eye, EyeOff, ShieldCheck, Camera, X, MapPin } from "lucide-react";

const field = "w-full rounded-xl border border-[#dce5df] bg-white px-4 py-3 text-[14px] text-[#172820] outline-none transition placeholder:text-[#9aa9a0] focus:border-[#16845b] focus:ring-4 focus:ring-[#16845b]/10";

function RideIllustration(){return <div className="cg-login-art cg-immersive-scene relative mx-auto h-[230px] w-full max-w-[520px] overflow-hidden rounded-[26px] bg-[#0c3027] sm:h-[250px]">
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
 const [form,setForm]=useState({name:"",phone:"",email:"",password:""});
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[showPassword,setShowPassword]=useState(false);
 const [arOpen,setArOpen]=useState(false),[cameraError,setCameraError]=useState("");
 const [cameraStream,setCameraStream]=useState<MediaStream|null>(null);
 const cameraRef=useRef<HTMLVideoElement|null>(null);
 useEffect(()=>{if(cameraRef.current&&cameraStream){cameraRef.current.srcObject=cameraStream;cameraRef.current.play().catch(()=>{});}return()=>{if(cameraStream)cameraStream.getTracks().forEach(track=>track.stop());};},[cameraStream]);
 async function openAR(){setCameraError("");if(!navigator.mediaDevices?.getUserMedia){setCameraError("Tu navegador no permite abrir la cámara. Puedes disfrutar la experiencia inmersiva del mapa.");setArOpen(true);return;}try{const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false});setCameraStream(stream);setArOpen(true);}catch{setCameraError("No se pudo activar la cámara. Revisa el permiso del navegador y vuelve a intentarlo.");setArOpen(true);}}
 function closeAR(){setArOpen(false);if(cameraStream){cameraStream.getTracks().forEach(track=>track.stop());setCameraStream(null);}}
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
     <button type="button" onClick={openAR} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[#cfe2d4] bg-[#f5faf4] px-4 py-2.5 text-[11px] font-extrabold text-[#174b35] shadow-sm lg:hidden"><Camera size={15}/> Explorar Cotuí en realidad aumentada <span className="rounded-full bg-[#dff4b8] px-2 py-0.5 text-[9px]">AR</span></button>
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
  {arOpen&&<div className="cg-ar-overlay" role="dialog" aria-modal="true" aria-label="Vista de realidad aumentada de Cotuí Go">
   <div className="cg-ar-stage">
    {cameraStream?<video ref={cameraRef} autoPlay muted playsInline className="cg-ar-camera"/>:<div className="cg-ar-fallback"><div className="text-5xl">🌃</div><div className="mt-3 text-lg font-black">COTUÍ EN MODO AR</div><p className="mt-2 max-w-xs text-xs leading-5 text-white/70">{cameraError||"Activa la cámara para ver la capa de navegación sobre tu entorno."}</p></div>}
    <div className="cg-ar-vignette"/><div className="cg-ar-top"><span><span className="cg-ar-live-dot"/> COTUÍ GO · AR VIEW</span><button type="button" onClick={closeAR} aria-label="Cerrar vista AR"><X size={19}/></button></div>
    <div className="cg-ar-hud"><div className="cg-ar-label"><MapPin size={14}/> DESTINO CERCA DE TI</div><div className="cg-ar-route"><span className="cg-ar-distance">1.2 <small>KM</small></span><span className="cg-ar-direction">SIGUE LA RUTA <b>↗</b></span></div><div className="cg-ar-marker"><span className="cg-ar-marker-ring"/><MapPin size={25} fill="#c7f36b"/></div><div className="cg-ar-bottom"><strong>Tu ciudad. Tu camino.</strong><span>Experiencia visual de navegación · Cotuí, RD</span></div></div>
   </div>
  </div>}
 </main>;
}
