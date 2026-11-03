"use client";
import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
import {getSupabase} from "@/lib/supabase/client";
const money=(n:number)=>"RD$ "+Number(n||0).toLocaleString("es-DO");
type Order={id:string;order_number:number;status:string;total_dop:number;created_at:string;delivered_at:string|null;carrier_name:string|null;tracking_number:string|null;tracking_url:string|null;estimated_delivery_at:string|null;shipping_notes:string|null};
export default function AccountPage(){
 const [user,setUser]=useState<{id:string;email:string}|null>(null),[orders,setOrders]=useState<Order[]>([]),[returns,setReturns]=useState<any[]>([]);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 const [mode,setMode]=useState<"login"|"register">("login");
 const [form,setForm]=useState({name:"",email:"",password:"",phone:""});
 const [request,setRequest]=useState({order_id:"",reason:"Producto defectuoso",details:""});
 const load=useCallback(async()=>{
  const s=getSupabase();const {data:{user:u}}=await s.auth.getUser();
  if(!u){setUser(null);setOrders([]);setReturns([]);setLoading(false);return;}
  setUser({id:u.id,email:u.email||""});
  const [o,r]=await Promise.all([
   s.from("orders").select("id,order_number,status,total_dop,created_at,delivered_at,carrier_name,tracking_number,tracking_url,estimated_delivery_at,shipping_notes").eq("customer_id",u.id).order("created_at",{ascending:false}).limit(100),
   s.from("return_requests").select("id,order_id,reason,details,status,created_at").eq("customer_id",u.id).order("created_at",{ascending:false})
  ]);
  if(o.error)throw o.error;if(r.error)throw r.error;setOrders(o.data||[]);setReturns(r.data||[]);setLoading(false);
 },[]);
 useEffect(()=>{void load().catch(e=>{setNotice(e instanceof Error?e.message:"No se pudo cargar tu cuenta.");setLoading(false);});},[load]);
 async function authenticate(e:React.FormEvent){
  e.preventDefault();setBusy(true);setNotice("");
  try{const s=getSupabase();if(mode==="register"){
   const {data,error}=await s.auth.signUp({email:form.email,password:form.password,options:{data:{full_name:form.name,phone:form.phone}}});if(error)throw error;
   if(!data.session)setNotice("Cuenta creada. Confirma tu correo y luego inicia sesión.");else{setNotice("Cuenta creada.");await load();}
  }else{const {error}=await s.auth.signInWithPassword({email:form.email,password:form.password});if(error)throw error;await load();}
  }catch(e){setNotice(e instanceof Error?e.message:"No se pudo completar el acceso.");}finally{setBusy(false);}
 }
 async function submitReturn(e:React.FormEvent){
  e.preventDefault();if(!user)return;setBusy(true);
  try{const {error}=await getSupabase().from("return_requests").insert({order_id:request.order_id,customer_id:user.id,reason:request.reason,details:request.details});if(error)throw error;setNotice("Solicitud enviada. Nuestro equipo la revisará.");setRequest({order_id:"",reason:"Producto defectuoso",details:""});await load();}
  catch(e){setNotice(e instanceof Error?e.message:"No se pudo enviar la solicitud.");}finally{setBusy(false);}
 }
 async function logout(){await getSupabase().auth.signOut();setUser(null);setOrders([]);setReturns([]);setNotice("Sesión cerrada.");}
 const delivered=orders.filter(o=>o.status==="delivered"&&!returns.some(r=>r.order_id===o.id));
 return <main className="min-h-screen bg-[#f7f7f5] text-[#191a17]"><header className="border-b bg-white px-5 py-4"><div className="mx-auto flex max-w-5xl items-center justify-between"><Link href="/" className="text-lg font-black">XiiAO Shop</Link><Link href="/" className="text-sm underline text-black/50">Volver a la tienda</Link></div></header>
 <div className="mx-auto max-w-5xl px-5 py-10"><h1 className="text-4xl font-black">Mi cuenta</h1><p className="mt-2 text-sm text-black/50">Consulta tus pedidos y solicita una devolución cuando corresponda.</p>{notice&&<p className="mt-5 rounded-xl bg-white p-4 text-sm">{notice}</p>}
 {loading?<div className="mt-8 rounded-2xl bg-white p-8">Cargando…</div>:!user?
 <div className="mt-8 grid gap-8 md:grid-cols-[1fr_420px]"><div className="rounded-3xl bg-[#c8f169] p-8"><h2 className="text-2xl font-black">Tus compras, en un solo lugar</h2><p className="mt-3 text-sm leading-6 text-black/60">Crea una cuenta para consultar tus pedidos y gestionar solicitudes de devolución. También puedes comprar como invitado.</p></div>
 <form onSubmit={authenticate} className="space-y-3 rounded-3xl bg-white p-6"><div className="flex gap-2"><button type="button" onClick={()=>setMode("login")} className={mode==="login"?"rounded-full bg-black px-4 py-2 text-xs font-bold text-white":"rounded-full border px-4 py-2 text-xs"}>Iniciar sesión</button><button type="button" onClick={()=>setMode("register")} className={mode==="register"?"rounded-full bg-black px-4 py-2 text-xs font-bold text-white":"rounded-full border px-4 py-2 text-xs"}>Crear cuenta</button></div>
 {mode==="register"&&<><label className="block text-sm font-semibold">Nombre<input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="mt-1 w-full rounded-xl border p-3 font-normal"/></label><label className="block text-sm font-semibold">Teléfono<input required value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} className="mt-1 w-full rounded-xl border p-3 font-normal"/></label></>}
 <label className="block text-sm font-semibold">Correo<input required type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} className="mt-1 w-full rounded-xl border p-3 font-normal"/></label><label className="block text-sm font-semibold">Contraseña<input required minLength={8} type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} className="mt-1 w-full rounded-xl border p-3 font-normal"/></label><button disabled={busy} className="w-full rounded-xl bg-black py-3 text-sm font-bold text-white">{busy?"Procesando…":mode==="register"?"Crear cuenta":"Entrar"}</button></form></div>
 :<><div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4"><div><b>{user.email}</b><p className="text-xs text-black/45">Cuenta de cliente</p></div><button onClick={logout} className="rounded-full border px-4 py-2 text-xs">Cerrar sesión</button></div>
 <section className="mt-8"><h2 className="text-2xl font-black">Mis pedidos</h2><div className="mt-4 space-y-3">{orders.length?orders.map(o=><article key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-5"><div><b>Pedido #{o.order_number}</b><p className="text-xs text-black/45">{new Date(o.created_at).toLocaleString("es-DO")} · {({pending:"Pendiente",confirmed:"Confirmado",processing:"Preparando",shipped:"En camino",delivered:"Entregado",cancelled:"Cancelado",returned:"Devuelto",refunded:"Reembolsado"} as Record<string,string>)[o.status]||o.status}</p>{o.carrier_name&&<p className="mt-1 text-xs text-black/55">Transportista: {o.carrier_name}</p>}{o.tracking_number&&<p className="mt-1 text-xs text-black/55">Número de rastreo: {o.tracking_number}</p>}{o.tracking_url&&<a href={o.tracking_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-bold underline">Rastrear paquete</a>}{o.estimated_delivery_at&&<p className="mt-1 text-xs text-black/45">Entrega estimada: {new Date(o.estimated_delivery_at).toLocaleDateString("es-DO")}</p>}{o.shipping_notes&&<p className="mt-1 text-xs text-black/45">{o.shipping_notes}</p>}</div><b>{money(o.total_dop)}</b></article>):<div className="rounded-2xl bg-white p-8 text-sm text-black/45">Todavía no hay pedidos vinculados a esta cuenta. Los próximos pedidos que realices mientras estés conectado aparecerán aquí.</div>}</div></section>
 <section className="mt-8 grid gap-6 md:grid-cols-2"><form onSubmit={submitReturn} className="space-y-3 rounded-3xl bg-white p-6"><h2 className="text-xl font-black">Solicitar devolución</h2><p className="text-xs text-black/45">Disponible para pedidos entregados asociados a esta cuenta.</p><label className="block text-sm font-semibold">Pedido<select required value={request.order_id} onChange={e=>setRequest(r=>({...r,order_id:e.target.value}))} className="mt-1 w-full rounded-xl border p-3 font-normal"><option value="">Selecciona un pedido</option>{delivered.map(o=><option key={o.id} value={o.id}>#{o.order_number} · {money(o.total_dop)}</option>)}</select></label><label className="block text-sm font-semibold">Motivo<select value={request.reason} onChange={e=>setRequest(r=>({...r,reason:e.target.value}))} className="mt-1 w-full rounded-xl border p-3 font-normal"><option>Producto defectuoso</option><option>Producto incorrecto</option><option>Producto incompleto</option><option>Otro motivo</option></select></label><label className="block text-sm font-semibold">Detalles<textarea value={request.details} onChange={e=>setRequest(r=>({...r,details:e.target.value}))} className="mt-1 w-full rounded-xl border p-3 font-normal"/></label><button disabled={busy||!delivered.length} className="w-full rounded-xl bg-black py-3 text-sm font-bold text-white disabled:opacity-40">Enviar solicitud</button></form>
 <div className="rounded-3xl bg-white p-6"><h2 className="text-xl font-black">Mis devoluciones</h2>{returns.length?returns.map(r=><div key={r.id} className="border-b py-3 text-sm"><b>{r.reason}</b><p className="text-xs text-black/45">Pedido {r.order_id.slice(0,8)} · {r.status}</p>{r.details&&<p className="mt-1 text-xs text-black/55">{r.details}</p>}</div>):<p className="mt-3 text-sm text-black/45">No tienes solicitudes.</p>}</div></section></>}
 </div></main>;
}
