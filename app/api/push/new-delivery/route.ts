import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!url || !anon || !serviceKey || !publicKey || !privateKey) return NextResponse.json({ error: "Push no configurado en el servidor" }, { status: 503 });
    const authClient = createClient(url, anon, { global: { headers: { Authorization: "Bearer " + token } }, auth: { persistSession: false } });
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    const { deliveryId } = await request.json();
    if (!deliveryId) return NextResponse.json({ error: "Falta deliveryId" }, { status: 400 });
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data: delivery, error: deliveryError } = await admin.from("cg_delivery_requests").select("id,status,service_kind,pickup_address,estimated_fee_dop").eq("id", deliveryId).single();
    if (deliveryError || !delivery || delivery.status !== "requested") return NextResponse.json({ error: "Entrega no disponible" }, { status: 404 });
    const { data: drivers, error: driversError } = await admin.from("cg_driver_profiles").select("user_id").eq("status", "approved").eq("is_available", true);
    if (driversError) throw driversError;
    const ids = (drivers || []).map((d: { user_id: string }) => d.user_id);
    if (!ids.length) return NextResponse.json({ sent: 0 });
    const { data: subscriptions, error: subscriptionsError } = await admin.from("cg_driver_push_subscriptions").select("id,endpoint,subscription").in("user_id", ids);
    if (subscriptionsError) throw subscriptionsError;
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:soporte@cotui-go.local", publicKey, privateKey);
    const payload = JSON.stringify({ title: delivery.service_kind === "food" ? "Nuevo pedido de comida · Cotuí Go" : "Nuevo paquete · Cotuí Go", body: delivery.pickup_address + " · RD$ " + Number(delivery.estimated_fee_dop || 0).toFixed(0), url: "/conductores", tag: "cotui-go-" + delivery.id });
    const results = await Promise.allSettled((subscriptions || []).map(async (item: any) => {
      try { await webpush.sendNotification(item.subscription, payload); }
      catch (error: any) { if (error?.statusCode === 404 || error?.statusCode === 410) await admin.from("cg_driver_push_subscriptions").delete().eq("id", item.id); throw error; }
    }));
    return NextResponse.json({ sent: results.filter(x => x.status === "fulfilled").length, failed: results.filter(x => x.status === "rejected").length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudieron enviar las notificaciones" }, { status: 500 });
  }
}
