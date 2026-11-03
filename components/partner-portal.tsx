"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";

type Kind = "affiliate" | "merchant";
type AppRow = { id:string; status:string; display_name:string; review_note:string|null };
type Product = { id:string; name:string; slug:string; price_dop:number; stock:number; status:string; merchant_id:string|null };
type LinkRow = { id:string; code:string; product_id:string; products?:{name:string}|null };

const money=(n:number)=>"RD$ "+Number(n||0).toLocaleString("es-DO");
const input="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm outline-none focus:border-black";

export default function PartnerPortal({kind}:{kind:Kind}) {
 const affiliate=kind==="affiliate";
 const [user,setUser]=useState<{id:string;email:string}|null>(null);
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[loading,setLoading]=useState(true);
 const [mode,setMode]=useState<"login"|"register">("register");
 const [auth,setAuth]=useState({email:"",password:"",name:"",phone:""});
 const [application,setApplication]=useState<AppRow|null>(null);
 const [profile,setProfile]=useState<any>(null);
 const [products,setProducts]=useState<Product[]>([]);
 const [links,setLinks]=useState<LinkRow[]>([]);
 const [commissions,setCommissions]=useState<any[]>([]),[payouts,setPayouts]=useState<any[]>([]);
 const [balance,setBalance]=useState(0);
 const [draft,setDraft]=useState({name:"",description:"",category:"General",price:"",stock:"0",image:""});
 const [payout,setPayout]=useState({amount:"",method:"bank_transfer",holder:"",account:"",bank:""});
 const [showPayout,setShowPayout]=useState(false);

 const load=useCallback(async()=>{
  const s=getSupabase();const {data:{user:u}}=await s.auth.getUser();
  if(!u){setUser(null);setLoading(false);return;}
  setUser({id:u.id,email:u.email||""});
  const {data:apps}=await s.from("partner_applications").select("id,status,display_name,review_note").eq("user_id",u.id).eq("application_type",kind).maybeSingle();
  setApplication(apps||null);
  if(apps?.status==="approved"){
   if(affiliate){
    const {data:a}=await s.from("affiliate_profiles").select("*").eq("user_id",u.id).maybeSingle();setProfile(a||null);
    if(a){
     const [l,c,led,p,po]=await Promise.all([
      s.from("affiliate_links").select("id,code,product_id,products(name)").eq("affiliate_id",a.id).order("created_at",{ascending:false}),
      s.from("commissions").select("id,amount_dop,status,created_at").eq("affiliate_id",a.id).order("created_at",{ascending:false}).limit(100),
      s.from("ledger_entries").select("amount_dop,entry_type").eq("affiliate_id",a.id),
      s.from("products").select("id,name,slug,price_dop,stock,status,merchant_id").eq("status","published").gt("stock",0).order("name")
     ]);
     setLinks((l.data||[]) as LinkRow[]);setCommissions(c.data||[]);setProducts(p.data||[]);
     setBalance((led.data||[]).reduce((n:any,x:any)=>n+Number(x.amount_dop),0));
    }
   }else{
    const {data:m}=await s.from("merchants").select("*").eq("owner_id",u.id).maybeSingle();setProfile(m||null);
    if(m){const {data:p}=await s.from("products").select("id,name,slug,price_dop,stock,status,merchant_id").eq("merchant_id",m.id).order("created_at",{ascending:false});setProducts(p||[]);}
   }
  }
  setLoading(false);
 },[kind,affiliate]);

 useEffect(()=>{void load();},[load]);

 async function authenticate(e:React.FormEvent){
  e.preventDefault();setBusy(true);setNotice("");
  try{const s=getSupabase();if(mode==="register"){
   const {data,error}=await s.auth.signUp({email:auth.email,password:auth.password,options:{data:{full_name:auth.name,phone:auth.phone}}});
   if(error)throw error;
   if(!data.session){setNotice("Cuenta creada. Revisa tu correo y confirma la dirección antes de iniciar sesión.");}
   else{setNotice("Cuenta creada. Ya puedes completar tu solicitud.");await load();}
  }else{const {error}=await s.auth.signInWithPassword({email:auth.email,password:auth.password});if(error)throw error;await load();}
  }catch(e){setNotice(e instanceof Error?e.message:"No se pudo completar el acceso.");}finally{setBusy(false);}
 }

 async function apply(e:React.FormEvent){
  e.preventDefault();setBusy(true);setNotice("");
  try{const {error}=await getSupabase().rpc("submit_partner_application",{p_type:kind,p_display_name:auth.name||user?.email||"",p_phone:auth.phone,p_social_url:null,p_description:affiliate?"Solicitud para participar como creador afiliado":"Solicitud para vender productos en XiiAO Shop"});if(error)throw error;setNotice("Solicitud recibida. Te notificaremos cuando sea revisada.");await load();}
  catch(e){setNotice(e instanceof Error?e.message:"No se pudo enviar la solicitud.");}finally{setBusy(false);}
 }

 async function createLink(product:Product){
  setBusy(true);try{const code="XIAO-"+crypto.randomUUID().replaceAll("-","").slice(0,10).toUpperCase();const {error}=await getSupabase().from("affiliate_links").insert({affiliate_id:profile.id,product_id:product.id,code});if(error)throw error;setNotice("Enlace creado correctamente.");await load();}
  catch(e){setNotice(e instanceof Error?e.message:"No se pudo crear el enlace.");}finally{setBusy(false);}
 }

 async function createProduct(e:React.FormEvent){
  e.preventDefault();if(!profile)return;setBusy(true);try{
   const {error}=await getSupabase().from("products").insert({merchant_id:profile.id,created_by:user?.id,name:draft.name.trim(),slug:draft.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")+"-"+crypto.randomUUID().slice(0,5),description:draft.description,category:draft.category,price_dop:Number(draft.price),stock:Number(draft.stock),image_urls:draft.image.trim()?[draft.image.trim()]:[],status:"draft",commission_type:"percentage",commission_value:0});
   if(error)throw error;setDraft({name:"",description:"",category:"General",price:"",stock:"0",image:""});setNotice("Producto guardado como borrador. El equipo de XiiAO revisará su publicación.");await load();
  }catch(e){setNotice(e instanceof Error?e.message:"No se pudo guardar el producto.");}finally{setBusy(false);}
 }

 async function requestPayout(e:React.FormEvent){
  e.preventDefault();setBusy(true);try{
   const {error}=await getSupabase().rpc("request_affiliate_payout",{p_amount:Number(payout.amount),p_method:payout.method,p_destination:{holder:payout.holder,account:payout.account,bank:payout.bank}});
   if(error)throw error;setNotice("Solicitud de retiro registrada. El saldo quedó reservado mientras se revisa.");setShowPayout(false);await load();
  }catch(e){setNotice(e instanceof Error?e.message:"No se pudo solicitar el retiro.");}finally{setBusy(false);}
 }

 async function logout(){await getSupabase().auth.signOut();setUser(null);setApplication(null);setProfile(null);setNotice("Sesión cerrada.");}
 const title=affiliate?"Programa de creadores":"Portal para comercios";
 const intro=affiliate?"Comparte productos, crea enlaces y consulta tus comisiones.":"Solicita tu espacio comercial, publica productos y administra tu catálogo.";

 return <main className="min-h-screen bg-[#f7f7f5] text-[#191a17]">
  <header className="border-b bg-white px-5 py-4"><div className="mx-auto flex max-w-6xl items-center justify-between"><Link href="/" className="text-lg font-black">XiiAO Shop</Link><Link href="/" className="text-sm text-black/50 underline">Volver a la tienda</Link></div></header>
  <section className="mx-auto max-w-6xl px-5 py-10 md:py-14">
   <p className="text-xs font-black uppercase tracking-[.2em] text-black/40">{affiliate?"Área de creadores":"Área de vendedores"}</p>
   <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">{title}</h1>
   <p className="mt-3 max-w-2xl text-black/55">{intro}</p>
   {notice&&<p className="mt-5 rounded-xl bg-white p-4 text-sm shadow-sm">{notice}</p>}
   {loading?<div className="mt-8 rounded-2xl bg-white p-8">Cargando tu espacio…</div>:!user?
    <div className="mt-8 grid gap-8 md:grid-cols-[1fr_420px]">
     <div className="rounded-3xl bg-[#c8f169] p-8"><h2 className="text-2xl font-black">Un espacio hecho para crecer</h2><p className="mt-3 max-w-md text-sm leading-6 text-black/65">{affiliate?"Tu actividad, tus enlaces y tus comisiones en un solo lugar.":"Administra tus productos y recibe pedidos desde XiiAO Shop."}</p><ul className="mt-6 space-y-3 text-sm font-semibold"><li>✓ Acceso con cuenta personal</li><li>✓ Solicitud revisada por el equipo</li><li>✓ Panel conectado a tu actividad</li></ul></div>
     <form onSubmit={authenticate} className="space-y-3 rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex gap-2"><button type="button" onClick={()=>setMode("register")} className={mode==="register"?"rounded-full bg-black px-4 py-2 text-xs font-bold text-white":"rounded-full border px-4 py-2 text-xs"}>Crear cuenta</button><button type="button" onClick={()=>setMode("login")} className={mode==="login"?"rounded-full bg-black px-4 py-2 text-xs font-bold text-white":"rounded-full border px-4 py-2 text-xs"}>Iniciar sesión</button></div>
      {mode==="register"&&<><label className="block text-sm font-semibold">Nombre completo<input required value={auth.name} onChange={e=>setAuth(a=>({...a,name:e.target.value}))} className={input}/></label><label className="block text-sm font-semibold">Teléfono<input required value={auth.phone} onChange={e=>setAuth(a=>({...a,phone:e.target.value}))} className={input}/></label></>}
      <label className="block text-sm font-semibold">Correo electrónico<input required type="email" value={auth.email} onChange={e=>setAuth(a=>({...a,email:e.target.value}))} className={input}/></label>
      <label className="block text-sm font-semibold">Contraseña<input required minLength={8} type="password" value={auth.password} onChange={e=>setAuth(a=>({...a,password:e.target.value}))} className={input}/></label>
      <button disabled={busy} className="w-full rounded-xl bg-black py-3 text-sm font-bold text-white disabled:opacity-50">{busy?"Procesando…":mode==="register"?"Crear cuenta":"Entrar"}</button>
      <p className="text-xs leading-5 text-black/40">Tu cuenta se crea de forma segura. Si se requiere confirmar el correo, recibirás un mensaje de verificación.</p>
     </form>
    </div>
   :!application||application.status!=="approved"?
    <div className="mt-8 max-w-2xl rounded-3xl bg-white p-7 shadow-sm">
     {application?<><p className="text-xs font-black uppercase tracking-widest text-black/40">Estado de solicitud</p><h2 className="mt-2 text-2xl font-black">{application.status==="pending"?"En revisión":"Solicitud no aprobada"}</h2><p className="mt-2 text-sm text-black/55">{application.review_note||"El equipo de XiiAO revisará tus datos."}</p></>:<><h2 className="text-2xl font-black">Completa tu solicitud</h2><p className="mt-2 text-sm text-black/55">Necesitamos validar tu información antes de activar el panel.</p><form onSubmit={apply} className="mt-5 grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold">Nombre / negocio<input required value={auth.name} onChange={e=>setAuth(a=>({...a,name:e.target.value}))} className={input}/></label><label className="text-sm font-semibold">Teléfono<input required value={auth.phone} onChange={e=>setAuth(a=>({...a,phone:e.target.value}))} className={input}/></label><button disabled={busy} className="rounded-xl bg-black px-5 py-3 text-sm font-bold text-white sm:col-span-2">{busy?"Enviando…":"Enviar solicitud"}</button></form></>}
     <button onClick={logout} className="mt-5 text-xs underline text-black/50">Cerrar sesión</button>
    </div>
   :affiliate?
    <div className="mt-8 space-y-6">
     <div className="grid gap-4 sm:grid-cols-3"><Metric label="Código de creador" value={profile?.public_code||"—"}/><Metric label="Saldo disponible" value={money(balance)}/><Metric label="Enlaces activos" value={String(links.length)}/></div>
     <section className="rounded-3xl bg-white p-6"><h2 className="text-xl font-black">Crear enlaces de productos</h2><p className="mt-1 text-sm text-black/50">Comparte el enlace y las compras que cumplan las condiciones quedarán atribuidas a tu cuenta.</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{products.map(p=><div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border p-3"><div className="min-w-0"><b className="block truncate text-sm">{p.name}</b><span className="text-xs text-black/45">{money(p.price_dop)}</span></div><button disabled={busy||links.some(l=>l.product_id===p.id)} onClick={()=>createLink(p)} className="rounded-lg bg-black px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{links.some(l=>l.product_id===p.id)?"Creado":"Crear enlace"}</button></div>)}</div></section>
     <section className="rounded-3xl bg-white p-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-black">Mis enlaces</h2><button onClick={()=>setShowPayout(v=>!v)} className="rounded-full bg-[#c8f169] px-4 py-2 text-xs font-black">Solicitar retiro</button></div>
      {links.map(l=><div key={l.id} className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-gray-50 p-3"><div><b className="text-sm">{l.products?.name||"Producto"}</b><p className="text-xs text-black/45">Código: {l.code}</p><p className="text-xs text-black/45">xiiao-shop.vercel.app/?ref={l.code}</p></div><button onClick={()=>navigator.clipboard.writeText(window.location.origin+"/?ref="+l.code)} className="rounded-lg border px-3 py-2 text-xs">Copiar enlace</button></div>)}
      {showPayout&&<form onSubmit={requestPayout} className="mt-5 grid gap-3 rounded-2xl border p-4 sm:grid-cols-2"><label className="text-sm font-semibold">Monto RD$<input required type="number" min="1" step="0.01" value={payout.amount} onChange={e=>setPayout(p=>({...p,amount:e.target.value}))} className={input}/></label><label className="text-sm font-semibold">Método<select value={payout.method} onChange={e=>setPayout(p=>({...p,method:e.target.value}))} className={input}><option value="bank_transfer">Transferencia bancaria</option><option value="mobile_wallet">Billetera móvil</option></select></label><label className="text-sm font-semibold">Titular<input required value={payout.holder} onChange={e=>setPayout(p=>({...p,holder:e.target.value}))} className={input}/></label><label className="text-sm font-semibold">Cuenta / teléfono<input required value={payout.account} onChange={e=>setPayout(p=>({...p,account:e.target.value}))} className={input}/></label><label className="text-sm font-semibold sm:col-span-2">Banco / entidad<input value={payout.bank} onChange={e=>setPayout(p=>({...p,bank:e.target.value}))} className={input}/></label><button disabled={busy} className="rounded-xl bg-black py-3 text-sm font-bold text-white sm:col-span-2">Enviar solicitud</button></form>}
     </section>
     <section className="rounded-3xl bg-white p-6"><h2 className="text-xl font-black">Comisiones</h2>{commissions.length?commissions.map(c=><div key={c.id} className="flex justify-between border-b py-3 text-sm"><span>{c.status}</span><b>{money(c.amount_dop)}</b></div>):<p className="mt-3 text-sm text-black/45">Todavía no hay comisiones registradas.</p>}</section>
    </div>
   :<div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
    <section className="rounded-3xl bg-white p-6"><h2 className="text-xl font-black">Tus productos</h2>{products.map(p=><div key={p.id} className="flex items-center justify-between border-b py-3"><div><b className="text-sm">{p.name}</b><p className="text-xs text-black/45">{money(p.price_dop)} · Stock {p.stock} · {p.status}</p></div><span className="text-xs">{p.status==="published"?"Publicado":"En revisión"}</span></div>)}</section>
    <form onSubmit={createProduct} className="h-fit space-y-3 rounded-3xl bg-white p-6"><h2 className="text-xl font-black">Agregar producto</h2><label className="block text-sm font-semibold">Nombre<input required value={draft.name} onChange={e=>setDraft(d=>({...d,name:e.target.value}))} className={input}/></label><label className="block text-sm font-semibold">Descripción<textarea value={draft.description} onChange={e=>setDraft(d=>({...d,description:e.target.value}))} className={input}/></label><label className="block text-sm font-semibold">URL de fotografía<input type="url" value={draft.image} onChange={e=>setDraft(d=>({...d,image:e.target.value}))} placeholder="https://..." className={input}/></label><div className="grid grid-cols-2 gap-3"><label className="text-sm font-semibold">Precio RD$<input required type="number" min="1" value={draft.price} onChange={e=>setDraft(d=>({...d,price:e.target.value}))} className={input}/></label><label className="text-sm font-semibold">Inventario<input required type="number" min="0" value={draft.stock} onChange={e=>setDraft(d=>({...d,stock:e.target.value}))} className={input}/></label></div><button disabled={busy} className="w-full rounded-xl bg-black py-3 text-sm font-bold text-white">Guardar borrador</button></form>
   </div>}
   {user&&<button onClick={logout} className="mt-8 text-xs underline text-black/45">Cerrar sesión</button>}
  </section>
 </main>;
}

function Metric({label,value}:{label:string;value:string}){return <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-widest text-black/40">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>}
