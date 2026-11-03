"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Search, ShoppingBag, Menu, X, Play, TrendingUp, Store, Users, ShieldCheck, ChevronRight, Heart, Share2 } from "lucide-react";

const categories = ["Todo", "Tecnología", "Hogar", "Belleza", "Moda", "Accesorios"];
const products = [
  { id: 1, name: "Audífonos inalámbricos Pro", category: "Tecnología", price: "RD$ 895", commission: "RD$ 120", tag: "Más compartido", art: "🎧", bg: "from-violet-100 to-indigo-200" },
  { id: 2, name: "Lámpara LED minimalista", category: "Hogar", price: "RD$ 650", commission: "RD$ 85", tag: "Nuevo", art: "💡", bg: "from-amber-100 to-orange-200" },
  { id: 3, name: "Smartwatch Active", category: "Tecnología", price: "RD$ 1,250", commission: "RD$ 180", tag: "Tendencia", art: "⌚", bg: "from-sky-100 to-cyan-200" },
  { id: 4, name: "Set de cuidado personal", category: "Belleza", price: "RD$ 540", commission: "RD$ 75", tag: "Recomendado", art: "🧴", bg: "from-pink-100 to-rose-200" },
  { id: 5, name: "Mochila urbana", category: "Moda", price: "RD$ 995", commission: "RD$ 140", tag: "Favorito", art: "🎒", bg: "from-lime-100 to-emerald-200" },
  { id: 6, name: "Luz portátil recargable", category: "Accesorios", price: "RD$ 390", commission: "RD$ 55", tag: "Buen precio", art: "🔦", bg: "from-yellow-100 to-lime-200" }
];

export default function Home() {
  const [category, setCategory] = useState("Todo");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const filtered = useMemo(() => products.filter(p => (category === "Todo" || p.category === category) && p.name.toLowerCase().includes(search.toLowerCase())), [category, search]);

  return <main className="min-h-screen overflow-hidden">
    <div className="bg-ink px-4 py-2 text-center text-xs font-semibold tracking-wide text-white">COMPRA LO QUE TE GUSTA. COMPARTE Y GANA.</div>
    <header className="sticky top-0 z-30 border-b border-black/5 bg-paper/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <a href="#" className="flex items-center gap-2"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-lime text-lg font-black">X</span><span className="text-xl font-black tracking-tight">XiiAO<span className="font-medium"> Shop</span></span></a>
        <nav className="hidden items-center gap-8 text-sm font-semibold md:flex"><a href="#explorar" className="hover:opacity-60">Explorar</a><a href="#como-funciona" className="hover:opacity-60">Cómo funciona</a><a href="#creadores" className="hover:opacity-60">Gana compartiendo</a></nav>
        <div className="flex items-center gap-2"><a href="#explorar" className="hidden rounded-full border border-black/10 px-5 py-2.5 text-sm font-bold sm:block">Entrar</a><a href="#creadores" className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-lime hover:text-ink">Únete ahora</a><button aria-label="Abrir menú" onClick={() => setMenuOpen(!menuOpen)} className="rounded-full p-2 md:hidden">{menuOpen ? <X size={20}/> : <Menu size={20}/>}</button></div>
      </div>
      {menuOpen && <div className="border-t border-black/5 bg-paper px-6 py-4 md:hidden"><a className="block py-2" href="#explorar" onClick={() => setMenuOpen(false)}>Explorar</a><a className="block py-2" href="#como-funciona" onClick={() => setMenuOpen(false)}>Cómo funciona</a><a className="block py-2" href="#creadores" onClick={() => setMenuOpen(false)}>Gana compartiendo</a></div>}
    </header>

    <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-20 pt-14 md:grid-cols-[1.02fr_.98fr] md:pb-28 md:pt-20">
      <div><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-bold"><span className="h-2 w-2 rounded-full bg-lime-500"/> EL COMERCIO SE MUEVE CONTIGO</div>
        <h1 className="max-w-2xl text-5xl font-black leading-[.98] tracking-[-.06em] sm:text-6xl lg:text-7xl">Descubre. Comparte. <span className="relative inline-block">Gana.<span className="absolute -bottom-1 left-0 -z-10 h-4 w-full -rotate-2 bg-lime"/></span></h1>
        <p className="mt-7 max-w-lg text-lg leading-8 text-black/60">Una nueva forma de comprar y vender. Encuentra productos que te encantan y gana dinero recomendándolos a tu comunidad.</p>
        <div className="mt-9 flex flex-wrap gap-3"><a href="#explorar" className="inline-flex items-center gap-3 rounded-full bg-ink px-7 py-4 font-bold text-white transition hover:bg-lime hover:text-ink">Explorar productos <ArrowRight size={18}/></a><a href="#creadores" className="rounded-full border border-black/15 px-7 py-4 font-bold">Quiero ganar dinero</a></div>
        <div className="mt-10 flex items-center gap-5 text-xs font-semibold text-black/45"><span className="flex items-center gap-2"><ShieldCheck size={16}/> Compra protegida</span><span className="flex items-center gap-2"><TrendingUp size={16}/> Comisiones por venta</span></div>
      </div>
      <div className="relative mx-auto w-full max-w-xl">
        <div className="absolute -right-3 top-6 h-24 w-24 rounded-full bg-lime blur-2xl"/>
        <div className="relative rounded-[2.2rem] bg-[#20211e] p-4 shadow-soft sm:p-6">
          <div className="flex items-center justify-between px-2 pb-5 text-white"><div><p className="text-xs text-white/45">TU PRÓXIMA RECOMENDACIÓN</p><p className="mt-1 font-bold">Lo que está en tendencia</p></div><span className="rounded-full bg-white/10 p-2"><Play size={16}/></span></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex min-h-48 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-lime-100 to-emerald-300 text-8xl">🎧</div>
            <div className="rounded-2xl bg-white p-4"><p className="text-xs text-black/45">PRECIO</p><p className="mt-1 text-xl font-black">RD$ 895</p><p className="mt-3 text-xs font-semibold text-emerald-700">Disponible para compartir</p></div>
            <div className="rounded-2xl bg-lime p-4"><p className="text-xs text-black/55">TU COMISIÓN</p><p className="mt-1 text-xl font-black">RD$ 120</p><p className="mt-3 text-xs font-semibold">Por venta confirmada</p></div>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-white"><span className="text-sm font-semibold">Comparte este producto</span><span className="rounded-full bg-white p-2 text-black"><Share2 size={16}/></span></div>
        </div>
        <div className="absolute -bottom-5 -left-5 rounded-2xl bg-white px-5 py-4 shadow-soft"><p className="text-xs text-black/45">TU COMUNIDAD, TU INGRESO</p><p className="mt-1 font-black">Cada recomendación cuenta.</p></div>
      </div>
    </section>

    <section id="explorar" className="bg-white py-20"><div className="mx-auto max-w-7xl px-5">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="text-xs font-black uppercase tracking-[.2em] text-black/40">EL CATÁLOGO</p><h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Encuentra tu próximo favorito.</h2></div><div className="relative w-full sm:max-w-xs"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/35" size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar productos..." className="w-full rounded-full border border-black/10 bg-paper py-3 pl-11 pr-4 text-sm outline-none focus:border-black"/></div></div>
      <div className="mt-8 flex gap-2 overflow-x-auto pb-2">{categories.map(c => <button key={c} onClick={() => setCategory(c)} className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-bold transition ${category === c ? "bg-ink text-white" : "bg-paper text-black/60 hover:bg-lime"}`}>{c}</button>)}</div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(p => <article key={p.id} className="group overflow-hidden rounded-[1.7rem] border border-black/5 bg-paper transition hover:-translate-y-1 hover:shadow-soft"><div className={`relative flex h-56 items-center justify-center bg-gradient-to-br ${p.bg} text-7xl`}><span>{p.art}</span><span className="absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider">{p.tag}</span><button aria-label="Guardar producto" className="absolute right-4 top-4 rounded-full bg-white/85 p-2"><Heart size={17}/></button></div><div className="p-5"><p className="text-xs font-bold uppercase tracking-widest text-black/40">{p.category}</p><h3 className="mt-2 text-lg font-black">{p.name}</h3><div className="mt-4 flex items-end justify-between"><div><p className="text-xs text-black/45">Precio</p><p className="text-xl font-black">{p.price}</p></div><div className="text-right"><p className="text-xs text-black/45">Gana por venta</p><p className="font-black text-emerald-700">{p.commission}</p></div></div><button className="mt-5 flex w-full items-center justify-between rounded-full bg-white px-5 py-3 text-sm font-bold transition group-hover:bg-lime">Ver producto <ChevronRight size={17}/></button></div></article>)}</div>
      {filtered.length === 0 && <p className="py-16 text-center text-black/50">No encontramos productos con esa búsqueda.</p>}
      <p className="mt-8 text-center text-xs text-black/40">Catálogo demostrativo inicial. Los productos, precios y comisiones se conectarán al inventario real.</p>
    </div></section>

    <section id="como-funciona" className="mx-auto max-w-7xl px-5 py-20"><div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[.2em] text-black/40">SENCILLO Y TRANSPARENTE</p><h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">El comercio crece cuando todos ganan.</h2></div><div className="mt-12 grid gap-4 md:grid-cols-3"><Step n="01" icon={<ShoppingBag/>} title="Descubre" body="Explora productos de tiendas y comercios en un solo lugar."/><Step n="02" icon={<Share2/>} title="Comparte" body="Recomienda con tu enlace o código personal en tus redes y chats."/><Step n="03" icon={<TrendingUp/>} title="Gana" body="Recibe comisiones cuando la compra se entrega y el pago se confirma."/></div></section>

    <section id="creadores" className="px-5 pb-20"><div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] bg-lime md:grid-cols-2"><div className="p-8 sm:p-12 lg:p-16"><p className="text-xs font-black uppercase tracking-[.2em]">PARA CREADORES Y COMUNIDADES</p><h2 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl">Tu influencia tiene valor. Conviértela en ingresos.</h2><p className="mt-5 max-w-md leading-7 text-black/65">No necesitas tener una tienda ni comprar inventario. Recomienda productos y gana por las ventas que generes.</p><a href="mailto:hola@xiiao.shop?subject=Quiero%20ser%20afiliado" className="mt-8 inline-flex items-center gap-3 rounded-full bg-ink px-7 py-4 font-bold text-white">Quiero ser afiliado <ArrowRight size={18}/></a></div><div className="flex items-center justify-center bg-[#b5df56] p-10"><div className="w-full max-w-sm rounded-[1.7rem] bg-white p-7 shadow-soft"><div className="flex items-center justify-between"><span className="text-sm font-bold">Panel de creador</span><span className="rounded-full bg-lime px-3 py-1 text-xs font-bold">Ejemplo</span></div><p className="mt-8 text-xs text-black/45">COMISIONES GENERADAS</p><p className="mt-1 text-4xl font-black">RD$ 4,850</p><div className="mt-7 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-paper p-4"><Users size={18}/><p className="mt-3 text-2xl font-black">126</p><p className="text-xs text-black/45">Clics</p></div><div className="rounded-2xl bg-paper p-4"><Store size={18}/><p className="mt-3 text-2xl font-black">18</p><p className="text-xs text-black/45">Ventas</p></div></div><p className="mt-5 text-xs leading-5 text-black/45">Las cifras son ilustrativas. El panel real mostrará ventas atribuidas y comisiones verificadas.</p></div></div></div></section>

    <footer className="bg-ink px-5 py-10 text-white"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 sm:flex-row sm:items-center"><div><p className="text-2xl font-black">XiiAO Shop</p><p className="mt-1 text-sm text-white/45">Compra. Comparte. Gana.</p></div><div className="flex flex-wrap gap-5 text-sm text-white/60"><a href="#explorar">Explorar</a><a href="#como-funciona">Cómo funciona</a><a href="mailto:hola@xiiao.shop">Contacto</a></div><p className="text-xs text-white/35">© {new Date().getFullYear()} XiiAO Shop</p></div></footer>
  </main>;
}

function Step({ n, icon, title, body }: { n: string; icon: React.ReactNode; title: string; body: string }) {
  return <div className="rounded-[1.7rem] bg-white p-7"><div className="flex items-center justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-lime">{icon}</span><span className="text-sm font-black text-black/25">{n}</span></div><h3 className="mt-8 text-2xl font-black">{title}</h3><p className="mt-3 leading-7 text-black/55">{body}</p></div>;
}
