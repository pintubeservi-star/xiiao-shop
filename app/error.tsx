"use client";
import {useEffect} from "react";
export default function ErrorPage({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
 useEffect(()=>{console.error("Cotuí Go client error:",error);},[error]);
 return <main className="grid min-h-[100svh] place-items-center bg-[#f3f6f2] p-6 text-[#172820]">
  <section className="w-full max-w-md rounded-3xl border border-[#dce5df] bg-white p-6 shadow-xl">
   <div className="mb-3 text-xs font-black uppercase tracking-widest text-red-600">Cotuí Go · Error de aplicación</div>
   <h1 className="text-2xl font-black">No pudimos abrir la aplicación</h1>
   <p className="mt-2 text-sm leading-6 text-slate-600">El sistema detectó un error y detuvo esta pantalla para evitar mostrar información incorrecta.</p>
   <div className="mt-4 rounded-xl bg-slate-100 p-3"><p className="text-[10px] font-bold uppercase text-slate-500">Detalle técnico</p><p className="mt-1 break-words font-mono text-xs text-slate-800">{error?.message||"Error desconocido"}</p>{error?.digest&&<p className="mt-2 font-mono text-[10px] text-slate-500">Código: {error.digest}</p>}</div>
   <button onClick={()=>reset()} className="mt-5 w-full rounded-xl bg-[#14251d] px-4 py-3 font-bold text-white">Intentar nuevamente</button>
   <button onClick={()=>location.reload()} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-bold text-slate-700">Recargar Cotuí Go</button>
  </section>
 </main>;
}