"use client";
import {useState} from "react";
import {getSupabase} from "@/lib/supabase/client";
import {Save,UploadCloud,FileText,CheckCircle2} from "lucide-react";

type DriverData={id:string;user_id?:string|null;full_name:string;phone:string;status:string;verification?:any;vehicle?:any};
const field="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-lime-500";
const label="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500";
export default function AdminDriverEditor({driver,onSaved}:{driver:DriverData;onSaved:()=>void}){
 const v=driver.verification||{},vehicle=driver.vehicle||{};
 const [nationalId,setNationalId]=useState(v.national_id||"");
 const [expiry,setExpiry]=useState(v.insurance_expires_on||"");
 const [condition,setCondition]=useState(Boolean(v.motorcycle_condition_confirmed));
 const [brand,setBrand]=useState(vehicle.brand||"");
 const [model,setModel]=useState(vehicle.model||"");
 const [color,setColor]=useState(vehicle.color||"");
 const [plate,setPlate]=useState(vehicle.plate||"");
 const [note,setNote]=useState(v.admin_note||"");
 const [bike,setBike]=useState<File|null>(null);
 const [insurance,setInsurance]=useState<File|null>(null);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 async function save(){
  setBusy(true);setMessage("");
  try{
   const s=getSupabase();
   let bikePath=v.motorcycle_photo_path||null,insurancePath=v.insurance_document_path||null;
   const upload=async(file:File,kind:string)=>{
    const allowed=["image/jpeg","image/png","image/webp","application/pdf"];
    if(!allowed.includes(file.type))throw new Error("Usa JPG, PNG, WEBP o PDF.");
    if(file.size>10*1024*1024)throw new Error("Cada archivo debe pesar máximo 10 MB.");
    const ext=file.name.split(".").pop()?.toLowerCase()||"bin";
    const path=(driver.user_id||driver.id)+"/admin-"+crypto.randomUUID()+"-"+kind+"."+ext;
    const {error}=await s.storage.from("cg-driver-documents").upload(path,file,{contentType:file.type,upsert:false});
    if(error)throw error;
    return path;
   };
   if(bike)bikePath=await upload(bike,"moto");
   if(insurance)insurancePath=await upload(insurance,"seguro");
   const {data:existingVehicle,error:vehicleReadError}=await s.from("cg_vehicles").select("id").eq("driver_id",driver.id).maybeSingle();
   if(vehicleReadError)throw vehicleReadError;
   const vehicleData={vehicle_type:"motor",brand:brand.trim()||null,model:model.trim()||null,color:color.trim()||null,plate:plate.trim()||null,seats:1,is_active:true};
   if(existingVehicle?.id){const {error}=await s.from("cg_vehicles").update(vehicleData).eq("id",existingVehicle.id);if(error)throw error;}
   else{const {error}=await s.from("cg_vehicles").insert({driver_id:driver.id,...vehicleData});if(error)throw error;}
   if(nationalId.trim()||expiry||bikePath||insurancePath||v.national_id){
    if(!nationalId.replace(/\\D/g,"")||!expiry||!condition||!bikePath||!insurancePath)throw new Error("Para guardar la verificación completa indica cédula, vencimiento, confirma el estado y adjunta los dos documentos.");
    const {data:{user}}=await s.auth.getUser();
    const {error}=await s.from("cg_driver_verifications").upsert({driver_id:driver.id,national_id:nationalId.replace(/\\D/g,""),insurance_expires_on:expiry,motorcycle_condition_confirmed:condition,motorcycle_photo_path:bikePath,insurance_document_path:insurancePath,submitted_at:v.submitted_at||new Date().toISOString(),reviewed_at:null,reviewed_by:null,admin_note:note.trim()||null},{onConflict:"driver_id"});
    if(error)throw error;
   }
   setMessage("Datos guardados. Revisa los documentos y usa Aprobar solo cuando todo esté verificado.");
   onSaved();
  }catch(e){setMessage(e instanceof Error?e.message:"No se pudieron guardar los datos.");}
  finally{setBusy(false);}
 }
 return <details className="mt-4 rounded-xl border border-lime-200 bg-lime-50/40 p-3">
  <summary className="cursor-pointer text-xs font-extrabold text-[#14251d]">Completar o corregir datos desde administración</summary>
  <div className="mt-4 grid gap-3 sm:grid-cols-2">
   <label className={label}>Cédula<input className={field} value={nationalId} onChange={e=>setNationalId(e.target.value)} placeholder="000-0000000-0"/></label>
   <label className={label}>Vencimiento del seguro<input className={field} type="date" value={expiry} onChange={e=>setExpiry(e.target.value)}/></label>
   <label className={label}>Marca<input className={field} value={brand} onChange={e=>setBrand(e.target.value)} placeholder="Honda"/></label>
   <label className={label}>Modelo<input className={field} value={model} onChange={e=>setModel(e.target.value)} placeholder="CG 150"/></label>
   <label className={label}>Color<input className={field} value={color} onChange={e=>setColor(e.target.value)}/></label>
   <label className={label}>Placa<input className={field} value={plate} onChange={e=>setPlate(e.target.value)}/></label>
   <label className={label+" sm:col-span-2"}>Foto de la motocicleta<input className={field} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e=>setBike(e.target.files?.[0]||null)}/><span className="mt-1 block text-[10px] font-normal normal-case text-slate-400">{v.motorcycle_photo_path?"Ya existe un archivo; solo selecciona otro si deseas reemplazarlo.":"Falta este documento."}</span></label>
   <label className={label+" sm:col-span-2"}>Documento del seguro<input className={field} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e=>setInsurance(e.target.files?.[0]||null)}/><span className="mt-1 block text-[10px] font-normal normal-case text-slate-400">{v.insurance_document_path?"Ya existe un archivo; solo selecciona otro si deseas reemplazarlo.":"Falta este documento."}</span></label>
   <label className="sm:col-span-2 flex items-start gap-2 rounded-lg border bg-white p-3 text-xs"><input type="checkbox" checked={condition} onChange={e=>setCondition(e.target.checked)} className="mt-0.5 h-4 w-4 accent-lime-600"/> Confirmo que la motocicleta está en buenas condiciones.</label>
   <label className={label+" sm:col-span-2"}>Nota administrativa<textarea className={field} rows={2} value={note} onChange={e=>setNote(e.target.value)} placeholder="Observaciones o documentos pendientes"/></label>
   <button disabled={busy} onClick={save} className="sm:col-span-2 flex items-center justify-center gap-2 rounded-xl bg-[#14251d] px-4 py-3 text-xs font-black text-white disabled:opacity-50"><Save size={15}/>{busy?"Guardando…":"Guardar datos del conductor"}</button>
  </div>
  {message&&<p role="status" className="mt-3 rounded-lg bg-white p-3 text-xs font-semibold text-slate-700">{message}</p>}
 </details>;
}
