import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
export const runtime="nodejs";
export async function POST(req:NextRequest){
 try{
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const auth=req.headers.get("authorization")||"";
  const token=auth.startsWith("Bearer ")?auth.slice(7):"";
  if(!url||!key||!token)return NextResponse.json({error:"Sesión no válida."},{status:401});
  const s=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:"Bearer "+token}}});
  const {data:{user},error:authError}=await s.auth.getUser(token);
  if(authError||!user)return NextResponse.json({error:"Sesión expirada."},{status:401});
  const {data:profile,error:profileError}=await s.from("profiles").select("role").eq("id",user.id).maybeSingle();
  if(profileError||profile?.role!=="admin")return NextResponse.json({error:"Solo administración puede solicitar este análisis."},{status:403});
  const [metrics,alerts,reports,events]=await Promise.all([
   s.rpc("cg_admin_platform_metrics"),
   s.from("cg_driver_risk_alerts").select("driver_id,alert_type,severity,evidence_count,status,created_at").order("created_at",{ascending:false}).limit(40),
   s.from("cg_safety_reports").select("reporter_role,report_type,status,created_at").order("created_at",{ascending:false}).limit(40),
   s.from("cg_activity_events").select("event_name,role,created_at").gte("created_at",new Date(Date.now()-7*86400000).toISOString()).order("created_at",{ascending:false}).limit(500)
  ]);
  for(const x of [metrics,alerts,reports,events])if(x.error)throw x.error;
  const gatewayKey=process.env.AI_GATEWAY_API_KEY||process.env.VERCEL_OIDC_TOKEN;
  if(!gatewayKey)return NextResponse.json({error:"Falta activar la conexión segura de AI Gateway."},{status:503});
  const payload={metrics:metrics.data,alerts:alerts.data,reports:reports.data,event_counts:(events.data||[]).reduce((a:any,e:any)=>{a[e.event_name]=(a[e.event_name]||0)+1;return a;},{})};
  const system="Eres analista de operaciones y seguridad de Cotuí Go en Cotuí, República Dominicana. Analiza solo los datos agregados y alertas proporcionadas. Identifica tendencias, posibles cancelaciones abusivas, riesgos para pasajeros/conductores, anomalías de visitas y servicios completados. No asumas culpabilidad por una alerta, no inventes datos, no expongas información personal y no recomiendes suspensiones permanentes automáticas. Propón acciones proporcionales y verificables para que administración revise. Devuelve exclusivamente JSON válido con summary, risk_level (low|medium|high), findings (array de strings) y recommendations (array de strings).";
  const response=await fetch("https://ai-gateway.vercel.sh/v1/chat/completions",{method:"POST",headers:{"Authorization":"Bearer "+gatewayKey,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.AI_GATEWAY_MODEL||"alibaba/qwen3.7-flash",messages:[{role:"system",content:system},{role:"user",content:JSON.stringify(payload)}],temperature:0.1,max_tokens:700,response_format:{type:"json_object"}}),signal:AbortSignal.timeout(25000)});
  if(!response.ok){await response.text();return NextResponse.json({error:"La IA de monitoreo no está disponible. Verifica AI Gateway."},{status:502});}
  const data=await response.json();const raw=data?.choices?.[0]?.message?.content;const result=typeof raw==="string"?JSON.parse(raw):raw;
  if(!result||typeof result.summary!=="string")throw new Error("Respuesta de análisis no válida.");
  return NextResponse.json({summary:result.summary,risk_level:["low","medium","high"].includes(result.risk_level)?result.risk_level:"medium",findings:Array.isArray(result.findings)?result.findings.slice(0,8):[],recommendations:Array.isArray(result.recommendations)?result.recommendations.slice(0,8):[]});
 }catch(e){return NextResponse.json({error:e instanceof Error&&e.name==="TimeoutError"?"El análisis excedió el tiempo permitido.":"No se pudo generar el análisis de IA."},{status:500});}
}
