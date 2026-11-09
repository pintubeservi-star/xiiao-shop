import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
export const runtime="nodejs";
const systemPrompt="Eres el asistente oficial de soporte de Cotuí Go, una plataforma local de motos y entregas en Cotuí, República Dominicana. Responde en español dominicano natural, con respeto y mensajes breves. Ayuda con uso de la aplicación, solicitudes, viajes, paquetes, billetera, recargas y dudas generales. No inventes estados de viajes, saldos, pagos, tiempos ni acciones que no puedas consultar. No afirmes que administración recibió un aviso si el sistema no lo confirma. SEGURIDAD: si la persona indica peligro inmediato, accidente con lesiones, amenaza, violencia, asalto o riesgo físico, responde que llame al 911 ahora; no debe esperar al chat. Marca emergency=true y escalate=true. Si no se siente segura durante un viaje, recomienda usar el botón de seguridad de Cotuí Go para avisar a administración. No le pidas confrontar a nadie. Deriva a soporte humano cuando el caso implique seguridad, fraude, cobros disputados, identidad, suspensión de cuenta, pérdida de objetos o un problema que no puedas resolver con certeza. No tomes decisiones disciplinarias ni prometas reembolsos. Devuelve exclusivamente un objeto JSON válido con esta forma: {\"reply\":\"respuesta al usuario\",\"escalate\":false,\"emergency\":false}.";
export async function POST(req:NextRequest){
 try{
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const auth=req.headers.get("authorization")||"";
  const token=auth.startsWith("Bearer ")?auth.slice(7):"";
  if(!url||!key||!token)return NextResponse.json({error:"Inicia sesión para usar el soporte seguro."},{status:401});
  const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:authError}=await supabase.auth.getUser(token);
  if(authError||!user)return NextResponse.json({error:"Tu sesión expiró. Inicia sesión nuevamente."},{status:401});
  const body=await req.json();
  const messages=Array.isArray(body?.messages)?body.messages.slice(-10):[];
  if(!messages.length||messages.some((m:any)=>!["user","assistant"].includes(m?.role)||typeof m.content!=="string"||m.content.length>1200))return NextResponse.json({error:"Mensaje no válido."},{status:400});
  const gatewayKey=process.env.AI_GATEWAY_API_KEY||process.env.VERCEL_OIDC_TOKEN;
  if(!gatewayKey)return NextResponse.json({error:"El asistente IA necesita activar la conexión segura de AI Gateway en Vercel."},{status:503});
  const response=await fetch("https://ai-gateway.vercel.sh/v1/chat/completions",{method:"POST",headers:{"Authorization":"Bearer "+gatewayKey,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.AI_GATEWAY_MODEL||"alibaba/qwen3.7-flash",messages:[{role:"system",content:systemPrompt},...messages],temperature:0.2,max_tokens:450,response_format:{type:"json_object"}}),signal:AbortSignal.timeout(20000)});
  if(!response.ok){await response.text();return NextResponse.json({error:response.status===402?"El servicio IA necesita saldo o presupuesto disponible.":response.status===401?"La conexión IA de Vercel necesita autorización.":"El asistente no está disponible en este momento."},{status:502});}
  const data=await response.json();
  const raw=data?.choices?.[0]?.message?.content;
  const parsed=typeof raw==="string"?JSON.parse(raw):raw;
  if(!parsed||typeof parsed.reply!=="string")throw new Error("Respuesta IA no válida.");
  return NextResponse.json({reply:parsed.reply.slice(0,1800),escalate:parsed.escalate===true,emergency:parsed.emergency===true});
 }catch(error){return NextResponse.json({error:error instanceof Error&&error.name==="TimeoutError"?"El asistente tardó demasiado. Inténtalo otra vez.":"No se pudo consultar al asistente en este momento."},{status:500});}
}
