"use client";

import {useEffect,useState} from "react";
import {getSupabase} from "@/lib/supabase/client";
import {ShieldCheck,UploadCloud,CheckCircle2,FileImage,AlertTriangle} from "lucide-react";

type Verification={national_id:string;insurance_expires_on:string;motorcycle_condition_confirmed:boolean;submitted_at:string};
const input="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-lime-500";
const label="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500";
export default function DriverVerification({driverId,initialNationalId="",initialExpiry=""}:{driverId:string;initialNationalId?:string;initialExpiry?:string}){
 const [nationalId,setNationalId]=useState(initialNationalId);
 const [expiry,setExpiry]=useState(initialExpiry);
 const [bikePhoto,setBikePhoto]=useState<File|null>(null);
 const [insurance,setInsurance]=useState<File|null>(null);
 const [condition,setCondition]=useState(false);
 const [existing,setExisting]=useState<Verification|null>(null);
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState("");
 useEffect(()=>{(async()=>{const s=getSupabase();const {data,error}=await s.from("cg_driver_verifications").select("national_id,insurance_expires_on,motorcycle_condition_confirmed,submitted_at").eq("driver_id",driverId).maybeSingle();if(!error&&data){setExisting(data);setNationalId(data.national_id);setExpiry(data.insurance_expires_on);setCondition(data.motorcycle_condition_confirmed);}})();},[driverId]);
 async function submit(e:React.FormEvent){e.preventDefault();setNotice("");if(!bikePhoto||!insurance){setNotice("Debes adjuntar la foto de la motocicleta y el documento del seguro.");return;}if(!condition){setNotice("Debes confirmar que la motocicleta está en buenas condiciones.");return;}if(new Date(expiry+"T23:59:59")<new Date()){setNotice("El seguro está vencido. Debes presentar un seguro vigente.");return;}setBusy(true);try{
  const s=getSupabase();const {data:{user}}=await s.auth.getUser();if(!user)throw new Error("Inicia sesión nuevamente para enviar tus documentos.");
  const allowed=["image/jpeg","image/png","image/webp","application/pdf"];
  for(const f of [bikePhoto,insurance]){if(!allowed.includes(f.type))throw new Error("Usa JPG, PNG, WEBP o PDF.");if(f.size>10*1024*1024)throw new Error("Cada archivo debe pesar máximo 10 MB.");}
  const ext=(f:File)=>f.name.split(".").pop()?.toLowerCase()||"bin";
  const bikePath=user.id+"/"+crypto.randomUUID()+"-motor."+ext(bikePhoto);
  const insurancePath=user.id+"/"+crypto.randomUUID()+"-seguro."+ext(insurance);
  const up1=await s.storage.from("cg-driver-documents").upload(bikePath,bikePhoto,{contentType:bikePhoto.type,upsert:false});if(up1.error)throw up1.error;
  const up2=await s.storage.from("cg-driver-documents").upload(insurancePath,insurance,{contentType:insurance.type,upsert:false});if(up2.error)throw up2.error;
  const {error}=await s.from("cg_driver_verifications").upsert({driver_id:driverId,national_id:nationalId.replace(/\D/g,""),motorcycle_photo_path:bikePath,insurance_document_path:insurancePath,insurance_expires_on:expiry,motorcycle_condition_confirmed:true,submitted_at:new Date().toISOString(),reviewed_at:null,reviewed_by:null,admin_note:null},{onConflict:"driver_id"});if(error)throw error;
  setExisting({national_id:nationalId,insurance_expires_on:expiry,motorcycle_condition_confirmed:true,submitted_at:new Date().toISOString()});setBikePhoto(null);setInsurance(null);setNotice("Documentos enviados de forma privada. Tu cuenta seguirá pendiente hasta que administración revise y apruebe tu solicitud.");
 }catch(err){setNotice(err instanceof Error?err.message:"No se pudieron enviar los documentos.");}finally{setBusy(false);}}
 return <section className="rounded-[26px] border border-amber-200 bg-white p-5 shadow-sm sm:p-6">
  <div className="flex items-start gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-amber-800"><ShieldCheck size={22}/></span><div><h3 className="font-black">Verificación obligatoria del conductor</h3><p className="mt-1 text-xs leading-5 text-slate-500">Completa estos datos para que Cotuí Go pueda revisar tu identidad, motocicleta y seguro. No podrás recibir servicios hasta ser aprobado.</p></div></div>
  {existing&&<div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800"><CheckCircle2 size={16}/> Documentos enviados el {new Date(existing.submitted_at).toLocaleDateString("es-DO")}. Puedes volver a enviarlos si necesitas corregirlos.</div>}
  <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
   <label className={label}>Número de cédula<input required inputMode="numeric" minLength={11} maxLength={13} pattern="[0-9-]{11,13}" value={nationalId} onChange={e=>setNationalId(e.target.value)} placeholder="000-0000000-0" className={input}/></label>
   <label className={label}>Vencimiento del seguro<input required type="date" value={expiry} onChange={e=>setExpiry(e.target.value)} min={new Date().toISOString().slice(0,10)} className={input}/></label>
   <label className={label+" sm:col-span-2"}>Foto de la motocicleta<input required type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setBikePhoto(e.target.files?.[0]||null)} className={input}/><span className="mt-1 block text-[10px] font-normal normal-case text-slate-400">Foto clara donde se vea la motocicleta completa y su placa. Máximo 10 MB.</span></label>
   <label className={label+" sm:col-span-2"}>Documento del seguro vigente<input required type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e=>setInsurance(e.target.files?.[0]||null)} className={input}/><span className="mt-1 block text-[10px] font-normal normal-case text-slate-400">Sube la póliza o documento donde se pueda comprobar la vigencia. Máximo 10 MB.</span></label>
   <label className="sm:col-span-2 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-700"><input required type="checkbox" checked={condition} onChange={e=>setCondition(e.target.checked)} className="mt-1 h-4 w-4 accent-lime-600"/><span>Declaro que mi motocicleta está en buenas condiciones mecánicas, cuenta con sus elementos de seguridad y está apta para circular.</span></label>
   <div className="sm:col-span-2"><button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#14251d] px-5 py-3.5 text-sm font-black text-white disabled:opacity-50"><UploadCloud size={17}/>{busy?"Enviando documentos…":"Enviar documentos para aprobación"}</button></div>
  </form>
  {notice&&<p role="status" className="mt-4 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-700">{notice}</p>}
  <p className="mt-3 flex items-center gap-2 text-[10px] text-slate-400"><AlertTriangle size={13}/> Tus documentos son privados y solo tú y el personal autorizado pueden consultarlos.</p>
 </section>;
}
