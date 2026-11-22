"use client";
import { useEffect, useState } from "react";
declare global { interface Window { fbq?: (...args:any[])=>void; _fbq?: (...args:any[])=>void; } }
const CONSENT_KEY="xiiao_meta_consent";
export function trackMetaEvent(name:string,data?:Record<string,unknown>){if(typeof window==="undefined"||window.localStorage.getItem(CONSENT_KEY)!=="accepted"||!window.fbq)return;window.fbq("track",name,data);}
export function MetaPixel(){
 const [show,setShow]=useState(false);
 useEffect(()=>{const id=process.env.NEXT_PUBLIC_META_PIXEL_ID;if(!id)return;const consent=window.localStorage.getItem(CONSENT_KEY);if(consent==="accepted"){initialize(id);return;}if(consent!=="declined")setShow(true);},[]);
 function initialize(id:string){if(window.fbq)return;const fbq=function(this:Window,...args:any[]){(fbq as any).callMethod?(fbq as any).callMethod.apply(fbq,args):(fbq as any).queue.push(args);};(fbq as any).queue=[];(fbq as any).loaded=true;(fbq as any).version="2.0";window.fbq=fbq as any;window._fbq=fbq as any;const script=document.createElement("script");script.async=true;script.src="https://connect.facebook.net/en_US/fbevents.js";document.head.appendChild(script);const pixel=window.fbq;if(pixel){pixel("init",id);pixel("track","PageView");}}
 const accept=()=>{const id=process.env.NEXT_PUBLIC_META_PIXEL_ID;window.localStorage.setItem(CONSENT_KEY,"accepted");setShow(false);if(id)initialize(id);};
 const decline=()=>{window.localStorage.setItem(CONSENT_KEY,"declined");setShow(false);};
 if(!show)return null;
 return <div className="fixed bottom-3 left-3 right-3 z-[100] mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4 shadow-2xl sm:flex-row sm:items-center sm:justify-between"><div><b className="text-sm">Tu privacidad importa</b><p className="mt-1 text-xs leading-5 text-gray-600">Con tu permiso usamos tecnologías de Meta para medir anuncios y mostrarte productos relevantes. Puedes rechazar o aceptar.</p></div><div className="flex shrink-0 gap-2"><button onClick={decline} className="rounded-full border px-4 py-2 text-xs font-semibold">Rechazar</button><button onClick={accept} className="rounded-full bg-[#191a17] px-4 py-2 text-xs font-bold text-white">Aceptar</button></div></div>;
}