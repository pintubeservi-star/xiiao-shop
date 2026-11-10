"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";
import CotuiGoLiveMap from "@/components/cotui-go-live-map";
import { Bike, Package, ShieldCheck, Clock3, Navigation } from "lucide-react";

type Trip = {
  kind: "ride" | "delivery";
  id: string;
  status: string;
  pickup_address: string;
  destination_address: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  destination_lat: number | null;
  destination_lng: number | null;
  driver_name: string | null;
  driver_lat: number | null;
  driver_lng: number | null;
  last_location_at: string | null;
  tracking_code?: string;\n  cancelled_by_role?: string | null;\n  cancellation_reason?: string | null;
};

const labels: Record<string, string> = {
  requested: "Buscando conductor",
  accepted: "Conductor asignado",
  driver_arriving: "Conductor en camino a recogida",
  in_progress: "Viaje en curso",
  picked_up: "Paquete recogido",
  on_the_way: "En camino al destino",
  completed: "Servicio completado",
  delivered: "Entrega completada",
  cancelled: "Servicio cancelado",
};

export default function TrackingPage() {
  const params = useParams();
  const token = String(params.token || "");
  const [trip, setTrip] = useState<Trip | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);\n  const [cancelBusy, setCancelBusy] = useState(false);\n  const [cancelReason, setCancelReason] = useState("Cambio de planes");\n  const [cancelNotice, setCancelNotice] = useState("");

  const load = useCallback(async () => {
    const { data, error: requestError } = await getSupabase().rpc("cg_get_public_trip", { p_token: token });
    if (requestError) throw requestError;
    if (!data) throw new Error("No encontramos este servicio. Verifica el enlace de seguimiento.");
    setTrip(data as Trip);
  }, [token]);

  useEffect(() => {
    let mounted = true, firstLoad = true, inFlight = false;
    const refresh = async () => {
      if (inFlight || !mounted) return;
      inFlight = true;
      try {
        const { data, error: requestError } = await getSupabase().rpc("cg_get_public_trip", { p_token: token });
        if (requestError) throw requestError;
        if (!data) throw new Error("No encontramos este servicio. Verifica el enlace de seguimiento.");
        if (mounted) { setTrip(data as Trip); setError(""); firstLoad = false; setLoading(false); }
      } catch (e) {
        if (mounted && firstLoad) { setError(e instanceof Error ? e.message : "No se pudo cargar el seguimiento."); setLoading(false); }
      } finally { inFlight = false; }
    };
    void refresh();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 2000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => { mounted = false; window.clearInterval(timer); window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onFocus); };
  }, [token]);

  const active = trip ? !["completed", "delivered", "cancelled"].includes(trip.status) : false;\n  const cancelled = trip?.status === "cancelled";\n  const canCancel = trip ? (trip.kind === "ride" ? ["requested","accepted","driver_arriving"].includes(trip.status) : ["requested","accepted"].includes(trip.status)) : false;
  const completed = trip ? ["completed", "delivered"].includes(trip.status) : false;
  async function cancelService() {\n    if (!trip || !canCancel || cancelBusy) return;\n    setCancelBusy(true); setCancelNotice("");\n    try {\n      const { data, error } = await getSupabase().rpc("cg_customer_cancel_service", { p_token: token, p_reason: cancelReason });\n      if (error) throw error;\n      if (!data || data.status !== "cancelled") throw new Error("No se pudo confirmar la cancelación. Actualiza el seguimiento.");\n      setTrip(current => current ? ({ ...current, status: "cancelled", cancellation_reason: cancelReason, cancelled_by_role: "customer" }) : current);\n      setCancelNotice("Servicio cancelado correctamente.");\n    } catch (e) { setCancelNotice(e instanceof Error ? e.message : "No se pudo cancelar el servicio."); }\n    finally { setCancelBusy(false); }\n  }\n\n  const navUrl = trip && trip.driver_lat != null && trip.driver_lng != null
    ? `https://www.google.com/maps/dir/?api=1&origin=${trip.driver_lat},${trip.driver_lng}&destination=${encodeURIComponent(trip.destination_address || trip.pickup_address)}&travelmode=driving`
    : null;

  return (
    <main className="min-h-screen bg-[#f4f6f3] text-slate-900">
      {loading ? (
        <div className="grid min-h-screen place-items-center text-sm font-bold text-slate-500">
          Cargando seguimiento…
        </div>
      ) : error || !trip ? (
        <div className="grid min-h-screen place-items-center p-5">
          <div className="max-w-sm rounded-3xl bg-white p-7 text-center shadow">
            <h1 className="text-xl font-black">Seguimiento no disponible</h1>
            <p className="mt-2 text-sm text-slate-500">{error}</p>
            <Link href="/" className="mt-5 inline-block rounded-xl bg-[#14251d] px-5 py-3 text-sm font-bold text-white">
              Volver a Cotuí Go
            </Link>
          </div>
        </div>
      ) : (
        <>
          <header className="border-b border-slate-200 bg-white px-4 py-4">
            <div className="mx-auto flex max-w-5xl items-center justify-between">
              <Link href="/" className="text-lg font-black">Cotuí <span className="text-lime-600">Go</span></Link>
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Seguimiento en vivo
              </span>
            </div>
          </header>
          <div className="mx-auto max-w-5xl p-3 sm:p-6">
            {!completed && !cancelled && <section className="mb-4 rounded-3xl bg-[#14251d] p-5 text-white">
              <div className="flex items-center gap-2 text-lime-300">
                {trip.kind === "ride" ? <Bike size={19} /> : <Package size={19} />}
                <span className="text-[10px] font-black uppercase tracking-[.2em]">
                  {trip.kind === "ride" ? "Servicio de moto" : "Entrega de paquete"}
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-black">{labels[trip.status] || trip.status}</h1>
              <p className="mt-1 text-xs text-white/65">
                {active ? "La ubicación del conductor se actualiza automáticamente mientras el servicio está activo." : "Este servicio ya finalizó."}
              </p>
            </section>}
            {cancelled && <section className="mb-4 rounded-3xl border border-rose-200 bg-white p-7 text-center shadow-sm"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-100 text-rose-700"><ShieldCheck size={28}/></div><h2 className="mt-4 text-2xl font-black text-slate-900">Servicio cancelado</h2><p className="mt-2 text-sm text-slate-500">{trip.cancellation_reason || "La solicitud fue cancelada."}</p><Link href="/" className="mt-5 inline-flex rounded-xl bg-[#14251d] px-5 py-3 text-xs font-bold text-white">Volver a Cotuí Go</Link></section>}\n            {completed && <section className="mb-4 rounded-3xl border border-lime-200 bg-white p-7 text-center shadow-sm"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-lime-100 text-lime-800"><ShieldCheck size={28}/></div><h2 className="mt-4 text-2xl font-black text-[#14251d]">{trip.kind==="ride"?"¡Gracias por viajar con nosotros!":"¡Gracias por confiar tu envío a Cotuí Go!"}</h2><p className="mt-2 text-sm text-slate-500">Cotuí Go agradece tu preferencia. Esperamos acompañarte nuevamente.</p></section>}
            {!completed && !cancelled && <div className="relative -mx-3 -mt-2 h-[62vh] min-h-[430px] overflow-hidden bg-[#e9eee8] sm:mx-0 sm:rounded-[30px] sm:border sm:border-white sm:shadow-lg">
              <CotuiGoLiveMap
                driver={active ? { lat: trip.driver_lat, lng: trip.driver_lng } : null}
                pickup={active && !["in_progress", "picked_up", "on_the_way"].includes(trip.status) ? { lat: trip.pickup_lat, lng: trip.pickup_lng } : null}
                destination={active ? { lat: trip.destination_lat, lng: trip.destination_lng } : null}
                routeToDestination={trip.status === "in_progress" || trip.status === "on_the_way"}
              />
              <div className="absolute left-1/2 top-[44%] z-[500] w-[min(90%,390px)] -translate-x-1/2 -translate-y-1/2 rounded-[26px] border border-white/80 bg-white/95 p-5 text-slate-900 shadow-[0_18px_55px_rgba(15,35,25,.22)] backdrop-blur-md">
                <p className="text-[9px] font-black uppercase tracking-[.18em] text-lime-700">Cotuí Go · Seguimiento en vivo</p>
                <h2 className="mt-1 text-xl font-black">{labels[trip.status] || trip.status}</h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">{trip.driver_name || "Buscando conductor"}</p>
                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-[11px] leading-5"><b>Destino:</b> {trip.destination_address}</div>
                {canCancel && <div className="mt-3 space-y-2">
                  <select value={cancelReason} onChange={e=>setCancelReason(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs">
                    <option>Cambio de planes</option><option>Me equivoqué en la dirección</option><option>Ya no necesito el servicio</option><option>Demora en la recogida</option><option>Otro motivo</option>
                  </select>
                  <button type="button" disabled={cancelBusy} onClick={cancelService} className="w-full rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-xs font-black text-rose-700 disabled:opacity-50">{cancelBusy?"Cancelando…":"Cancelar servicio"}</button>
                </div>}
                {cancelNotice && <p role="status" className="mt-2 text-[10px] font-semibold text-rose-700">{cancelNotice}</p>}
              </div>
            </div>}
            {!completed && !cancelled && <aside className="mt-4 space-y-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Conductor asignado</p>
                <h2 className="mt-2 text-lg font-black">{trip.driver_name || "Esperando asignación"}</h2>
                <p className="mt-3 text-[10px] text-slate-400">
                  {trip.last_location_at ? "Última actualización: " + new Date(trip.last_location_at).toLocaleTimeString("es-DO") : "Aún no hay ubicación compartida."}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Detalles del servicio</p>
                <p className="mt-3 text-xs"><b>Recogida</b><br />{trip.pickup_address}</p>
                <p className="mt-4 text-xs"><b>Destino</b><br />{trip.destination_address}</p>
                {trip.tracking_code && <p className="mt-4 text-xs font-bold text-lime-700">Código: {trip.tracking_code}</p>}
              </div>
              {active && <div className="rounded-2xl bg-lime-50 p-4 text-xs text-lime-900">
                <ShieldCheck size={16} className="mr-1 inline" /> Este enlace permite consultar únicamente este servicio.
              </div>}
              {navUrl && (
                <a href={navUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-white p-3 text-xs font-bold shadow-sm">
                  <Navigation size={15} /> Abrir ruta en Google Maps
                </a>
              )}
            </aside>}
            {!completed && !cancelled && <p className="mt-5 flex items-center justify-center gap-2 text-[10px] text-slate-400">
              <Clock3 size={13} /> Cotuí Go · Ubicación compartida durante el servicio
            </p>}
          </div>
        </>
      )}
    </main>
  );
}
