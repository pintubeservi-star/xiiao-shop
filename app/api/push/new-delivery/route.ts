import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const pushSecret = process.env.COTUI_GO_PUSH_SECRET;
    if (!url || !anon || !publicKey || !privateKey || !pushSecret) return NextResponse.json({ error: "Notificaciones push pendientes de configuración" }, { status: 503 });
    const supabase = createClient(url, anon, { global: { headers: { Authorization: "Bearer " + token } }, auth: { persistSession: false } });
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    const { deliveryId } = await request.json();
    if (!deliveryId) return NextResponse.json({ error: "Falta deliveryId" }, { status: 400 });
    const { data: targets, error } = await supabase.rpc("cg_get_available_driver_push_targets", { p_delivery_id: deliveryId, p_secret: pushSecret });
    if (error) throw error;
    const rows = (targets || []) as Array<{subscription_id:string;subscription: any;service_kind:string;pickup_address:string;estimated_fee_dop:number}>;
    if (!rows.length) return NextResponse.json({ sent: 0, message: "No hay repartidores conectados con push habilitado." });
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:soporte@cotui-go.com", publicKey, privateKey);
    const results = await Promise.allSettled(rows.map(item => webpush.sendNotification(item.subscription, JSON.stringify({
      title: item.service_kind === "food" ? "Nuevo pedido de comida · Cotuí Go" : "Nuevo paquete · Cotuí Go",
      body: item.pickup_address + " · RD$ " + Number(item.estimated_fee_dop || 0).toFixed(0),
      url: "/conductores",
      tag: "cotui-go-" + deliveryId
    }))));
    return NextResponse.json({ sent: results.filter(x => x.status === "fulfilled").length, failed: results.filter(x => x.status === "rejected").length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudieron enviar las notificaciones" }, { status: 500 });
  }
}
