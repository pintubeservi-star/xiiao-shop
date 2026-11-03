"use client";

import { ArrowLeft, ArrowRight, Package, Store, ClipboardList, BarChart3 } from "lucide-react";

export default function MerchantPage() {
  return <main className="min-h-screen bg-[#f7f7f5] text-[#191a17]">
    <header className="border-b border-black/5 bg-white px-5 py-4"><div className="mx-auto flex max-w-6xl items-center justify-between"><a href="/" className="text-lg font-black">XiiAO Shop</a><a href="/" className="flex items-center gap-2 text-sm font-semibold text-black/55"><ArrowLeft size={16}/> Volver a la tienda</a></div></header>
    <section className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-2 md:items-center md:py-24">
      <div><span className="rounded-full bg-[#e8f5cc] px-3 py-2 text-[10px] font-black uppercase tracking-widest">Portal para comercios</span><h1 className="mt-6 text-5xl font-black leading-[.98] tracking-tight md:text-6xl">Lleva tu negocio a más compradores.</h1><p className="mt-6 max-w-lg text-lg leading-8 text-black/55">Publica tus productos, administra pedidos y llega a nuevos clientes desde XiiAO Shop.</p><a href="mailto:comercios@xiiao.shop?subject=Quiero%20vender%20en%20XiiAO%20Shop" className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#191a17] px-7 py-4 text-sm font-bold text-white">Solicitar información <ArrowRight size={17}/></a><p className="mt-3 text-xs text-black/40">El registro de comercios y el panel de inventario se habilitarán al completar la plataforma.</p></div>
      <div className="rounded-[2rem] bg-[#20211e] p-7 text-white md:p-10"><p className="text-xs font-black uppercase tracking-widest text-[#c8f169]">Herramientas del comercio</p><div className="mt-6 grid gap-3">
        <Feature icon={<Store/>} title="Tu tienda" body="Perfil comercial y catálogo propio."/>
        <Feature icon={<Package/>} title="Productos e inventario" body="Administra fotos, precios y disponibilidad."/>
        <Feature icon={<ClipboardList/>} title="Pedidos" body="Organiza las compras de tus clientes."/>
        <Feature icon={<BarChart3/>} title="Reportes" body="Consulta el rendimiento de tu tienda."/>
      </div></div>
    </section>
    <footer className="border-t border-black/5 bg-white px-5 py-7 text-center text-xs text-black/40">XiiAO Shop · Portal independiente para comercios</footer>
  </main>;
}

function Feature({icon,title,body}:{icon:React.ReactNode;title:string;body:string}) {
  return <div className="flex gap-4 rounded-2xl bg-white/10 p-5"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 text-[#c8f169]">{icon}</span><div><p className="font-black">{title}</p><p className="mt-1 text-sm leading-5 text-white/55">{body}</p></div></div>;
}
