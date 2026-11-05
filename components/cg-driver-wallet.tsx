"use client";
import {useCallback,useEffect,useState} from "react";
import {getSupabase} from "@/lib/supabase/client";
import {WalletCards,ArrowDownToLine,History,RefreshCw,Clock3,CheckCircle2,AlertCircle} from "lucide-react";

type Wallet={available_balance_dop:number;reserved_balance_dop:number};
type Entry={id:string;entry_type:string;available_delta_dop:number;reserved_delta_dop:number;description:string;created_at:string};
type Topup={id:string;amount_dop:number;payment_method:string;payment_reference:string|null;status:string;created_at:string;admin_note?:string|null};
type EarnedService={id:string;kind:"Viaje"|"Paquete";created_at:string;gross:number;commission:number;net:number};
const money=(n:number)=>"RD$ "+Number(n||0).toLocaleString("es-DO",{minimumFractionDigits:2,maximumFractionDigits:2});
export default function DriverWallet(){
 const [wallet,setWallet]=useState<Wallet|null>(null),[entries,setEntries]=useState<Entry[]>([]),[topups,setTopups]=useState<Topup[]>([]),[earnings,setEarnings]=useState<EarnedService[]>([]);
 const [amount,setAmount]=useState("500"),[method,setMethod]=useState("transferencia"),[reference,setReference]=useState(""),[note,setNote]=useState("");
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 const todayKey=new Date().toLocaleDateString("en-CA");
 const todayEarned=earnings.filter(x=>new Date(x.created_at).toLocaleDateString("en-CA")===todayKey).reduce((sum,x)=>sum+x.net,0);
 const totalEarned=earnings.reduce((sum,x)=>sum+x.net,0);
 const totalCash=earnings.reduce((sum,x)=>sum+x.gross,0);
 const load=useCallback(async()=>{const s=getSupabase();const {data:{user}}=await s.auth.getUser();if(!user)return;
  const {data:driver,error:driverError}=await s.from("cg_driver_profiles").select("id").eq("user_id",user.id).single();if(driverError)throw driverError;
  const [w,l,t,r,d]=await Promise.all([
   s.from("cg_driver_wallets").select("available_balance_dop,reserved_balance_dop").eq("driver_id",driver.id).single(),
   s.from("cg_wallet_ledger").select("id,entry_type,available_delta_dop,reserved_delta_dop,description,created_at").eq("driver_id",driver.id).order("created_at",{ascending:false}).limit(12),
   s.from("cg_wallet_topups").select("id,amount_dop,payment_method,payment_reference,status,created_at,admin_note").eq("driver_id",driver.id).order("created_at",{ascending:false}).limit(8),
   s.from("cg_ride_requests").select("id,created_at,agreed_fare_dop,estimated_fare_dop,platform_commission_dop,commission_rate_pct,driver_payout_dop").eq("driver_id",driver.id).eq("status","completed").order("created_at",{ascending:false}).limit(100),
   s.from("cg_delivery_requests").select("id,created_at,agreed_fee_dop,estimated_fee_dop,platform_commission_dop,commission_rate_pct,driver_payout_dop").eq("courier_id",driver.id).eq("status","delivered").order("created_at",{ascending:false}).limit(100)
  ]);
  for(const x of [w,l,t,r,d])if(x.error)throw x.error;setWallet(w.data);setEntries(l.data||[]);setTopups(t.data||[]);
  const rides=(r.data||[]).map((x:any)=>{const gross=Number(x.agreed_fare_dop??x.estimated_fare_dop??0);const commission=Number(x.platform_commission_dop??(gross*Number(x.commission_rate_pct??15)/100));return {id:x.id,kind:"Viaje" as const,created_at:x.created_at,gross,commission,net:Number(x.driver_payout_dop??(gross-commission))};});
  const deliveries=(d.data||[]).map((x:any)=>{const gross=Number(x.agreed_fee_dop??x.estimated_fee_dop??0);const commission=Number(x.platform_commission_dop??(gross*Number(x.commission_rate_pct??15)/100));return {id:x.id,kind:"Paquete" as const,created_at:x.created_at,gross,commission,net:Number(x.driver_payout_dop??(gross-commission))};});
  setEarnings([...rides,...deliveries].sort((a,b)=>b.created_at.localeCompare(a.created_at)));
 },[]);
 useEffect(()=>{load().catch(e=>setNotice(e.message||"No se pudo cargar tu billetera."));},[load]);
 async function requestTopup(e:React.FormEvent){e.preventDefault();setBusy(true);setNotice("");try{const {error}=await getSupabase().rpc("cg_driver_request_wallet_topup",{p_amount:Number(amount),p_payment_method:method,p_payment_reference:reference||null,p_driver_note:note||null});if(error)throw error;setNotice("Solicitud enviada. Administración verificará el pago antes de acreditar tu balance.");setReference("");setNote("");await load();}catch(e){setNotice(e instanceof Error?e.message:"No se pudo solicitar la recarga.");}finally{setBusy(false)}}
 return <section className="mb-6 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
  <div className="bg-[#14251d] p-5 text-white sm:p-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-lime-300">Tu billetera Cotuí Go</p><h2 className="mt-2 text-3xl font-black">{money(wallet?.available_balance_dop||0)}</h2><p className="mt-1 text-xs text-white/60">Balance disponible</p></div><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-lime-300"><WalletCards size={25}/></span></div>
   <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-white/10 p-3"><p className="text-[9px] font-bold uppercase text-white/60">Comisión reservada</p><b className="mt-1 block text-lg">{money(wallet?.reserved_balance_dop||0)}</b></div><div className="rounded-xl bg-white/10 p-3"><p className="text-[9px] font-bold uppercase text-white/60">Balance mínimo</p><b className="mt-1 block text-lg">RD$ 100.00</b></div></div>
   {(wallet?.available_balance_dop||0)<100&&<div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-300 p-3 text-xs font-bold text-[#332400]"><AlertCircle size={16}/> Recarga tu billetera para volver a recibir servicios.</div>}
  </div>
  <div className="border-b border-slate-100 bg-white p-5">
   <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-700">Tus resultados</p><h3 className="mt-1 text-lg font-black">Ganancias confirmadas</h3><p className="mt-1 text-xs text-slate-500">Solo cuenta viajes completados y paquetes entregados.</p></div><span className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><CheckCircle2 size={22}/></span></div>
   <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
    <div className="rounded-xl bg-emerald-50 p-3"><p className="text-[9px] font-bold uppercase text-emerald-800/70">Ganaste hoy</p><b className="mt-1 block text-lg text-emerald-900">{money(todayEarned)}</b></div>
    <div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-bold uppercase text-slate-500">Total confirmado</p><b className="mt-1 block text-lg">{money(totalEarned)}</b></div>
    <div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-bold uppercase text-slate-500">Servicios listos</p><b className="mt-1 block text-lg">{earnings.length}</b></div>
    <div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-bold uppercase text-slate-500">Cobrado en efectivo</p><b className="mt-1 block text-lg">{money(totalCash)}</b></div>
   </div>
   <div className="mt-3 rounded-xl border border-slate-200 p-3 text-[11px] leading-5 text-slate-600">El efectivo del servicio lo recibes directamente del cliente. La ganancia confirmada muestra tu parte después de la comisión de Cotuí Go; esa comisión se descuenta de tu billetera al completar el servicio.</div>
   <div className="mt-4"><h4 className="mb-2 flex items-center gap-2 text-sm font-black"><History size={16}/> Historial de ganancias</h4>
    {earnings.length===0?<p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">Tus ganancias aparecerán aquí cuando completes tu primer viaje o entrega.</p>:<div className="space-y-2">{earnings.slice(0,10).map(x=><div key={x.kind+x.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"><div><p className="text-xs font-bold">{x.kind} completado</p><p className="mt-1 text-[10px] text-slate-400">{new Date(x.created_at).toLocaleString("es-DO")}</p><p className="mt-1 text-[10px] text-slate-500">Cobro {money(x.gross)} · Comisión {money(x.commission)}</p></div><b className="text-sm text-emerald-700">+{money(x.net)}</b></div>)}</div>}
   </div>
  </div>
  <div className="border-b border-slate-100 bg-slate-50 p-5">
   <div className="mb-3"><p className="text-[10px] font-black uppercase tracking-[.18em] text-lime-800">Métodos de recarga</p><h3 className="mt-1 text-lg font-black">Transfiere y recarga tu billetera</h3><p className="mt-1 text-xs leading-5 text-slate-600">Realiza la transferencia y, muy importante, escribe tu número de cédula en el comentario o concepto de la transferencia para identificar tu depósito. Luego envía la solicitud de recarga con el monto y la referencia.</p></div>
   <div className="grid gap-3 sm:grid-cols-2">
    <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Banreservas · Ahorros</p><p className="mt-2 text-xl font-black tracking-wide">9606418721</p><p className="mt-1 text-xs text-slate-500">Titular: Michael</p><button type="button" onClick={()=>navigator.clipboard?.writeText("9606418721")} className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-[10px] font-bold">Copiar cuenta</button></div>
    <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Qik · Ahorros</p><p className="mt-2 text-xl font-black tracking-wide">1012123066</p><p className="mt-1 text-xs text-slate-500">Cuenta de ahorro Qik</p><button type="button" onClick={()=>navigator.clipboard?.writeText("1012123066")} className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-[10px] font-bold">Copiar cuenta</button></div>
   </div>
   <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-semibold leading-5 text-amber-900">No se acredita automáticamente. Cotuí Go verificará el depósito antes de sumar el dinero a tu balance. No compartas claves ni códigos bancarios.</p>
  </div>
  <div className="grid gap-5 p-5 lg:grid-cols-[.9fr_1.1fr]">
   <form onSubmit={requestTopup} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center gap-2"><ArrowDownToLine size={18} className="text-lime-700"/><h3 className="font-black">Solicitar recarga</h3></div><p className="mt-1 text-[11px] text-slate-500">Mínimo RD$100. El balance se acredita después de verificar el pago.</p>
    <label className="mt-4 block text-[10px] font-bold uppercase text-slate-500">Monto (RD$)<input required type="number" min="100" max="100000" step="1" value={amount} onChange={e=>setAmount(e.target.value)} className="mt-1 w-full rounded-xl border p-3 text-sm font-bold"/></label>
    <label className="mt-3 block text-[10px] font-bold uppercase text-slate-500">Método de pago<select value={method} onChange={e=>setMethod(e.target.value)} className="mt-1 w-full rounded-xl border bg-white p-3 text-sm"><option value="transferencia">Transferencia</option><option value="efectivo">Efectivo a agente autorizado</option></select></label>
    <label className="mt-3 block text-[10px] font-bold uppercase text-slate-500">Referencia de pago (opcional)<input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número de transferencia" className="mt-1 w-full rounded-xl border p-3 text-sm"/></label>
    <label className="mt-3 block text-[10px] font-bold uppercase text-slate-500">Nota (opcional)<textarea value={note} onChange={e=>setNote(e.target.value)} rows={2} className="mt-1 w-full rounded-xl border p-3 text-sm"/></label>
    <button disabled={busy} className="mt-4 w-full rounded-xl bg-lime-400 py-3 text-xs font-black text-[#14251d] disabled:opacity-50">{busy?"Enviando…":"Enviar solicitud de recarga"}</button>
   </form>
   <div className="space-y-4"><div><div className="mb-3 flex items-center justify-between"><h3 className="flex items-center gap-2 font-black"><History size={17}/> Movimientos</h3><button onClick={()=>load().catch(e=>setNotice(e.message))} className="rounded-lg border p-2"><RefreshCw size={14}/></button></div>{entries.length===0?<p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">Todavía no tienes movimientos.</p>:<div className="space-y-2">{entries.map(x=><div key={x.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><div><p className="text-xs font-bold">{x.description}</p><p className="mt-1 text-[10px] text-slate-400">{new Date(x.created_at).toLocaleString("es-DO")}</p></div><b className={x.available_delta_dop>0?"text-sm text-emerald-700":"text-sm text-slate-800"}>{(x.available_delta_dop||x.reserved_delta_dop)>0?"+":""}{money(x.available_delta_dop||x.reserved_delta_dop)}</b></div>)}</div>}</div>
   <div><h3 className="mb-3 font-black">Solicitudes de recarga</h3>{topups.length===0?<p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">No has solicitado recargas.</p>:<div className="space-y-2">{topups.map(t=><div key={t.id} className="flex items-center justify-between gap-3 rounded-xl border p-3"><div><p className="text-xs font-bold">{money(t.amount_dop)} · {t.payment_method==="transferencia"?"Transferencia":"Efectivo"}</p><p className="mt-1 text-[10px] text-slate-400">{new Date(t.created_at).toLocaleString("es-DO")}</p></div><span className={"rounded-full px-2.5 py-1 text-[10px] font-black "+(t.status==="approved"?"bg-emerald-100 text-emerald-800":t.status==="rejected"?"bg-rose-100 text-rose-800":"bg-amber-100 text-amber-800")}>{t.status==="approved"?"Aprobada":t.status==="rejected"?"Rechazada":"Pendiente"}</span></div>)}</div>}</div></div>
  </div>{notice&&<p role="status" className="border-t border-slate-100 bg-slate-50 p-3 text-xs font-semibold text-slate-700">{notice}</p>}
 </section>;
}
