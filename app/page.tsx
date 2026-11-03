"use client";

import { useMemo, useState } from "react";
import { Search, ShoppingCart, Menu, X, Heart, ChevronRight, SlidersHorizontal, Truck, ShieldCheck, RotateCcw, Plus, Minus, ArrowRight, Sparkles } from "lucide-react";

const categories = [
  { name: "Todo", icon: "✦" }, { name: "Tecnología", icon: "🎧" }, { name: "Hogar", icon: "🏠" },
  { name: "Belleza", icon: "✨" }, { name: "Moda", icon: "👟" }, { name: "Accesorios", icon: "🎒" }
];

const products = [
  { id: 1, name: "Audífonos inalámbricos Pro", category: "Tecnología", price: 895, oldPrice: 1295, tag: "Más vendido", art: "🎧", bg: "from-violet-100 via-indigo-100 to-blue-200" },
  { id: 2, name: "Lámpara LED minimalista", category: "Hogar", price: 650, oldPrice: 890, tag: "Oferta", art: "💡", bg: "from-amber-100 to-orange-200" },
  { id: 3, name: "Smartwatch Active", category: "Tecnología", price: 1250, oldPrice: 1595, tag: "Tendencia", art: "⌚", bg: "from-sky-100 to-cyan-200" },
  { id: 4, name: "Set de cuidado personal", category: "Belleza", price: 540, oldPrice: 750, tag: "Popular", art: "🧴", bg: "from-pink-100 to-rose-200" },
  { id: 5, name: "Mochila urbana", category: "Moda", price: 995, oldPrice: 1295, tag: "Nuevo", art: "🎒", bg: "from-lime-100 to-emerald-200" },
  { id: 6, name: "Luz portátil recargable", category: "Accesorios", price: 390, oldPrice: 550, tag: "Buen precio", art: "🔦", bg: "from-yellow-100 to-lime-200" },
  { id: 7, name: "Mini bocina Bluetooth", category: "Tecnología", price: 750, oldPrice: 990, tag: "Oferta", art: "🔊", bg: "from-fuchsia-100 to-purple-200" },
  { id: 8, name: "Organizador multiuso", category: "Hogar", price: 475, oldPrice: 650, tag: "Favorito", art: "🧺", bg: "from-teal-100 to-emerald-200" }
];

const money = (value: number) => "RD$ " + value.toLocaleString("es-DO");

export default function Home() {
  const [category, setCategory] = useState("Todo");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [cart, setCart] = useState<number[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const filtered = useMemo(() => products.filter(p =>
    (category === "Todo" || p.category === category) && p.name.toLowerCase().includes(search.toLowerCase())
  ), [category, search]);

  const addToCart = (id: number) => setCart(current => [...current, id]);
  const cartProducts = cart.map(id => products.find(p => p.id === id)!).filter(Boolean);
  const total = cartProducts.reduce((sum, p) => sum + p.price, 0);

  return <main className="min-h-screen bg-[#f7f7f5] pb-20 text-[#171814] md:pb-0">
    <div className="bg-[#191a17] px-4 py-2 text-center text-[11px] font-semibold tracking-wide text-white">COMPRA FÁCIL · PAGA AL RECIBIR · ENVÍOS EN REPÚBLICA DOMINICANA</div>
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:px-6">
        <button aria-label="Abrir menú" onClick={() => setMenuOpen(!menuOpen)} className="rounded-xl p-2 hover:bg-black/5 md:hidden">{menuOpen ? <X size={21}/> : <Menu size={21}/>}</button>
        <a href="/" className="flex shrink-0 items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#c8f169] text-lg font-black">X</span><span className="text-xl font-black tracking-tight">XiiAO<span className="font-medium"> Shop</span></span></a>
        <div className="relative mx-auto hidden w-full max-w-2xl md:block"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/35" size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="¿Qué estás buscando hoy?" className="w-full rounded-full border border-black/10 bg-[#f7f7f5] py-3 pl-11 pr-5 text-sm outline-none transition focus:border-black/40"/></div>
        <button onClick={() => setCartOpen(true)} className="relative ml-auto flex items-center gap-2 rounded-full bg-[#191a17] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#30322a]"><ShoppingCart size={18}/><span className="hidden sm:inline">Mi carrito</span>{cart.length > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#c8f169] px-1 text-[10px] font-black text-black">{cart.length}</span>}</button>
      </div>
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 md:px-6">
        {categories.map(c => <button key={c.name} onClick={() => setCategory(c.name)} className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${category === c.name ? "bg-[#191a17] text-white" : "bg-[#f1f1ed] text-black/65 hover:bg-[#e8efda]"}`}><span>{c.icon}</span>{c.name}</button>)}
      </div>
      {menuOpen && <div className="border-t border-black/5 bg-white px-5 py-4 md:hidden"><p className="mb-3 text-xs font-bold uppercase tracking-widest text-black/40">Explora la tienda</p>{categories.map(c => <button key={c.name} onClick={() => {setCategory(c.name);setMenuOpen(false)}} className="block w-full py-2 text-left text-sm font-semibold">{c.icon}　{c.name}</button>)}</div>}
      <div className="relative px-4 pb-3 md:hidden"><Search className="absolute left-7 top-1/2 -translate-y-1/2 text-black/35" size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar en XiiAO Shop" className="w-full rounded-full bg-[#f3f3ef] py-3 pl-11 pr-4 text-sm outline-none"/></div>
    </header>

    <div className="mx-auto max-w-7xl px-4 pt-5 md:px-6 md:pt-7">
      <section className="relative overflow-hidden rounded-[1.7rem] bg-[#c8f169] px-6 py-8 sm:px-10 md:rounded-[2rem] md:px-14 md:py-12">
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-black/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest"><Sparkles size={13}/> Descubre algo nuevo</span>
          <h1 className="mt-5 max-w-lg text-4xl font-black leading-[.98] tracking-[-.055em] sm:text-5xl md:text-6xl">Eso que quieres, está aquí.</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-black/65 md:text-base">Encuentra productos para tu día a día a precios que te van a gustar.</p>
          <a href="#productos" className="mt-6 inline-flex items-center gap-3 rounded-full bg-[#191a17] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-black">Comprar ahora <ArrowRight size={17}/></a>
        </div>
        <div className="pointer-events-none absolute -right-4 -top-10 hidden h-80 w-80 items-center justify-center rounded-full border-[36px] border-white/20 text-[9rem] lg:flex">🛍️</div>
        <div className="pointer-events-none absolute -bottom-20 right-16 h-56 w-56 rounded-full bg-white/20 blur-2xl"/>
      </section>

      <section className="mt-5 grid grid-cols-3 gap-2 md:gap-3">
        <Benefit icon={<Truck size={18}/>} title="Entrega a domicilio" detail="En zonas disponibles"/>
        <Benefit icon={<ShieldCheck size={18}/>} title="Compra segura" detail="Atención al cliente"/>
        <Benefit icon={<RotateCcw size={18}/>} title="Compra sencilla" detail="Proceso rápido"/>
      </section>

      <section id="productos" className="scroll-mt-40 pt-9 md:pt-12">
        <div className="flex items-end justify-between gap-3">
          <div><p className="text-[10px] font-black uppercase tracking-[.2em] text-black/40">PARA TI</p><h2 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">{category === "Todo" ? "Lo más buscado" : category}</h2><p className="mt-1 text-xs text-black/45">Productos que vale la pena descubrir</p></div>
          <div className="hidden items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-black/60 sm:flex"><SlidersHorizontal size={14}/> Explorar</div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 lg:grid-cols-4">
          {filtered.map(p => <article key={p.id} className="group overflow-hidden rounded-2xl border border-black/5 bg-white transition duration-200 hover:-translate-y-1 hover:shadow-[0_14px_35px_rgba(0,0,0,.08)] md:rounded-[1.4rem]">
            <div className={`relative flex aspect-square items-center justify-center bg-gradient-to-br ${p.bg} text-6xl sm:text-7xl`}>
              <span className="transition duration-300 group-hover:scale-110">{p.art}</span>
              <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide">{p.tag}</span>
              <button aria-label="Guardar producto" onClick={() => setFavorites(old => old.includes(p.id) ? old.filter(id => id !== p.id) : [...old, p.id])} className="absolute right-2 top-2 rounded-full bg-white/90 p-2 transition hover:scale-110"><Heart size={16} className={favorites.includes(p.id) ? "fill-rose-500 text-rose-500" : "text-black/65"}/></button>
            </div>
            <div className="p-3.5 md:p-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-black/40">{p.category}</p>
              <h3 className="mt-1.5 min-h-10 text-sm font-bold leading-5 md:text-[15px]">{p.name}</h3>
              <div className="mt-3 flex flex-wrap items-baseline gap-2"><span className="text-lg font-black tracking-tight md:text-xl">{money(p.price)}</span><span className="text-[10px] text-black/35 line-through">{money(p.oldPrice)}</span></div>
              <button onClick={() => addToCart(p.id)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#191a17] py-2.5 text-xs font-bold text-white transition hover:bg-[#c8f169] hover:text-black"><Plus size={15}/> Añadir al carrito</button>
            </div>
          </article>)}
        </div>
        {filtered.length === 0 && <div className="rounded-2xl bg-white py-16 text-center"><p className="font-bold">No encontramos ese producto.</p><p className="mt-1 text-sm text-black/45">Prueba con otra palabra o categoría.</p><button onClick={() => {setSearch("");setCategory("Todo")}} className="mt-4 text-sm font-bold underline">Ver todos los productos</button></div>}
        <p className="mt-6 text-center text-[10px] text-black/35">Catálogo demostrativo. Los productos y precios se sustituirán por el inventario real de los comercios.</p>
      </section>

      <section className="mt-12 overflow-hidden rounded-[1.7rem] bg-[#20211e] px-6 py-7 text-white md:mt-16 md:flex md:items-center md:justify-between md:px-10">
        <div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#c8f169]">XiiAO SHOP</p><h2 className="mt-2 text-2xl font-black">¿Listo para encontrar algo bueno?</h2><p className="mt-1 text-sm text-white/55">Explora el catálogo y descubre tus favoritos.</p></div>
        <a href="#productos" className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#c8f169] px-5 py-3 text-sm font-black text-black md:mt-0">Seguir comprando <ChevronRight size={17}/></a>
      </section>
    </div>

    <footer className="mt-14 border-t border-black/5 bg-white px-5 py-9">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div><p className="text-xl font-black">XiiAO Shop</p><p className="mt-1 text-xs text-black/45">Una tienda para descubrir y comprar.</p></div>
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-black/55"><a href="/ayuda">Ayuda y contacto</a><a href="/comercios">Vende tus productos</a><a href="/creadores">Programa de creadores</a><a href="/privacidad">Privacidad</a></div>
        <p className="text-[10px] text-black/35">© {new Date().getFullYear()} XiiAO Shop</p>
      </div>
    </footer>

    <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-4 border-t border-black/10 bg-white/95 px-2 py-2 backdrop-blur md:hidden">
      <a href="/" className="flex flex-col items-center gap-1 py-1 text-[10px] font-bold"><span className="text-lg">⌂</span>Inicio</a>
      <a href="#productos" className="flex flex-col items-center gap-1 py-1 text-[10px] font-semibold text-black/55"><Search size={19}/>Buscar</a>
      <button onClick={() => setCartOpen(true)} className="flex flex-col items-center gap-1 py-1 text-[10px] font-semibold text-black/55"><ShoppingCart size={19}/>Carrito {cart.length > 0 && `(${cart.length})`}</button>
      <a href="/cuenta" className="flex flex-col items-center gap-1 py-1 text-[10px] font-semibold text-black/55"><span className="text-lg">♙</span>Cuenta</a>
    </nav>

    {cartOpen && <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setCartOpen(false)}>
      <aside onClick={e => e.stopPropagation()} className="flex h-full w-full max-w-md flex-col bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/10 pb-4"><div><p className="text-lg font-black">Mi carrito</p><p className="text-xs text-black/45">{cart.length} producto(s)</p></div><button onClick={() => setCartOpen(false)} aria-label="Cerrar carrito" className="rounded-full bg-black/5 p-2"><X size={19}/></button></div>
        <div className="flex-1 overflow-y-auto py-4">{cartProducts.length === 0 ? <div className="py-20 text-center"><ShoppingCart className="mx-auto text-black/20" size={40}/><p className="mt-4 font-bold">Tu carrito está vacío</p><p className="mt-1 text-sm text-black/45">Agrega productos para comenzar.</p></div> : cartProducts.map((p, i) => <div key={`${p.id}-${i}`} className="flex items-center gap-3 border-b border-black/5 py-3"><div className={`grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${p.bg} text-3xl`}>{p.art}</div><div className="min-w-0 flex-1"><p className="text-sm font-bold">{p.name}</p><p className="mt-1 font-black">{money(p.price)}</p></div><button aria-label="Quitar producto" onClick={() => setCart(old => {const next=[...old];next.splice(i,1);return next})} className="rounded-full p-2 text-black/40 hover:bg-black/5"><Minus size={16}/></button></div>)}</div>
        <div className="border-t border-black/10 pt-4"><div className="flex justify-between text-sm"><span className="text-black/55">Subtotal</span><b className="text-lg">{money(total)}</b></div><button disabled={cart.length === 0} onClick={() => alert("El checkout se habilitará cuando conectemos los pedidos y los métodos de pago.")} className="mt-4 w-full rounded-full bg-[#191a17] py-4 text-sm font-black text-white disabled:opacity-30">Continuar compra</button><p className="mt-3 text-center text-[10px] text-black/40">El proceso de pago se habilitará al conectar el sistema de pedidos.</p></div>
      </aside>
    </div>}
  </main>;
}

function Benefit({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return <div className="flex min-w-0 items-center gap-2 rounded-xl bg-white p-3 md:gap-3 md:rounded-2xl md:p-4"><span className="shrink-0 text-black/70">{icon}</span><div className="min-w-0"><p className="truncate text-[10px] font-black md:text-xs">{title}</p><p className="hidden truncate text-[10px] text-black/40 sm:block">{detail}</p></div></div>;
}
