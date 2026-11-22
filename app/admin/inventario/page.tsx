"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";

type Product = { id:string; name:string; slug:string; category:string; price_dop:number; stock:number; status:"draft"|"published"|"paused"|"archived" };
type Cost = { product_id:string; unit_cost_dop:number };
type Movement = { id:string; product_id:string; quantity_delta:number; movement_type:string; note:string|null; created_at:string };
const money=(n:number)=>"RD$ "+Number(n||0).toLocaleString("es-DO",{maximumFractionDigits:2});
const slugify=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");

export default function InventoryPage(){
 const [products,setProducts]=useState<Product[]>([]);
 const [costs,setCosts]=useState<Record<string,number>>({});
 const [movements,setMovements]=useState<Movement[]>([]);
 const [allowed,setAllowed]=useState(false),[ready,setReady]=useState(false),[notice,setNotice]=useState("");
 const [tab,setTab]=useState<"inventory"|"profit"|"history"|"new">("inventory");
 const [busy,setBusy]=useState(false);
 const [name,setName]=useState(""),[category,setCategory]=useState("Audio y tecnología"),[price,setPrice]=useState(""),[cost,setCost]=useState(""),[stock,setStock]=useState("0"),[description,setDescription]=useState("");
 const [adjust,setAdjust]=useState<Record<string,string>>({});
 const [note,setNote]=useState<Record<string,string>>({});
 const [sales,setSales]=useState<any[]>([]);

 const load=useCallback(async()=>{
  const s=getSupabase();
  const {data:{user}}=await s.auth.getUser();
  if(!user){setAllowed(false);setReady(true);return;}
  const {data:profile,error:profileError}=await s.from("profiles").select("role").eq("id",user.id).maybeSingle();
  if(profileError||profile?.role!=="admin"){setAllowed(false);setReady(true);return;}
  setAllowed(true);
  const [p,c,m,o]=await Promise.all([
   s.from("products").select("id,name,slug,category,price_dop,stock,status").order("created_at",{ascending:false}),
   s.from("product_costs").select("product_id,unit_cost_dop"),
   s.from("inventory_movements").select("id,product_id,quantity_delta,movement_type,note,created_at").order("created_at",{ascending:false}).limit(100),
   s.from("orders").select("id,order_number,status,total_dop,payment_confirmed_at,created_at").eq("status","delivered").not("payment_confirmed_at","is",null).order("created_at",{ascending:false}).limit(200)
  ]);
  if(p.error)throw p.error;if(c.error)throw c.error;if(m.error)throw m.error;
  setProducts((p.data||[]) as Product[]);
  setCosts(Object.fromEntries((c.data||[]).map((x:Cost)=>[x.product_id,Number(x.unit_cost_dop)])));
  setMovements((m.data||[]) as Movement[]);
  const orderIds=(o.data||[]).map((x:any)=>x.id);
  if(orderIds.length){
   const {data:items,error:itemError}=await s.from("order_items").select("order_id,product_id,product_name_snapshot,quantity,line_total_dop").in("order_id",orderIds);
   if(itemError)throw itemError;
   setSales((items||[]).map((item:any)=>({...item,order:(o.data||[]).find((x:any)=>x.id===item.order_id)})));
  } else setSales([]);
  setReady(true);
 },[]);
 useEffect(()=>{load().catch(e=>{setNotice(e.message||"No se pudo cargar el inventario.");setReady(true);});},[load]);

 const metrics=useMemo(()=>{
  const inventoryValue=products.reduce((n,p)=>n+(costs[p.id]||0)*p.stock,0);
  const expectedProfit=products.reduce((n,p)=>n+(p.price_dop-(costs[p.id]||0))*p.stock,0);
  const salesRevenue=sales.reduce((n,x)=>n+Number(x.line_total_dop||0),0);
  const salesCost=sales.reduce((n,x)=>n+(costs[x.product_id]||0)*Number(x.quantity||0),0);
  return {units:products.reduce((n,p)=>n+p.stock,0),inventoryValue,expectedProfit,salesRevenue,salesCost,salesProfit:salesRevenue-salesCost,low:products.filter(p=>p.stock>0&&p.stock<=5).length,out:products.filter(p=>p.stock===0).length};
 },[products,costs,sales]);

 async function saveCost(p:Product){
  const value=costs[p.id];
  if(value===undefined||!Number.isFinite(value)||value<0){setNotice("Introduce un costo válido.");return;}
  setBusy(true);setNotice("");
  try{const s=getSupabase();const {data:{user}}=await s.auth.getUser();const {error}=await s.from("product_costs").upsert({product_id:p.id,unit_cost_dop:value,updated_by:user?.id||null,updated_at:new Date().toISOString()});if(error)throw error;setNotice("Costo actualizado.");await load();}
  catch(e){setNotice(e instanceof Error?e.message:"No se pudo guardar el costo.");}finally{setBusy(false);}
 }
 async function adjustStock(p:Product){
  const delta=Number(adjust[p.id]);
  if(!Number.isInteger(delta)||delta===0){setNotice("Escribe una cantidad entera distinta de cero.");return;}
  if(p.stock+delta<0){setNotice("El inventario no puede quedar negativo.");return;}
  setBusy(true);setNotice("");
  try{const s=getSupabase();const {error}=await s.from("products").update({stock:p.stock+delta}).eq("id",p.id);if(error)throw error;
   const {data:{user}}=await s.auth.getUser();
   const {error:movementError}=await s.from("inventory_movements").insert({product_id:p.id,quantity_delta:delta,movement_type:delta>0?"restock":"adjustment",note:note[p.id]||"Ajuste manual",created_by:user?.id||null});
   if(movementError)throw movementError;
   setAdjust(v=>({...v,[p.id]:""}));setNotice("Inventario actualizado.");await load();
  }catch(e){setNotice(e instanceof Error?e.message:"No se pudo ajustar el inventario.");}finally{setBusy(false);}
 }
 async function createProduct(e:React.FormEvent){
  e.preventDefault();setBusy(true);setNotice("");
  try{
   const s=getSupabase();const {data:{user}}=await s.auth.getUser();if(!user)throw new Error("Sesión vencida.");
   const initialStock=Math.max(0,Math.floor(Number(stock)||0));
   const productPayload={created_by:user.id,name:name.trim(),slug:slugify(name),description:description.trim(),category:category.trim()||"General",price_dop:Number(price),stock:initialStock,image_urls:[],status:initialStock>0?"published":"draft",commission_type:"percentage",commission_value:0,tags:[],specifications:{}};
   if(!productPayload.name||!productPayload.slug||!Number.isFinite(productPayload.price_dop)||productPayload.price_dop<=0||!Number.isFinite(Number(cost))||Number(cost)<0)throw new Error("Revisa el nombre, precio y costo.");
   const {data:created,error}=await s.from("products").insert(productPayload).select("id").single();if(error)throw error;
   const {error:costError}=await s.from("product_costs").insert({product_id:created.id,unit_cost_dop:Number(cost),updated_by:user.id});if(costError)throw costError;
   if(initialStock){const {error:movementError}=await s.from("inventory_movements").insert({product_id:created.id,quantity_delta:initialStock,movement_type:"initial",note:"Inventario inicial",created_by:user.id});if(movementError)throw movementError;}
   setName("");setPrice("");setCost("");setStock("0");setDescription("");setNotice(initialStock?"Producto creado y publicado.":"Producto creado como borrador: agrega existencias para publicarlo.");await load();setTab("inventory");
  }catch(e){setNotice(e instanceof Error?e.message:"No se pudo crear el producto.");}finally{setBusy(false);}
 }
 async function toggleStatus(p:Product){
  const next=p.status==="published"?"paused":"published";
  if(next==="published"&&p.stock<1){setNotice("Agrega existencias antes de publicar este producto.");return;}
  const {error}=await getSupabase().from("products").update({status:next}).eq("id",p.id);
  if(error)setNotice(error.message);else{setNotice(next==="published"?"Producto publicado.":"Producto pausado.");await load();}
 }
 async function logout(){await getSupabase().auth.signOut();location.href="/admin/login";}
 if(!ready)return <main className="min-h-screen grid place-items-center bg-[#f6f7f3]">Cargando inventario…</main>;
 if(!allowed)return <main className="min-h-screen grid place-items-center bg-[#f6f7f3] p-5"><section className="max-w-md rounded-3xl bg-white p-8"><h1 className="text-2xl font-black">Acceso restringido</h1><p className="mt-3 text-sm text-gray-600">Inicia sesión con la cuenta administradora de XiiAO Supply.</p><Link href="/admin/login" className="mt-5 inline-block underline">Ir al acceso</Link></section></main>;
 return <main className="min-h-screen bg-[#f6f7f3] text-[#171914]">
  <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b bg-white px-4 py-4 md:px-8"><div><Link href="/" className="text-lg font-black">XiiAO <span className="font-medium">Supply</span></Link><p className="text-xs text-gray-500">Control interno de inventario y rentabilidad</p></div><div className="flex gap-2"><Link href="/admin" className="rounded-full border px-4 py-2 text-sm">Administración</Link><button onClick={logout} className="rounded-full border px-4 py-2 text-sm">Salir</button></div></header>
  <div className="mx-auto max-w-7xl p-4 md:p-8"><p className="text-xs font-bold uppercase tracking-[.2em] text-gray-500">Panel privado</p><h1 className="mt-1 text-3xl font-black md:text-4xl">Inventario y ganancias</h1><p className="mt-2 text-sm text-gray-500">Los costos y márgenes solo se muestran a administradores.</p>
   <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
    <div className="rounded-2xl bg-white p-4"><p className="text-xs text-gray-500">Unidades en stock</p><b className="mt-2 block text-2xl">{metrics.units}</b></div>
    <div className="rounded-2xl bg-white p-4"><p className="text-xs text-gray-500">Valor del inventario</p><b className="mt-2 block text-2xl">{money(metrics.inventoryValue)}</b></div>
    <div className="rounded-2xl bg-white p-4"><p className="text-xs text-gray-500">Ganancia potencial del stock</p><b className="mt-2 block text-2xl text-emerald-700">{money(metrics.expectedProfit)}</b></div>
    <div className="rounded-2xl bg-white p-4"><p className="text-xs text-gray-500">Ganancia bruta de ventas pagadas</p><b className="mt-2 block text-2xl text-emerald-700">{money(metrics.salesProfit)}</b></div>
   </div>
   <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4"><div className="rounded-xl border bg-white p-3 text-sm">Productos: <b>{products.length}</b></div><div className="rounded-xl border bg-white p-3 text-sm">Stock bajo: <b>{metrics.low}</b></div><div className="rounded-xl border bg-white p-3 text-sm">Agotados: <b>{metrics.out}</b></div><div className="rounded-xl border bg-white p-3 text-sm">Ventas pagadas: <b>{money(metrics.salesRevenue)}</b></div></div>
   <nav className="my-6 flex flex-wrap gap-2">{([["inventory","Inventario"],["profit","Rentabilidad"],["history","Movimientos"],["new","Agregar producto"]] as const).map(([id,label])=><button key={id} onClick={()=>setTab(id)} className={tab===id?"rounded-full bg-[#171914] px-4 py-2 text-sm font-bold text-white":"rounded-full border bg-white px-4 py-2 text-sm"}>{label}</button>)}</nav>
   {notice&&<p className="mb-4 rounded-xl border bg-white p-3 text-sm">{notice}</p>}
   {tab==="inventory"&&<section className="space-y-3">{products.map(p=><article key={p.id} className="grid gap-4 rounded-2xl bg-white p-4 md:grid-cols-[1fr_150px_150px_1fr] md:items-center"><div><b>{p.name}</b><p className="text-xs text-gray-500">{p.category} · {money(p.price_dop)} venta · {p.stock} unidades · {p.status}</p><p className="mt-1 text-xs text-gray-500">Ganancia por unidad: <b className="text-emerald-700">{money(p.price_dop-(costs[p.id]||0))}</b></p></div><label className="text-xs font-semibold text-gray-500">Costo unitario RD$<input type="number" min="0" step="0.01" value={costs[p.id]??0} onChange={e=>setCosts(v=>({...v,[p.id]:Number(e.target.value)}))} className="mt-1 w-full rounded-lg border p-2 text-sm text-black"/></label><button disabled={busy} onClick={()=>saveCost(p)} className="rounded-lg border px-3 py-2 text-sm font-semibold">Guardar costo</button><div className="flex flex-wrap items-end gap-2"><label className="flex-1 text-xs font-semibold text-gray-500">Ajuste (+/-)<input type="number" step="1" value={adjust[p.id]||""} onChange={e=>setAdjust(v=>({...v,[p.id]:e.target.value}))} className="mt-1 w-full rounded-lg border p-2 text-sm text-black" placeholder="Ej. 10 o -2"/></label><label className="flex-1 text-xs font-semibold text-gray-500">Nota<input value={note[p.id]||""} onChange={e=>setNote(v=>({...v,[p.id]:e.target.value}))} className="mt-1 w-full rounded-lg border p-2 text-sm text-black" placeholder="Compra / corrección"/></label><button disabled={busy} onClick={()=>adjustStock(p)} className="rounded-lg bg-[#c8f169] px-3 py-2 text-sm font-bold">Aplicar</button><button onClick={()=>toggleStatus(p)} className="rounded-lg border px-3 py-2 text-sm">{p.status==="published"?"Pausar":"Publicar"}</button></div></article>)}</section>}
   {tab==="profit"&&<section className="rounded-2xl bg-white p-5"><h2 className="text-xl font-black">Resumen de rentabilidad</h2><p className="mt-1 text-sm text-gray-500">Las ventas se cuentan cuando el pedido figura como entregado y el pago está confirmado. La ganancia se estima usando el costo unitario vigente de cada producto.</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-500">Ingresos por productos</p><b className="text-xl">{money(metrics.salesRevenue)}</b></div><div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-500">Costo estimado vendido</p><b className="text-xl">{money(metrics.salesCost)}</b></div><div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs text-emerald-800">Ganancia bruta estimada</p><b className="text-xl text-emerald-800">{money(metrics.salesProfit)}</b></div></div><p className="mt-4 text-xs text-gray-400">No incluye gastos de envío, publicidad, empaque, comisiones ni otros gastos operativos.</p></section>}
   {tab==="history"&&<section className="space-y-2">{movements.length===0?<div className="rounded-2xl bg-white p-8 text-gray-500">Todavía no hay movimientos de inventario.</div>:movements.map(m=><article key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4"><div><b>{products.find(p=>p.id===m.product_id)?.name||"Producto"}</b><p className="text-xs text-gray-500">{m.movement_type} · {m.note||"Sin nota"} · {new Date(m.created_at).toLocaleString("es-DO")}</p></div><b className={m.quantity_delta>0?"text-emerald-700":"text-red-600"}>{m.quantity_delta>0?"+":""}{m.quantity_delta} unidades</b></article>)}</section>}
   {tab==="new"&&<form onSubmit={createProduct} className="max-w-2xl space-y-4 rounded-2xl bg-white p-5"><h2 className="text-xl font-black">Agregar producto a XiiAO Supply</h2><label className="block text-sm font-semibold">Nombre<input required value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full rounded-xl border p-3 font-normal"/></label><label className="block text-sm font-semibold">Descripción<textarea value={description} onChange={e=>setDescription(e.target.value)} className="mt-1 w-full rounded-xl border p-3 font-normal"/></label><label className="block text-sm font-semibold">Categoría<input value={category} onChange={e=>setCategory(e.target.value)} className="mt-1 w-full rounded-xl border p-3 font-normal"/></label><div className="grid grid-cols-2 gap-3"><label className="block text-sm font-semibold">Precio de venta RD$<input required type="number" min="1" value={price} onChange={e=>setPrice(e.target.value)} className="mt-1 w-full rounded-xl border p-3 font-normal"/></label><label className="block text-sm font-semibold">Costo de compra RD$<input required type="number" min="0" step="0.01" value={cost} onChange={e=>setCost(e.target.value)} className="mt-1 w-full rounded-xl border p-3 font-normal"/></label></div><label className="block text-sm font-semibold">Cantidad inicial<input type="number" min="0" step="1" value={stock} onChange={e=>setStock(e.target.value)} className="mt-1 w-full rounded-xl border p-3 font-normal"/></label><button disabled={busy} className="w-full rounded-xl bg-[#171914] py-3 font-bold text-white">{busy?"Guardando…":"Guardar producto"}</button><p className="text-xs text-gray-500">Si la cantidad inicial es cero, el producto queda como borrador hasta recibir inventario.</p></form>}
  </div>
 </main>;
}
