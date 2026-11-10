"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";
import {
  ArrowLeft, ArrowRight, Bike, Package, ShieldCheck, Mail,
  LockKeyhole, UserRound, Phone, MapPin, Eye, EyeOff
} from "lucide-react";

const field = "w-full rounded-2xl border border-[#dce5df] bg-white px-4 py-3.5 text-[14px] text-[#172820] outline-none transition placeholder:text-[#9aa9a0] focus:border-[#16845b] focus:ring-4 focus:ring-[#16845b]/10";

export default function AccessPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register" | "reset">("login");
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let live = true;
    getSupabase().auth.getUser().then(({ data }) => {
      if (live && data.user) router.replace("/");
    });
    return () => { live = false; };
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const s = getSupabase();
      if (mode === "register") {
        if (form.password.length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres.");
        const { data, error } = await s.auth.signUp({
          email: form.email.trim().toLowerCase(),
          password: form.password,
          options: { data: { full_name: form.name.trim(), phone: form.phone.trim() } }
        });
        if (error) throw error;
        if (data.session) {
          router.replace("/");
          router.refresh();
        } else {
          setNotice("Tu cuenta fue creada. Revisa tu correo y confirma la dirección para activar el acceso a Cotuí Go.");
        }
      } else if (mode === "login") {
        const { error } = await s.auth.signInWithPassword({
          email: form.email.trim().toLowerCase(),
          password: form.password
        });
        if (error) throw error;
        router.replace("/");
        router.refresh();
      } else {
        const { error } = await s.auth.resetPasswordForEmail(
          form.email.trim().toLowerCase(),
          { redirectTo: window.location.origin + "/acceso" }
        );
        if (error) throw error;
        setNotice("Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.");
      }
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "No se pudo completar la operación. Inténtalo nuevamente.");
    } finally {
      setBusy(false);
    }
  }

  const title = mode === "register" ? "Crea tu cuenta" : mode === "reset" ? "Recupera tu acceso" : "Qué bueno tenerte de vuelta";
  const subtitle = mode === "register"
    ? "Regístrate una vez y tendrás tus datos listos para tus próximos viajes y envíos."
    : mode === "reset"
      ? "Te enviaremos un enlace seguro a tu correo."
      : "Entra a tu ciudad. Muévete y envía con Cotuí Go.";

  return (
    <main className="min-h-screen bg-[#f3f6f2] px-3 py-4 text-[#172820] sm:px-6 sm:py-8">
      <div className="mx-auto grid min-h-[min(900px,calc(100vh-2rem))] max-w-6xl overflow-hidden rounded-[30px] border border-white bg-white shadow-[0_28px_90px_rgba(18,45,31,.13)] lg:grid-cols-[1.04fr_.96fr]">
        <aside className="relative isolate flex min-h-[420px] flex-col justify-between overflow-hidden bg-[#102c22] p-6 text-white sm:p-9 lg:min-h-[760px] lg:p-11">
          <div className="absolute inset-0 -z-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/7/7a/Cotui_Dominican_Republic_2.jpg')] bg-cover bg-center opacity-35" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0c211a]/75 via-[#102c22]/45 to-[#0b2119]" />
          <div className="absolute -right-24 top-24 -z-10 h-72 w-72 rounded-full border border-white/10" />
          <div className="absolute -right-12 top-36 -z-10 h-48 w-48 rounded-full border border-white/10" />

          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-white/75 transition hover:text-white">
              <ArrowLeft size={15} /> Volver al inicio
            </Link>
            <div className="mt-12 flex items-center gap-3 sm:mt-16">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#c7f36b] text-[#102c22] shadow-lg shadow-black/20">
                <span className="text-xl font-black tracking-tighter">CG</span>
              </div>
              <div>
                <div className="text-[21px] font-black tracking-tight">COTUÍ <span className="text-[#c7f36b]">GO</span></div>
                <div className="text-[9px] font-bold uppercase tracking-[.25em] text-white/55">Movilidad de aquí</div>
              </div>
            </div>

            <div className="mt-12 max-w-lg sm:mt-16">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#d8f6a5] backdrop-blur-sm">
                <MapPin size={12} /> Hecho para Cotuí
              </div>
              <h1 className="mt-5 text-[38px] font-black leading-[1.04] tracking-[-.04em] sm:text-5xl">
                Tu ciudad<br />se mueve <span className="text-[#c7f36b]">contigo.</span>
              </h1>
              <p className="mt-5 max-w-sm text-sm leading-6 text-white/75 sm:text-[15px]">
                Pide una moto, envía un paquete y llega a donde necesitas. Cotuí está más cerca con Cotuí Go.
              </p>
            </div>
          </div>

          <div className="mt-12">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <Bike size={20} className="text-[#c7f36b]" />
                <p className="mt-3 text-sm font-extrabold">Viajes en moto</p>
                <p className="mt-1 text-[11px] text-white/60">Muévete por Cotuí</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <Package size={20} className="text-[#c7f36b]" />
                <p className="mt-3 text-sm font-extrabold">Envío de paquetes</p>
                <p className="mt-1 text-[11px] text-white/60">Entrega local sencilla</p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 text-[10px] font-medium text-white/45">
              <ShieldCheck size={14} /> Tu cuenta protegida · Tu ciudad conectada
            </div>
            <p className="mt-3 text-[9px] text-white/35">
              Fotografía: Cotuí, República Dominicana · CristoRey99 · CC BY-SA 4.0
            </p>
          </div>
        </aside>

        <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-12">
          <div className="w-full max-w-[410px]">
            <div className="mb-8 flex items-center gap-2 lg:hidden">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#102c22] text-sm font-black text-[#c7f36b]">CG</div>
              <span className="text-lg font-black tracking-tight">COTUÍ <span className="text-[#16845b]">GO</span></span>
            </div>
            <div className="text-[10px] font-black uppercase tracking-[.22em] text-[#16845b]">Acceso de clientes</div>
            <h2 className="mt-3 text-[30px] font-black leading-tight tracking-[-.035em] sm:text-[34px]">{title}</h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-[#718078]">{subtitle}</p>

            {mode !== "reset" && (
              <div className="mt-8 grid grid-cols-2 rounded-2xl bg-[#f1f5f1] p-1">
                <button type="button" onClick={() => { setMode("login"); setNotice(""); }} className={mode === "login" ? "rounded-xl bg-white px-3 py-3 text-xs font-extrabold text-[#17382a] shadow-sm" : "rounded-xl px-3 py-3 text-xs font-bold text-[#7b8980]"}>
                  Iniciar sesión
                </button>
                <button type="button" onClick={() => { setMode("register"); setNotice(""); }} className={mode === "register" ? "rounded-xl bg-white px-3 py-3 text-xs font-extrabold text-[#17382a] shadow-sm" : "rounded-xl px-3 py-3 text-xs font-bold text-[#7b8980]"}>
                  Crear cuenta
                </button>
              </div>
            )}

            <form onSubmit={submit} className="mt-7 space-y-4">
              {mode === "register" && (
                <>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold text-[#405248]">Nombre y apellido</span>
                    <span className="relative block">
                      <UserRound size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#91a097]" />
                      <input required autoComplete="name" className={field + " pl-11"} placeholder="Tu nombre completo" value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))} />
                    </span>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold text-[#405248]">Teléfono de contacto</span>
                    <span className="relative block">
                      <Phone size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#91a097]" />
                      <input required type="tel" autoComplete="tel" className={field + " pl-11"} placeholder="809 000 0000" value={form.phone} onChange={e => setForm(v => ({ ...v, phone: e.target.value }))} />
                    </span>
                  </label>
                </>
              )}

              <label className="block">
                <span className="mb-2 block text-xs font-bold text-[#405248]">Correo electrónico</span>
                <span className="relative block">
                  <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#91a097]" />
                  <input required type="email" autoComplete="email" className={field + " pl-11"} placeholder="tucorreo@ejemplo.com" value={form.email} onChange={e => setForm(v => ({ ...v, email: e.target.value }))} />
                </span>
              </label>

              {mode !== "reset" && (
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-[#405248]">Contraseña</span>
                  <span className="relative block">
                    <LockKeyhole size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#91a097]" />
                    <input required minLength={8} type={showPassword ? "text" : "password"} autoComplete={mode === "register" ? "new-password" : "current-password"} className={field + " pl-11 pr-12"} placeholder="Mínimo 8 caracteres" value={form.password} onChange={e => setForm(v => ({ ...v, password: e.target.value }))} />
                    <button type="button" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setShowPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#91a097]">
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </span>
                </label>
              )}

              {mode === "login" && (
                <div className="flex justify-end">
                  <button type="button" onClick={() => { setMode("reset"); setNotice(""); }} className="text-xs font-bold text-[#16845b] hover:underline">¿Olvidaste tu contraseña?</button>
                </div>
              )}

              <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#123b2b] px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-[#123b2b]/15 transition hover:bg-[#18563d] disabled:opacity-50">
                {busy ? "Procesando…" : mode === "register" ? "Crear mi cuenta" : mode === "reset" ? "Enviar enlace de recuperación" : "Entrar a Cotuí Go"}
                <ArrowRight size={17} />
              </button>
            </form>

            {notice && (
              <p role="status" className="mt-5 rounded-2xl border border-[#cfe6d6] bg-[#f0faf2] p-4 text-sm leading-6 text-[#24553a]">{notice}</p>
            )}

            {mode === "reset" && (
              <button type="button" onClick={() => { setMode("login"); setNotice(""); }} className="mt-5 text-xs font-bold text-[#16845b] hover:underline">Volver a iniciar sesión</button>
            )}

            <div className="mt-8 border-t border-[#edf1ed] pt-5 text-center">
              <p className="text-[11px] leading-5 text-[#8b9890]">Al continuar, aceptas utilizar Cotuí Go de forma responsable y mantener tus datos de acceso seguros.</p>
              <p className="mt-4 text-[10px] font-bold tracking-[.12em] text-[#b1bbb4]">COTUÍ · SÁNCHEZ RAMÍREZ · REPÚBLICA DOMINICANA</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
