"use client";
import { useEffect,useMemo,useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";

type Product={id:string;name:string;slug:string;description:string|null;category:string;price_dop:number;compare_at_price_dop:number|null;stock:number;image_urls:string[];tags?:string[];specifications?:Record<string,string>;is_featured?:boolean;video_url?:string|null;wholesale_price_dop?:number|null;wholesale_min_qty?:number};
type Line={product:Product;quantity:number};
const money=(n:number)=>"RD$ "+Number(n).toLocaleString("es-DO");
export default function Home(){
 const [products,setProducts]=useState<Product[]>([]),[categories,setCategories]=useState<string[]>([]);
 const [category,setCategory]=useState("Todos"),[search,setSearch]=useState(""),[sort,setSort]=useState("featured"),[showSaved,setShowSaved]=useState(false),[favorites,setFavorites]=useState<string[]>([]),[recentIds,setRecentIds]=useState<string[]>([]),[selected,setSelected]=useState<Product|null>(null),[galleryIndex,setGalleryIndex]=useState(0),[reviews,setReviews]=useState<any[]>([]),[ratingSummary,setRatingSummary]=useState<Record<string,{avg:number;count:number}>>({}),[reviewOrders,setReviewOrders]=useState<any[]>([]),[reviewOrder,setReviewOrder]=useState(""),[reviewRating,setReviewRating]=useState(5),[reviewTitle,setReviewTitle]=useState(""),[reviewBody,setReviewBody]=useState(""),[compareIds,setCompareIds]=useState<string[]>([]),[compareOpen,setCompareOpen]=useState(false);
 const [cart,setCart]=useState<Line[]>([]),[cartOpen,setCartOpen]=useState(false),[checkout,setCheckout]=useState(false);
 const [loading,setLoading]=useState(true),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 const [order,setOrder]=useState<{order_number:number;total_dop:number;discount_dop?:number;coupon_code?:string|null}|null>(null);
 const [form,setForm]=useState({name:"",phone:"",address:"",sector:"",reference:""});
 const [affiliateCode,setAffiliateCode]=useState(""),[couponCode,setCouponCode]=useState(""),[shippingFee,setShippingFee]=useState(150),[promoBanner,setPromoBanner]=useState(""),[promoActive,setPromoActive]=useState(false);
  useEffect(()=>{
  try{
   setFavorites(JSON.parse(localStorage.getItem("xiiao_favorites")||"[]"));
   setRecentIds(JSON.parse(localStorage.getItem("xiiao_recent")||"[]"));
   setCart(JSON.parse(localStorage.getItem("xiiao_cart")||"[]"));
  }catch{}
 },[]);
 useEffect(()=>{try{localStorage.setItem("xiiao_favorites",JSON.stringify(favorites));}catch{}},[favorites]);
 useEffect(()=>{try{localStorage.setItem("xiiao_cart",JSON.stringify(cart));}catch{}},[cart]);
 useEffect(()=>{if(selected)void loadSelectedDetails(selected);},[selected]);
 useEffect(()=>{
  let alive=true;
  async function load(){
   try{
    const s=getSupabase();
    const [p,cats,settings,reviewRows]=await Promise.all([
     s.from("products").select("id,name,slug,description,category,price_dop,compare_at_price_dop,stock,image_urls,tags,specifications,is_featured,video_url,wholesale_price_dop,wholesale_min_qty").eq("status","published").gt("stock",0).order("created_at",{ascending:false}),
     s.from("categories").select("name").eq("is_active",true).order("sort_order"),
     s.from("store_settings").select("key,value").in("key",["shipping_public","promotions_public"]),
     s.from("product_reviews").select("product_id,rating").eq("status","published")
    ]);
    if(p.error)throw p.error;
    if(cats.error)throw cats.error;
    if(!alive)return;
    setProducts(p.data||[]);
    setCategories((cats.data||[]).map(x=>x.name));
    const totals:Record<string,{sum:number;count:number}>={};
    (reviewRows.data||[]).forEach((r:any)=>{
     if(!totals[r.product_id])totals[r.product_id]={sum:0,count:0};
     totals[r.product_id].sum+=r.rating;
     totals[r.product_id].count++;
    });
    const summaries:Record<string,{avg:number;count:number}>={};
    Object.entries(totals).forEach(([id,v])=>{summaries[id]={avg:v.sum/v.count,count:v.count};});
    setRatingSummary(summaries);
    const map:Record<string,any>={};
    (settings.data||[]).forEach((x:any)=>{map[x.key]=x.value||{};});
    setShippingFee(Number(map.shipping_public?.default_shipping_dop??150));
    setPromoBanner(map.promotions_public?.banner_text||"");
    setPromoActive(Boolean(map.promotions_public?.active));
   }catch(e){
    if(alive)setNotice(e instanceof Error?e.message:"No se pudo cargar el catálogo.");
   }finally{if(alive)setLoading(false);}
  }
  void load();
  return ()=>{alive=false;};
 },[]);
 useEffect(()=>{
  try{
   const params=new URLSearchParams(window.location.search);
   const incoming=params.get("ref");
   const code=incoming||window.localStorage.getItem("xiiao_affiliate_code")||"";
   if(incoming)window.localStorage.setItem("xiiao_affiliate_code",incoming);
   if(code){
    setAffiliateCode(code);
    let visitor=window.localStorage.getItem("xiiao_visitor_key");
    if(!visitor){visitor=crypto.randomUUID();window.localStorage.setItem("xiiao_visitor_key",visitor);}
    void getSupabase().functions.invoke("record-affiliate-click",{body:{code,visitor_key:visitor,landing_path:window.location.pathname}});
   }
  }catch{}
 },[]);
 async function loadReviews(id:string){
  const {data}=await getSupabase().from("product_reviews").select("id,rating,title,body,created_at").eq("product_id",id).eq("status","published").order("created_at",{ascending:false}).limit(30);
  setReviews(data||[]);
 }
 async function loadSelectedDetails(p:Product){
  await loadReviews(p.id);
  setReviewOrders([]);
  setReviewOrder("");
  const {data:{user}}=await getSupabase().auth.getUser();
  if(!user)return;
  const {data:orders}=await getSupabase().from("orders").select("id,order_number").eq("customer_id",user.id).eq("status","delivered");
  const ids=(orders||[]).map(x=>x.id);
  if(!ids.length)return;
  const {data:items}=await getSupabase().from("order_items").select("order_id").eq("product_id",p.id).in("order_id",ids);
  const eligible=new Set((items||[]).map(x=>x.order_id));
  setReviewOrders((orders||[]).filter(x=>eligible.has(x.id)));
 }
 const filtered=useMemo(()=>{
  let list=products.filter(p=>(category==="Todos"||p.category===category)&&(p.name+" "+(p.description||"")+" "+(p.tags||[]).join(" ")).toLowerCase().includes(search.toLowerCase())&&(!showSaved||favorites.includes(p.id)));
  return list.sort((a,b)=>{
   if(sort==="price_low")return a.price_dop-b.price_dop;
   if(sort==="price_high")return b.price_dop-a.price_dop;
   if(sort==="discount")return ((b.compare_at_price_dop||b.price_dop)-b.price_dop)-((a.compare_at_price_dop||a.price_dop)-a.price_dop);
   if(sort==="newest")return 0;
   return Number(Boolean(b.is_featured))-Number(Boolean(a.is_featured));
  });
 },[products,category,search,sort,showSaved,favorites]);
 const priceFor=(p:Product,q:number)=>p.wholesale_price_dop&&q>=(p.wholesale_min_qty||3)?Number(p.wholesale_price_dop):Number(p.price_dop);
 const count=cart.reduce((n,x)=>n+x.quantity,0);
 const subtotal=cart.reduce((n,x)=>n+priceFor(x.product,x.quantity)*x.quantity,0);
 const recentProducts=recentIds.map(id=>products.find(p=>p.id===id)).filter((p):p is Product=>Boolean(p));
 const featuredProducts=products.filter(p=>p.is_featured).slice(0,8);
 const interestCategories=[...recentProducts,...products.filter(p=>favorites.includes(p.id))].map(p=>p.category);
 const recommendedProducts=products.filter(p=>!recentIds.includes(p.id)&&!favorites.includes(p.id)).sort((a,b)=>{
  const score=(p:Product)=>interestCategories.filter(x=>x===p.category).length*3+(p.is_featured?2:0)+(p.compare_at_price_dop&&p.compare_at_price_dop>p.price_dop?1:0);
  return score(b)-score(a);
 }).slice(0,8);
 const videoProducts=products.filter(p=>p.video_url).slice(0,8);
 const compareProducts=compareIds.map(id=>products.find(p=>p.id===id)).filter((p):p is Product=>Boolean(p));
 function toggleCompare(id:string){setCompareIds(old=>old.includes(id)?old.filter(x=>x!==id):old.length>=3?old:[...old,id]);}
 function toggleFavorite(id:string){setFavorites(old=>old.includes(id)?old.filter(x=>x!==id):[...old,id]);}
 function viewProduct(p:Product){
  setSelected(p);setGalleryIndex(0);
  setRecentIds(old=>{
   const next=[p.id,...old.filter(x=>x!==p.id)].slice(0,12);
   try{localStorage.setItem("xiiao_recent",JSON.stringify(next));}catch{}
   return next;
  });
 }
 async function submitReview(e:React.FormEvent){
  e.preventDefault();
  if(!selected||!reviewOrder)return;
  const {data:{user}}=await getSupabase().auth.getUser();
  if(!user){setNotice("Inicia sesión para dejar una reseña.");return;}
  const {error}=await getSupabase().from("product_reviews").insert({product_id:selected.id,customer_id:user.id,order_id:reviewOrder,rating:reviewRating,title:reviewTitle,body:reviewBody,status:"pending"});
  if(error){setNotice(error.message);return;}
  setNotice("Reseña enviada. Se publicará después de revisión.");
  setReviewOrder("");setReviewTitle("");setReviewBody("");
 }
 function add(p:Product){
  setCart(old=>{
   const found=old.find(x=>x.product.id===p.id);
   return found?old.map(x=>x.product.id===p.id?{...x,quantity:Math.min(x.quantity+1,p.stock)}:x):[...old,{product:p,quantity:1}];
  });
  setNotice("");
 }
 function qty(id:string,d:number){
  setCart(old=>old.map(x=>x.product.id===id?{...x,quantity:Math.max(0,Math.min(x.product.stock,x.quantity+d))}:x).filter(x=>x.quantity>0));
 }
 async function placeOrder(e:React.FormEvent){
  e.preventDefault();setBusy(true);setNotice("");
  try{
   const s=getSupabase();
   const {data,error}=await s.functions.invoke("create-order",{body:{
    customer_name:form.name,customer_phone:form.phone,
    shipping_address:{address:form.address,sector:form.sector,reference:form.reference},
    items:cart.map(x=>({product_id:x.product.id,quantity:x.quantity})),
    shipping_dop:shippingFee,affiliate_code:affiliateCode||null,coupon_code:couponCode.trim().toUpperCase()||null
   }});
   if(error)throw error;
   setOrder({order_number:data.order_number,total_dop:Number(data.total_dop),discount_dop:Number(data.discount_dop||0),coupon_code:data.coupon_code||null});
   setCart([]);setCheckout(false);setCartOpen(false);
   setForm({name:"",phone:"",address:"",sector:"",reference:""});setCouponCode("");
   const {data:latest}=await getSupabase().from("products").select("id,name,slug,description,category,price_dop,compare_at_price_dop,stock,image_urls,tags,specifications,is_featured,video_url,wholesale_price_dop,wholesale_min_qty").eq("status","published").gt("stock",0).order("created_at",{ascending:false});
   setProducts(latest||[]);
  }catch(e){setNotice(e instanceof Error?e.message:"No se pudo registrar el pedido.");}
  finally{setBusy(false);}
 }
return <main className="min-h-screen bg-[#f7f7f5] pb-16 text-[#171814]"><div className="bg-[#191a17] px-4 py-2 text-center text-[11px] font-semibold tracking-wide text-white">COMPRA FÁCIL · PAGA AL RECIBIR · ENVÍOS EN REPÚBLICA DOMINICANA</div>{promoActive&&promoBanner&&<div className="bg-[#c8f169] px-4 py-2 text-center text-xs font-black">{promoBanner}</div>}
 <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4"><Link href="/" className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#c8f169] text-lg font-black">X</span><span className="text-xl font-black">XiiAO <span className="font-medium">Shop</span></span></Link><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="¿Qué estás buscando?" className="mx-auto hidden w-full max-w-2xl rounded-full border bg-[#f7f7f5] px-5 py-3 text-sm md:block"/><Link href="/cuenta" className="ml-auto rounded-full border px-4 py-3 text-sm font-bold">Mi cuenta</Link><button onClick={()=>setCartOpen(true)} className="rounded-full bg-[#191a17] px-4 py-3 text-sm font-bold text-white">Carrito ({count})</button></div><div className="px-4 pb-3 md:hidden"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar productos" className="w-full rounded-full border bg-[#f7f7f5] px-4 py-2.5 text-sm"/></div></header>
 <section className="mx-auto max-w-7xl px-4 pt-8"><div className="overflow-hidden rounded-[2rem] bg-[#191a17] px-6 py-10 text-white md:px-12 md:py-16"><p className="text-xs font-bold uppercase tracking-[.25em] text-[#c8f169]">Descubre · Elige · Recibe</p><h1 className="mt-4 max-w-2xl text-4xl font-black leading-tight md:text-6xl">Lo que buscas, <span className="text-[#c8f169]">a un clic.</span></h1><p className="mt-4 max-w-xl text-sm text-white/70 md:text-base">Compra en línea de forma sencilla. Recibe tu pedido y paga al momento de la entrega.</p><button onClick={()=>document.getElementById("catalogo")?.scrollIntoView({behavior:"smooth"})} className="mt-7 rounded-full bg-[#c8f169] px-6 py-3 text-sm font-black text-black">Explorar productos</button></div></section>
 <section id="catalogo" className="mx-auto max-w-7xl px-4 py-10"><div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-gray-500">Catálogo conectado</p><h2 className="mt-1 text-3xl font-black">Productos disponibles</h2></div><Link href="/admin/login" className="text-xs text-gray-500 underline">Administración</Link></div>
 <div className="mb-4 flex flex-wrap items-center gap-2"><button onClick={()=>setShowSaved(false)} className={!showSaved?"rounded-full bg-black px-4 py-2 text-xs font-bold text-white":"rounded-full border bg-white px-4 py-2 text-xs"}>Descubrir</button><button onClick={()=>setShowSaved(true)} className={showSaved?"rounded-full bg-black px-4 py-2 text-xs font-bold text-white":"rounded-full border bg-white px-4 py-2 text-xs"}>♡ Guardados ({favorites.length})</button><select value={sort} onChange={e=>setSort(e.target.value)} className="ml-auto rounded-full border bg-white px-4 py-2 text-xs"><option value="featured">Recomendados</option><option value="newest">Más recientes</option><option value="price_low">Menor precio</option><option value="price_high">Mayor precio</option><option value="discount">Mejores descuentos</option></select></div><div className="mb-6 flex gap-2 overflow-x-auto pb-2"><button onClick={()=>setCategory("Todos")} className={category==="Todos"?"rounded-full bg-black px-4 py-2 text-sm text-white":"rounded-full border bg-white px-4 py-2 text-sm"}>Todos</button>{categories.map(c=><button key={c} onClick={()=>setCategory(c)} className={category===c?"rounded-full bg-black px-4 py-2 text-sm text-white":"rounded-full border bg-white px-4 py-2 text-sm"}>{c}</button>)}</div>
 {notice&&<p className="mb-4 rounded-xl bg-white p-3 text-sm">{notice}</p>}{loading?<p className="py-16 text-center text-gray-500">Cargando catálogo…</p>:filtered.length===0?<div className="rounded-2xl bg-white p-12 text-center text-gray-500">{products.length?"No encontramos productos con esa búsqueda.":"Todavía no hay productos publicados. Vuelve pronto."}</div>:<div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 md:gap-5">{filtered.map(p=><article key={p.id} className="group overflow-hidden rounded-2xl bg-white shadow-sm"><div className="relative aspect-square cursor-pointer bg-gray-100" onClick={()=>viewProduct(p)}>{p.image_urls?.[0]?<img src={p.image_urls[0]} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"/>:<div className="grid h-full place-items-center text-4xl">📦</div>}{p.compare_at_price_dop&&p.compare_at_price_dop>p.price_dop&&<span className="absolute left-2 top-2 rounded-full bg-[#c8f169] px-2 py-1 text-[10px] font-black">-{Math.round((1-p.price_dop/p.compare_at_price_dop)*100)}%</span>}<button aria-label="Guardar producto" onClick={e=>{e.stopPropagation();toggleFavorite(p.id);}} className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-lg shadow">{favorites.includes(p.id)?"♥":"♡"}</button></div><div className="p-3 md:p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{p.category}</p><button onClick={()=>viewProduct(p)} className="mt-1 line-clamp-2 min-h-10 text-left text-sm font-bold">{p.name}</button><div className="mt-2 flex flex-wrap items-center gap-2"><b className="text-base">{money(p.price_dop)}</b>{p.compare_at_price_dop&&<del className="text-xs text-gray-400">{money(p.compare_at_price_dop)}</del>}</div><p className="mt-1 text-[10px] text-amber-600">{ratingSummary[p.id]?`★ ${ratingSummary[p.id].avg.toFixed(1)} · ${ratingSummary[p.id].count} opiniones`:"Aún sin opiniones"}</p><p className="mt-1 text-[10px] text-gray-400">{p.wholesale_price_dop&&<span className="font-bold text-emerald-700">Precio mayor desde {p.wholesale_min_qty||3} unidades: {money(p.wholesale_price_dop)}</span>}{p.stock<5?"¡Pocas unidades!":"Disponible para entrega"}</p><div className="mt-3 grid grid-cols-[1fr_auto] gap-2"><button onClick={()=>add(p)} className="rounded-xl bg-[#191a17] py-2.5 text-xs font-bold text-white">Agregar al carrito</button><button onClick={()=>toggleCompare(p.id)} aria-label="Comparar producto" className={compareIds.includes(p.id)?"rounded-xl bg-[#c8f169] px-3 text-xs font-black":"rounded-xl border px-3 text-xs"}>⇄</button></div></div></article>)}</div>}</section>
 {recommendedProducts.length>0&&<section className="mx-auto max-w-7xl px-4 pb-8"><p className="text-xs font-bold uppercase tracking-widest text-gray-500">Selección dinámica</p><h2 className="mt-1 text-2xl font-black">Puede interesarte</h2><p className="mt-1 text-sm text-gray-500">Productos relacionados con lo que has explorado y guardado.</p><div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">{recommendedProducts.map(p=><button key={p.id} onClick={()=>viewProduct(p)} className="overflow-hidden rounded-2xl bg-white text-left"><div className="aspect-square bg-gray-100">{p.image_urls?.[0]&&<img src={p.image_urls[0]} alt={p.name} className="h-full w-full object-cover"/></div><div className="p-3"><b className="line-clamp-2 text-sm">{p.name}</b><p className="mt-1 font-black">{money(p.price_dop)}</p></div></button>)}</div></section>}
 {videoProducts.length>0&&<section className="mx-auto max-w-7xl px-4 pb-8"><div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-gray-500">Mira y descubre</p><h2 className="text-2xl font-black">Productos en video</h2></div><span className="text-xs text-gray-400">Toca para ver y comprar</span></div><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{videoProducts.map(p=><article key={p.id} className="overflow-hidden rounded-2xl bg-white"><button onClick={()=>viewProduct(p)} className="relative block aspect-[4/5] w-full bg-black"><video src={p.video_url||""} muted playsInline loop autoPlay className="h-full w-full object-cover"/><span className="absolute bottom-2 left-2 rounded-full bg-white px-3 py-1 text-xs font-black">{money(p.price_dop)}</span></button><div className="p-3"><b className="line-clamp-1 text-sm">{p.name}</b><button onClick={()=>add(p)} className="mt-2 w-full rounded-xl bg-black py-2 text-xs font-bold text-white">Comprar</button></div></article>)}</div></section>}
 {featuredProducts.length>0&&<section className="mx-auto max-w-7xl px-4 pb-8"><p className="text-xs font-bold uppercase tracking-widest text-gray-500">Selección de la tienda</p><h2 className="mt-1 text-2xl font-black">Recomendados para ti</h2><div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">{featuredProducts.map(p=><button key={p.id} onClick={()=>viewProduct(p)} className="overflow-hidden rounded-2xl bg-white text-left"><div className="aspect-square bg-gray-100">{p.image_urls?.[0]&&<img src={p.image_urls[0]} alt={p.name} className="h-full w-full object-cover"/></div><div className="p-3"><b className="line-clamp-2 text-sm">{p.name}</b><p className="mt-1 font-black">{money(p.price_dop)}</p></div></button>)}</div></section>}
 {recentProducts.length>0&&<section className="mx-auto max-w-7xl px-4 pb-10"><p className="text-xs font-bold uppercase tracking-widest text-gray-500">Continúa donde estabas</p><h2 className="mt-1 text-2xl font-black">Vistos recientemente</h2><div className="mt-4 flex gap-3 overflow-x-auto pb-2">{recentProducts.map(p=><button key={p.id} onClick={()=>viewProduct(p)} className="w-36 shrink-0 overflow-hidden rounded-2xl bg-white text-left"><div className="aspect-square bg-gray-100">{p.image_urls?.[0]&&<img src={p.image_urls[0]} alt={p.name} className="h-full w-full object-cover"/></div><div className="p-3"><b className="line-clamp-2 text-xs">{p.name}</b><p className="mt-1 text-sm font-black">{money(p.price_dop)}</p></div></button>)}</div></section>}
 {compareIds.length>0&&<div className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 items-center justify-between rounded-2xl bg-black px-4 py-3 text-white shadow-2xl"><div><b className="text-sm">Comparar productos ({compareIds.length}/3)</b><p className="text-[10px] text-white/60">Elige hasta tres artículos</p></div><div className="flex gap-2"><button onClick={()=>setCompareIds([])} className="rounded-full border border-white/30 px-3 py-2 text-xs">Limpiar</button><button disabled={compareIds.length<2} onClick={()=>setCompareOpen(true)} className="rounded-full bg-[#c8f169] px-4 py-2 text-xs font-black text-black disabled:opacity-40">Comparar</button></div></div>}
 {compareOpen&&<div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-black/50 p-3"><section className="my-5 w-full max-w-5xl rounded-3xl bg-white p-5 md:p-8"><div className="flex items-center justify-between"><h2 className="text-2xl font-black">Comparación de productos</h2><button onClick={()=>setCompareOpen(false)} className="rounded-full border px-3 py-2 text-xs">Cerrar</button></div><div className="mt-5 grid gap-3" style={{gridTemplateColumns:"repeat("+compareProducts.length+",minmax(0,1fr))"}}>{compareProducts.map(p=><article key={p.id} className="min-w-0"><div className="aspect-square overflow-hidden rounded-xl bg-gray-100">{p.image_urls?.[0]&&<img src={p.image_urls[0]} alt={p.name} className="h-full w-full object-cover"/>}</div><h3 className="mt-3 text-sm font-black">{p.name}</h3><p className="mt-2 text-lg font-black">{money(p.price_dop)}</p><p className="mt-1 text-xs text-gray-500">Inventario: {p.stock}</p><p className="mt-1 text-xs text-gray-500">Categoría: {p.category}</p>{p.wholesale_price_dop&&<p className="mt-1 text-xs text-emerald-700">Mayor: {money(p.wholesale_price_dop)} desde {p.wholesale_min_qty||3}</p>}<div className="mt-3 space-y-2">{Object.entries(p.specifications||{}).map(([k,v])=><p key={k} className="border-t pt-2 text-xs"><span className="block text-gray-400">{k}</span><b>{v}</b></p>)}</div><button onClick={()=>{add(p);setCompareOpen(false);}} className="mt-4 w-full rounded-xl bg-black py-2 text-xs font-bold text-white">Agregar al carrito</button><button onClick={()=>toggleCompare(p.id)} className="mt-2 w-full rounded-xl border py-2 text-xs">Quitar</button></article>)}</div></section></div>}
 {selected&&<div className="fixed inset-0 z-[45] grid place-items-center overflow-y-auto bg-black/50 p-3 md:p-6"><section className="my-5 grid w-full max-w-5xl gap-6 rounded-3xl bg-white p-5 md:grid-cols-2 md:p-8"><div><div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">{selected.image_urls?.[galleryIndex]?<img src={selected.image_urls[galleryIndex]} alt={selected.name} className="h-full w-full object-contain"/>:<div className="grid h-full place-items-center text-5xl">📦</div>}<button onClick={()=>setSelected(null)} className="absolute right-3 top-3 rounded-full bg-white px-3 py-2 shadow">Cerrar</button></div><div className="mt-3 flex gap-2 overflow-x-auto">{(selected.image_urls||[]).map((url,i)=><button key={url+i} onClick={()=>setGalleryIndex(i)} className={galleryIndex===i?"h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 border-black":"h-16 w-16 shrink-0 overflow-hidden rounded-xl border"}><img src={url} alt="" className="h-full w-full object-cover"/></button>)}</div>{selected.video_url&&<video controls playsInline className="mt-4 w-full rounded-xl" src={selected.video_url}/>}</div><div><p className="text-xs font-bold uppercase tracking-widest text-gray-400">{selected.category}</p><h2 className="mt-2 text-3xl font-black">{selected.name}</h2><div className="mt-3 flex items-baseline gap-3"><b className="text-3xl">{money(selected.price_dop)}</b>{selected.compare_at_price_dop&&<del className="text-sm text-gray-400">{money(selected.compare_at_price_dop)}</del>}</div><p className="mt-3 text-sm text-gray-500">{selected.stock>0?selected.stock+" unidades disponibles":"Agotado"}</p>{selected.wholesale_price_dop&&<div className="mt-3 rounded-xl bg-[#eff8df] p-3 text-sm"><b>Precio por volumen</b><p>Compra {selected.wholesale_min_qty||3} unidades o más y paga {money(selected.wholesale_price_dop)} por unidad.</p></div>}<p className="mt-5 whitespace-pre-line text-sm leading-6 text-gray-700">{selected.description||"Consulta los detalles de este producto."}</p>{selected.specifications&&Object.keys(selected.specifications).length>0&&<div className="mt-5 rounded-xl bg-gray-50 p-4"><h3 className="font-black">Características</h3>{Object.entries(selected.specifications).map(([k,v])=><div key={k} className="flex justify-between gap-3 border-b py-2 text-xs"><span className="text-gray-500">{k}</span><b>{v}</b></div>)}</div>}<div className="mt-6 grid grid-cols-2 gap-2"><button onClick={()=>toggleFavorite(selected.id)} className="rounded-xl border py-3 text-sm font-bold">{favorites.includes(selected.id)?"♥ Guardado":"♡ Guardar"}</button><button onClick={()=>{add(selected);setSelected(null);}} className="rounded-xl bg-black py-3 text-sm font-bold text-white">Agregar al carrito</button></div><div className="mt-7 border-t pt-5"><h3 className="text-xl font-black">Opiniones de compradores</h3><div className="mt-3 space-y-3">{reviews.length?reviews.map(r=><article key={r.id} className="rounded-xl bg-gray-50 p-3"><div className="flex justify-between"><b>{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</b><span className="text-[10px] text-gray-400">{new Date(r.created_at).toLocaleDateString("es-DO")}</span></div>{r.title&&<b className="mt-1 block text-sm">{r.title}</b>}<p className="mt-1 text-sm text-gray-600">{r.body}</p></article>):<p className="text-sm text-gray-400">Todavía no hay opiniones publicadas.</p>}</div><form onSubmit={submitReview} className="mt-4 space-y-2 rounded-xl border p-3"><p className="text-sm font-bold">¿Ya compraste este producto?</p><select required value={reviewOrder} onChange={e=>setReviewOrder(e.target.value)} className="w-full rounded-lg border p-2 text-xs"><option value="">Selecciona un pedido entregado</option>{reviewOrders.map(o=><option key={o.id} value={o.id}>Pedido #{o.order_number}</option>)}</select><select value={reviewRating} onChange={e=>setReviewRating(Number(e.target.value))} className="w-full rounded-lg border p-2 text-xs"><option value="5">5 estrellas</option><option value="4">4 estrellas</option><option value="3">3 estrellas</option><option value="2">2 estrellas</option><option value="1">1 estrella</option></select><input value={reviewTitle} onChange={e=>setReviewTitle(e.target.value)} placeholder="Título de tu opinión (opcional)" className="w-full rounded-lg border p-2 text-xs"/><textarea required minLength={5} value={reviewBody} onChange={e=>setReviewBody(e.target.value)} placeholder="Cuéntale a otros compradores tu experiencia" className="w-full rounded-lg border p-2 text-xs"/><button className="w-full rounded-lg bg-black py-2 text-xs font-bold text-white">Enviar opinión</button></form></div></div></section></div>}
 {cartOpen&&<div className="fixed inset-0 z-50 flex justify-end bg-black/40"><div className="h-full w-full max-w-md overflow-y-auto bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-2xl font-black">Tu carrito</h2><button onClick={()=>setCartOpen(false)} className="rounded-full border px-3 py-1">Cerrar</button></div>{cart.length===0?<p className="py-12 text-center text-gray-500">Tu carrito está vacío.</p>:<><div className="mt-6 space-y-4">{cart.map(x=><div key={x.product.id} className="flex gap-3"><div className="h-16 w-16 rounded-xl bg-gray-100">{x.product.image_urls?.[0]&&<img src={x.product.image_urls[0]} alt="" className="h-full w-full rounded-xl object-cover"/>}</div><div className="min-w-0 flex-1"><b className="line-clamp-2 text-sm">{x.product.name}</b><p className="mt-1 text-sm">{money(priceFor(x.product,x.quantity))} c/u</p>{x.product.wholesale_price_dop&&<p className="text-[10px] text-emerald-700">Precio mayor al llevar {x.product.wholesale_min_qty||3}+</p>}<div className="mt-2 flex items-center gap-3"><button onClick={()=>qty(x.product.id,-1)} className="rounded-lg border px-3 py-1">−</button><span>{x.quantity}</span><button onClick={()=>qty(x.product.id,1)} className="rounded-lg border px-3 py-1">+</button></div></div></div>)}</div><div className="mt-6 border-t pt-4"><div className="flex justify-between text-sm"><span>Subtotal</span><b>{money(subtotal)}</b></div><div className="mt-2 flex justify-between text-sm"><span>Envío general estimado</span><b>{money(shippingFee)}</b></div><div className="mt-3 flex justify-between text-lg font-black"><span>Total</span><span>{money(subtotal+shippingFee)}</span></div><button onClick={()=>setCheckout(true)} className="mt-5 w-full rounded-xl bg-[#191a17] py-3 font-bold text-white">Finalizar pedido</button></div></>}</div></div>}
 {checkout&&<div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-black/50 p-4"><form onSubmit={placeOrder} className="my-8 w-full max-w-lg space-y-3 rounded-3xl bg-white p-6"><div className="flex items-center justify-between"><h2 className="text-2xl font-black">Datos de entrega</h2><button type="button" onClick={()=>setCheckout(false)} className="rounded-full border px-3 py-1">×</button></div><p className="text-sm text-gray-500">Pago contra entrega · {money(subtotal+shippingFee)}</p><label className="block text-sm font-semibold">Nombre completo<input required minLength={3} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="mt-1 w-full rounded-xl border p-3 font-normal"/></label><label className="block text-sm font-semibold">Teléfono<input required type="tel" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} className="mt-1 w-full rounded-xl border p-3 font-normal"/></label><label className="block text-sm font-semibold">Dirección exacta<input required minLength={5} value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} className="mt-1 w-full rounded-xl border p-3 font-normal" placeholder="Calle, número, sector"/></label><label className="block text-sm font-semibold">Sector / ciudad<input value={form.sector} onChange={e=>setForm(f=>({...f,sector:e.target.value}))} className="mt-1 w-full rounded-xl border p-3 font-normal"/></label><label className="block text-sm font-semibold">Referencia adicional<textarea value={form.reference} onChange={e=>setForm(f=>({...f,reference:e.target.value}))} className="mt-1 w-full rounded-xl border p-3 font-normal"/></label><label className="block text-sm font-semibold">Código de descuento<input value={couponCode} onChange={e=>setCouponCode(e.target.value.toUpperCase())} maxLength={40} placeholder="Introduce tu cupón (opcional)" className="mt-1 w-full rounded-xl border p-3 font-normal uppercase"/></label><div className="rounded-xl bg-gray-50 p-3 text-sm">El envío se calcula según tu sector o dirección. La tarifa general es {money(shippingFee)}; el monto exacto aparecerá al confirmar.</div><button disabled={busy} className="w-full rounded-xl bg-[#191a17] py-3 font-bold text-white disabled:opacity-50">{busy?"Registrando pedido…":"Confirmar pedido"}</button></form></div>}
 {order&&<div className="fixed inset-0 z-[70] grid place-items-center bg-black/50 p-4"><div className="w-full max-w-md rounded-3xl bg-white p-8 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#c8f169] text-2xl">✓</div><h2 className="mt-4 text-2xl font-black">¡Pedido recibido!</h2><p className="mt-2 text-gray-500">Tu número de pedido es <b>#{order.order_number}</b>.</p>{order.discount_dop? <p className="mt-2 text-sm font-bold text-emerald-700">Descuento aplicado ({order.coupon_code}): −{money(order.discount_dop)}</p>:null}<p className="mt-2 text-xl font-black">{money(order.total_dop)}</p><p className="mt-2 text-sm text-gray-500">Pagarás al recibir. Nuestro equipo confirmará la entrega.</p><button onClick={()=>setOrder(null)} className="mt-6 w-full rounded-xl bg-black py-3 font-bold text-white">Seguir comprando</button></div></div>}
 <footer className="border-t bg-white py-8 text-center text-xs text-gray-500">© {new Date().getFullYear()} XiiAO Shop · Compra segura y sencilla<div className="mt-3 flex justify-center gap-5"><Link href="/creadores" className="underline">Programa de creadores</Link><Link href="/comercios" className="underline">Vende con nosotros</Link></div></footer></main>;
}
