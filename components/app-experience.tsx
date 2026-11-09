"use client";
import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";
import {Download,Volume2,VolumeX,X,Smartphone,Moon,Sun} from "lucide-react";
import {getSupabase} from "@/lib/supabase/client";
type InstallEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:"accepted"|"dismissed"}>};
export default function AppExperience(){
 const path=usePathname();
 const [installEvent,setInstallEvent]=useState<InstallEvent|null>(null),[installed,setInstalled]=useState(false),[iosHelp,setIosHelp]=useState(false),[sound,setSound]=useState(false),[dark,setDark]=useState(false);
 const role=path==="/conductores"?"driver":path==="/admin/movilidad"?"admin":path==="/"?"client":null;
 useEffect(()=>{
  const saved=localStorage.getItem("cg-ui-sound")==="on";setSound(saved);const darkSaved=localStorage.getItem("cg-ui-theme")==="dark";setDark(darkSaved);document.documentElement.dataset.theme=darkSaved?"dark":"light";
  const onPrompt=(e:Event)=>{e.preventDefault();setInstallEvent(e as InstallEvent);};
  const onInstalled=()=>{setInstalled(true);setInstallEvent(null);};
  window.addEventListener("beforeinstallprompt",onPrompt);window.addEventListener("appinstalled",onInstalled);
  if(window.matchMedia("(display-mode: standalone)").matches||(navigator as any).standalone)setInstalled(true);
  return()=>{window.removeEventListener("beforeinstallprompt",onPrompt);window.removeEventListener("appinstalled",onInstalled);};
 },[]);
 useEffect(()=>{
  const click=(e:MouseEvent)=>{if(!sound)return;const target=e.target as HTMLElement|null;if(!target?.closest("button,a,[role=button]"))return;
   try{const AudioCtx=window.AudioContext||(window as any).webkitAudioContext;if(!AudioCtx)return;const ctx=new AudioCtx();const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type="sine";osc.frequency.setValueAtTime(660,ctx.currentTime);osc.frequency.exponentialRampToValueAtTime(880,ctx.currentTime+.045);gain.gain.setValueAtTime(.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.035,ctx.currentTime+.008);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.075);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.08);osc.onended=()=>ctx.close();}catch{}
  };
  document.addEventListener("click",click);return()=>document.removeEventListener("click",click);
 },[sound]);
 if(!role)return null;
 const toggleSound=()=>setSound(v=>{localStorage.setItem("cg-ui-sound",v?"off":"on");return !v;});
 const toggleTheme=()=>setDark(v=>{const next=!v;localStorage.setItem("cg-ui-theme",next?"dark":"light");document.documentElement.dataset.theme=next?"dark":"light";return next;});
 async function install(){if(installEvent){await installEvent.prompt();const choice=await installEvent.userChoice;if(choice.outcome==="accepted")setInstalled(true);setInstallEvent(null);}else setIosHelp(true);}
 return <><div className="cg-app-tools" aria-label="Herramientas de la aplicación">
  <button type="button" className="cg-tool-sound" onClick={toggleTheme} aria-label={dark?"Activar tema claro":"Activar tema oscuro"} title={dark?"Tema claro":"Tema oscuro"}>{dark?<Sun size={17}/>:<Moon size={17}/>}</button>
  <button type="button" className="cg-tool-sound" onClick={toggleSound} aria-label={sound?"Desactivar sonidos":"Activar sonidos"} title={sound?"Desactivar sonidos":"Activar sonidos"}>{sound?<Volume2 size={17}/>:<VolumeX size={17}/>}</button>
  {!installed&&<button type="button" className="cg-tool-install" onClick={install}><Download size={16}/><span>Instalar {role==="driver"?"Conductor":role==="admin"?"Admin":"Cotuí Go"}</span></button>}
 </div>
 {iosHelp&&<div className="cg-install-overlay" role="dialog" aria-modal="true"><div className="cg-install-card"><button className="cg-install-close" onClick={()=>setIosHelp(false)} aria-label="Cerrar"><X size={18}/></button><div className="grid h-12 w-12 place-items-center rounded-2xl bg-lime-300 text-[#14251d]"><Smartphone size={24}/></div><h3>Instala Cotuí Go</h3><p>En iPhone o iPad, toca <b>Compartir</b> en Safari y luego <b>Añadir a pantalla de inicio</b>. En Android, abre el menú del navegador y selecciona <b>Instalar aplicación</b> o <b>Añadir a pantalla de inicio</b>.</p><button onClick={()=>setIosHelp(false)}>Entendido</button></div></div>}
 </>;
}
