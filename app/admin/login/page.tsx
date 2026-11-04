"use client";
import { useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";

export default function AdminLogin() {
  const [mode,setMode]=useState<"login"|"signup">("login");
  const [email,setEmail]=useState("pintubeservi@gmail.com");
  const [password,setPassword]=useState("");
  const [name,setName]=useState("");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  async function submit(e:React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      const supabase=getSupabase();
      if(mode==="signup") {
        const {data,error}=await supabase.auth.signUp({email,password,options:{data:{full_name:name}}});
        if(error) throw error;
        setMessage(data.session ? "Cuenta creada. Confirma el correo y el acceso de propietario se habilitará automáticamente al verificarlo." : "Revisa tu correo y confirma la cuenta. Al verificar se activarán los permisos del propietario.");
      } else {
        const {error}=await supabase.auth.signInWithPassword({email,password});
        if(error) throw error;
        window.location.href="/admin/movilidad";
      }
    } catch(err) { setMessage(err instanceof Error?err.message:"No se pudo completar la solicitud."); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-[#f5f6f1] flex items-center justify-center p-5"><section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl shadow-black/5">
    <Link href="/" className="text-sm text-gray-500">← Volver a Cotuí Go</Link>
    <div className="mt-6 mb-7"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-lime-400 text-xl font-black">G</div><h1 className="mt-4 text-2xl font-black">Cotuí Go</h1><p className="mt-1 text-sm text-gray-500">Acceso seguro al centro de administración</p></div>
    <div className="mb-5 grid grid-cols-2 rounded-xl bg-gray-100 p-1"><button onClick={()=>setMode("login")} className={mode==="login"?"rounded-lg bg-white py-2 text-sm font-bold shadow":"py-2 text-sm text-gray-500"}>Iniciar sesión</button><button onClick={()=>setMode("signup")} className={mode==="signup"?"rounded-lg bg-white py-2 text-sm font-bold shadow":"py-2 text-sm text-gray-500"}>Crear cuenta</button></div>
    <form onSubmit={submit} className="space-y-4">
      {mode==="signup"&&<label className="block text-sm font-semibold">Nombre<input required value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full rounded-xl border p-3 font-normal"/></label>}
      <label className="block text-sm font-semibold">Correo<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full rounded-xl border p-3 font-normal"/></label>
      <label className="block text-sm font-semibold">Contraseña<input type="password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full rounded-xl border p-3 font-normal" placeholder="Mínimo 8 caracteres"/></label>
      <button disabled={busy} className="w-full rounded-xl bg-[#191a17] py-3 font-bold text-white disabled:opacity-50">{busy?"Procesando…":mode==="login"?"Entrar al panel":"Crear cuenta"}</button>
    </form>
    {message&&<p className="mt-4 rounded-xl bg-gray-50 p-3 text-sm">{message}</p>}
    <p className="mt-6 text-xs leading-5 text-gray-400">El acceso de propietario se activa únicamente para el correo principal después de verificarlo.</p>
  </section></main>;
}
