"use client";

import { ArrowLeft, ArrowRight, Link2, ChartNoAxesCombined, Wallet } from "lucide-react";

export default function CreatorsPage() {
  return <main className="min-h-screen bg-[#f7f7f5] text-[#191a17]">
    <header className="border-b border-black/5 bg-white px-5 py-4"><div className="mx-auto flex max-w-6xl items-center justify-between"><a href="/" className="text-lg font-black">XiiAO Shop</a><a href="/" className="flex items-center gap-2 text-sm font-semibold text-black/55"><ArrowLeft size={16}/> Volver a la tienda</a></div></header>
    <section className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-2 md:items-center md:py-24">
      <div><span className="rounded-full bg-[#e8f5cc] px-3 py-2 text-[10px] font-black uppercase tracking-widest">Programa de creadores</span><h1 className="mt-6 text-5xl font-black leading-[.98] tracking-tight md:text-6xl">Recomienda. Comparte. Gana.</h1><p className="mt-6 max-w-lg text-lg leading-8 text-black/55">Convierte tus recomendaciones en oportunidades. Comparte productos de XiiAO Shop y gana comisiones por las compras que generes.</p><a href="mailto:creadores@xiiao.shop?subject=Quiero%20unirme%20como%20creador" className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#191a17] px-7 py-4 text-sm font-bold text-white">Solicitar acceso <ArrowRight size={17}/></a><p className="mt-3 text-xs text-black/40">La inscripción y el panel de afiliados se habilitarán al completar la plataforma.</p></div>
      <div className="rounded-[2rem] bg-[#c8f169] p-7 md:p-10"><p className="text-xs font-black uppercase tracking-widest">Tu espacio de creador</p><div className="mt-6 grid gap-3">
        <Feature icon={<Link2/>} title="Tus enlaces" body="Enlaces únicos para compartir productos."/>
        <Feature icon={<ChartNoAxesCombined/>} title="Tus resultados" body="Consulta clics, pedidos y ventas atribuidas."/>
        <Feature icon={<Wallet/>} title="Tus comisiones" body="Revisa comisiones confirmadas y solicitudes de retiro."/>
      </div></div>
    </section>
    <footer className="border-t border-black/5 bg-white px-5 py-7 text-center text-xs text-black/40">XiiAO Shop · Área independiente para creadores</footer>
  </main>;
}

function Feature({icon,title,body}:{icon:React.ReactNode;title:string;body:string}) {
  return <div className="flex gap-4 rounded-2xl bg-white p-5"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#eff6df]">{icon}</span><div><p className="font-black">{title}</p><p className="mt-1 text-sm leading-5 text-black/50">{body}</p></div></div>;
}
