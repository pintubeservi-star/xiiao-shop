"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import CotuiGoMap from "@/components/cotui-go-map";
import { ArrowRight, Bike, CheckCircle2, Clock3, MapPin, Package, Store, Utensils, UserRound, Navigation, LocateFixed, Loader2 } from "lucide-react";

type Service = "food" | "package";
type Point = { lat: number; lng: number };
type Quote = { distance_km: number; fare_dop: number; commission_pct?: number; driver_payout_dop?: number };
const center: Point = { lat: 19.0527, lng: -70.1494 };
const field = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-lime-500 focus:ring-4 focus:ring-lime-100";
const label = "mb-1.5 block text-[10px] font-black uppercase tracking-[.16em] text-slate-500";

async function geocode(address: string): Promise<Point | null> {
  try {
    const response = await fetch("https://photon.komoot.io/api/?q=" + encodeURIComponent(address + ", Cotuí, Dominican Republic") + "&lat=19.0527&lon=-70.1494&limit=1");
    if (!response.ok) return null;
    const data = await response.json();
    const coords = data?.features?.[0]?.geometry?.coordinates;
    return Array.isArray(coords) ? { lng: Number(coords[0]), lat: Number(coords[1]) } : null;
  } catch { return null; }
}

export default function Home() {
  const router = useRouter();
  const [service, setService] = useState<Service>("food");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [authReady, setAuthReady] = useState(false);
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [sender, setSender] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [recipient, setRecipient] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [merchant, setMerchant] = useState("");
  const [items, setItems] = useState("");
  const [description, setDescription] = useState("");
  const [note, setNote] = useState("");
  const [point, setPoint] = useState<Point>(center);
  const [destinationPoint, setDestinationPoint] = useState<Point | null>(null);
  const [mapTarget, setMapTarget] = useState<"pickup" | "destination">("pickup");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [notice, setNotice] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");

  useEffect(() => {
    const supabase = getSupabase();
    let active = true;
    const load = async () => {
      const { data: { user: current } } = await supabase.auth.getUser();
      if (!active) return;
      setUser(current);
      if (current) {
        const { data } = await supabase.from("profiles").select("full_name,phone").eq("id", current.id).maybeSingle();
        if (!active) return;
        setProfile(data || null);
        if (data) { setSender(data.full_name || ""); setSenderPhone(data.phone || ""); setRecipient(data.full_name || ""); recipientPhone || setRecipientPhone(data.phone || ""); }
      }
      setAuthReady(true);
    };
    void load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user || null);
      if (!session?.user) { setProfile(null); setAuthReady(true); }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const canQuote = useMemo(() => pickup.trim().length > 2 && destination.trim().length > 2, [pickup, destination]);

  function pickPoint(p: Point, targetOverride?: "pickup" | "destination") {
    const target = targetOverride || mapTarget;
    setMapTarget(target);
    setQuote(null);
    const value = "Punto del mapa: " + p.lat.toFixed(5) + ", " + p.lng.toFixed(5);
    if (target === "pickup") { setPoint(p); setPickup(value); }
    else { setDestinationPoint(p); setDestination(value); }
  }

  async function locate() {
    setLocating(true); setNotice("");
    try {
      if (!navigator.geolocation) throw new Error("Tu navegador no permite compartir ubicación.");
      const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 18000, maximumAge: 60000 }));
      const p = { lat: position.coords.latitude, lng: position.coords.longitude };
      setPoint(p); setPickup("Punto del mapa: " + p.lat.toFixed(5) + ", " + p.lng.toFixed(5)); setMapTarget("pickup");
      setNotice("Ubicación de recogida detectada.");
    } catch (e: any) { setNotice(e?.code === 1 ? "Permite el acceso a tu ubicación o marca el punto directamente en el mapa." : e instanceof Error ? e.message : "No pudimos obtener tu ubicación."); }
    finally { setLocating(false); }
  }

  async function calculateQuote(): Promise<{ pickupCoords: Point; destinationCoords: Point; data: Quote }> {
    const pickupCoords = pickup.startsWith("Punto del mapa:") ? point : await geocode(pickup);
    const destinationCoords = destinationPoint || (destination.startsWith("Punto del mapa:") ? null : await geocode(destination));
    if (!pickupCoords || !destinationCoords) throw new Error("No pudimos ubicar ambas direcciones. Selecciona los dos puntos en el mapa.");
    let routeDistance: number | null = null;
    try {
      const route = await fetch("https://router.project-osrm.org/route/v1/driving/" + pickupCoords.lng + "," + pickupCoords.lat + ";" + destinationCoords.lng + "," + destinationCoords.lat + "?overview=false");
      const data = await route.json();
      const meters = data?.routes?.[0]?.distance;
      if (route.ok && typeof meters === "number" && meters > 0) routeDistance = meters / 1000;
    } catch {}
    const { data, error } = await getSupabase().rpc("cg_quote_fare", {
      p_service: service === "food" ? "moto" : "package", p_pickup_lat: pickupCoords.lat, p_pickup_lng: pickupCoords.lng,
      p_destination_lat: destinationCoords.lat, p_destination_lng: destinationCoords.lng, p_route_distance_km: routeDistance
    });
    if (error) throw error;
    setQuote(data);
    return { pickupCoords, destinationCoords, data };
  }

  useEffect(() => {
    if (!canQuote) { setQuote(null); return; }
    const timer = window.setTimeout(() => { void calculateQuote().catch(() => setQuote(null)); }, 700);
    return () => window.clearTimeout(timer);
  }, [canQuote, pickup, destination, point.lat, point.lng, destinationPoint?.lat, destinationPoint?.lng]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setNotice(""); setTrackingUrl("");
    if (!user) { router.push("/acceso?next=/"); return; }
    if (service === "food" && (!merchant.trim() || !items.trim())) { setNotice("Indica el restaurante y lo que deseas recibir."); return; }
    setBusy(true);
    try {
      const route = await calculateQuote();
      const fullDescription = service === "food"
        ? "Restaurante: " + merchant.trim() + "\nPedido: " + items.trim() + (note.trim() ? "\nNota: " + note.trim() : "")
        : description.trim() + (note.trim() ? "\nNota: " + note.trim() : "");
      const { data, error } = await getSupabase().from("cg_delivery_requests").insert({
        service_kind: service,
        distance_km: route.data.distance_km,
        pickup_lat: route.pickupCoords.lat, pickup_lng: route.pickupCoords.lng,
        destination_lat: route.destinationCoords.lat, destination_lng: route.destinationCoords.lng,
        sender_name: service === "food" ? merchant.trim() : sender.trim(), sender_phone: senderPhone.trim(),
        recipient_name: recipient.trim(), recipient_phone: recipientPhone.trim(),
        pickup_address: pickup.trim(), delivery_address: destination.trim(),
        package_type: service === "food" ? "comida" : "paquete",
        package_description: fullDescription || null
      }).select("id,tracking_token").single();
      if (error) throw error;
      if (!data?.tracking_token) throw new Error("La solicitud se creó, pero no se generó el enlace de seguimiento.");
      setTrackingUrl(window.location.origin + "/seguimiento/" + data.tracking_token);
      const { data: sessionData } = await getSupabase().auth.getSession();
      if (sessionData.session?.access_token) void fetch("/api/push/new-delivery", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + sessionData.session.access_token }, body: JSON.stringify({ deliveryId: data.id }) }).catch(() => {});
      setNotice("¡Solicitud enviada! Estamos buscando un repartidor disponible.");
    } catch (e) { setNotice(e instanceof Error ? e.message : "No se pudo enviar la solicitud. Intenta nuevamente."); }
    finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-[#f4f6f3] text-slate-900">
    <header className="sticky top-0 z-[700] border-b border-slate-200 bg-white/95 text-slate-950 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5">
        <Link href="/" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-black text-white"><Navigation size={21}/></span><span className="text-xl font-black tracking-tight">Cotuí <span className="text-lime-600">Go</span><small className="block text-[9px] font-bold uppercase tracking-[.22em] text-slate-400">Entregas en tu ciudad</small></span></Link>
        <div className="flex items-center gap-2"><Link href={user ? "/mi-cuenta" : "/acceso"} className="flex items-center gap-2 rounded-full border border-slate-200 px-3.5 py-2.5 text-xs font-bold"><UserRound size={15}/>{user ? "Mi cuenta" : "Entrar"}</Link><Link href="/conductores" className="hidden rounded-full bg-black px-4 py-2.5 text-xs font-black text-white sm:inline-flex"><Bike size={15} className="mr-2"/> Soy repartidor</Link><Link href="/admin/movilidad" className="hidden rounded-full border border-white/20 px-3 py-2.5 text-xs font-bold sm:inline-flex">Administración</Link></div>
      </div>
    </header>

    <section className="relative h-[calc(100svh-65px)] min-h-[690px] overflow-hidden bg-[#e9ece9]">
      <div className="absolute inset-0 bg-[#e9ece9]">
        <CotuiGoMap initial={mapTarget === "pickup" ? point : (destinationPoint || center)} pickup={pickup.startsWith("Punto del mapa:") ? point : null} destination={destinationPoint} target={mapTarget} onPick={pickPoint}/>
        <div className="absolute left-4 top-4 z-[500] rounded-full border border-white bg-white/95 px-3 py-2 text-[10px] font-extrabold text-slate-700 shadow-lg"><MapPin size={13} className="mr-1 inline text-lime-700"/> Cotuí, República Dominicana</div>
        <div className="absolute right-4 top-4 z-[500] flex max-w-[calc(100%-120px)] flex-wrap justify-end gap-2">
          <button type="button" onClick={() => setMapTarget("pickup")} className={"rounded-full px-4 py-3 text-xs font-black shadow-lg " + (mapTarget === "pickup" ? "bg-[#14251d] text-white" : "bg-white text-slate-700")}>Marcar recogida</button>
          <button type="button" onClick={() => setMapTarget("destination")} className={"rounded-full px-4 py-3 text-xs font-black shadow-lg " + (mapTarget === "destination" ? "bg-[#14251d] text-white" : "bg-white text-slate-700")}>Marcar entrega</button>
          <button type="button" onClick={locate} disabled={locating} className="ml-auto flex items-center gap-2 rounded-full bg-lime-400 px-4 py-3 text-xs font-black text-[#14251d] shadow-lg disabled:opacity-60">{locating ? <Loader2 size={14} className="animate-spin"/> : <LocateFixed size={14}/>} Mi ubicación</button>
        </div>
      </div>

      <aside className="absolute bottom-3 left-3 right-3 z-[600] mx-auto max-h-[78svh] w-full max-w-[470px] overflow-y-auto rounded-[28px] border border-white bg-white p-4 shadow-[0_18px_60px_rgba(0,0,0,.20)] sm:bottom-5 sm:left-5 sm:right-auto sm:p-5">
        <div className="mb-5"><p className="text-[10px] font-black uppercase tracking-[.2em] text-slate-500">COTUÍ GO</p><h1 className="mt-1 text-xl font-black tracking-tight">¿A dónde llevamos tu pedido?</h1><p className="mt-1 text-xs text-slate-500">Comida y paquetes, con seguimiento en tiempo real.</p></div>
        <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
          <button type="button" onClick={() => { setService("food"); setQuote(null); setNotice(""); }} className={"flex items-center justify-center gap-2 rounded-xl px-3 py-3.5 text-xs font-black " + (service === "food" ? "bg-black text-white shadow" : "text-slate-600")}><Utensils size={16}/> Comida</button>
          <button type="button" onClick={() => { setService("package"); setQuote(null); setNotice(""); }} className={"flex items-center justify-center gap-2 rounded-xl px-3 py-3.5 text-xs font-black " + (service === "package" ? "bg-[#14251d] text-white shadow" : "text-slate-600")}><Package size={16}/> Paquetes</button>
        </div>
        <form onSubmit={submit} className="space-y-3.5">
          {service === "food" ? <><label className="block"><span className={label}>Restaurante o comercio</span><input required className={field} placeholder="Ej. XiiAO Kitchen" value={merchant} onChange={e => setMerchant(e.target.value)}/></label><label className="block"><span className={label}>¿Qué deseas pedir?</span><textarea required rows={3} className={field} placeholder="Escribe los platos, cantidades y detalles" value={items} onChange={e => setItems(e.target.value)}/></label></> : <label className="block"><span className={label}>¿Qué vamos a transportar?</span><textarea rows={2} className={field} placeholder="Describe el paquete o artículo" value={description} onChange={e => setDescription(e.target.value)}/></label>}
          <div className="grid grid-cols-2 gap-2"><label><span className={label}>Recogida</span><input required className={field} placeholder="Dirección del comercio" value={pickup} onChange={e => { setPickup(e.target.value); setQuote(null); }}/></label><label><span className={label}>Entrega</span><input required className={field} placeholder="Dirección del cliente" value={destination} onChange={e => { setDestination(e.target.value); setDestinationPoint(null); setQuote(null); }}/></label></div>
          <div className="rounded-2xl bg-[#f6f8f5] p-3.5"><div className="mb-2 flex items-center gap-2 text-xs font-black text-slate-700"><Store size={15} className="text-lime-700"/> Datos de contacto</div><div className="grid grid-cols-2 gap-2"><label><span className={label}>Remitente</span><input required className={field} value={sender} onChange={e => setSender(e.target.value)} placeholder="Nombre"/></label><label><span className={label}>Teléfono</span><input required type="tel" className={field} value={senderPhone} onChange={e => setSenderPhone(e.target.value)} placeholder="809..."/></label><label><span className={label}>Recibe</span><input required className={field} value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="Nombre"/></label><label><span className={label}>Teléfono</span><input required type="tel" className={field} value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} placeholder="809..."/></label></div></div>
          <label className="block"><span className={label}>Instrucciones adicionales</span><input className={field} value={note} onChange={e => setNote(e.target.value)} placeholder="Referencia, apartamento, indicaciones…"/></label>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-900">Costo estimado de entrega</span><span className="text-[10px] font-bold text-slate-600">{quote ? quote.distance_km.toFixed(1) + " km" : "Calculando ruta…"}</span></div><div className="mt-1 text-3xl font-black text-[#14251d]">{quote ? "RD$ " + Number(quote.fare_dop).toLocaleString("es-DO") : "—"}</div><p className="mt-1 text-[10px] leading-4 text-slate-500">La tarifa corresponde al servicio de entrega. El costo de la comida se paga al comercio.</p></div>
          {notice && <div role="status" className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-700">{notice}</div>}
          {trackingUrl && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3"><p className="flex items-center gap-2 text-xs font-black text-emerald-900"><CheckCircle2 size={16}/> Solicitud registrada</p><a href={trackingUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-800 underline">Ver seguimiento <ArrowRight size={13}/></a></div>}
          <button disabled={busy || !quote || !canQuote} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-5 py-4 text-sm font-black text-white shadow-lg shadow-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">{busy ? <Loader2 size={17} className="animate-spin"/> : <ArrowRight size={17}/>} {busy ? "Enviando solicitud…" : "Solicitar repartidor"}</button>
          {!authReady ? <p className="text-center text-[10px] text-slate-400">Verificando tu cuenta…</p> : !user ? <p className="text-center text-[10px] text-slate-500">Necesitas iniciar sesión para solicitar una entrega.</p> : <p className="flex items-center justify-center gap-1 text-center text-[10px] text-slate-500"><Clock3 size={12}/> Seguimiento disponible después de asignar repartidor</p>}
        </form>
      </aside>
    </section>
    <footer className="border-t border-slate-200 bg-white px-4 py-6 text-center text-[10px] font-semibold text-slate-400">Cotuí Go · Entregas locales de comida y paquetes · Cotuí, República Dominicana</footer>
  </main>;
}
