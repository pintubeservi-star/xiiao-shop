"use client";
import { useEffect,useMemo,useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";

type Product={id:string;name:string;slug:string;description:string|null;category:string;price_dop:number;compare_at_price_dop:number|null;stock:number;image_urls:string[];tags?:string[];specifications?:Record<string,string>;is_featured?:boolean;video_url?:string|null;wholesale_price_dop?:number|null;wholesale_min_qty?:number};
type Line={product:Product;quantity:number};
const money=(n:number)=>"RD$ "+Number(n).toLocaleString("es-DO");
export default function Home(){
 const [products,setProducts]=useState<Product[]>([]),[categories,setCategories]=useState<string[]>([]);
 const [category,setCategory]=useState("Todos"),[search,setSearch]=useState(""),[sort,setSort]=useState("featured"),[showSaved,setShowSaved]=useState(false),[favorites,setFavorites]=useState<string[]>([]),[recentIds,setRecentIds]=useState<string[]>([]),[selected,setSelected]=useState<Product|null>(null),[galleryIndex,setGalleryIndex]=useState(0),[reviews,setReviews]=useState<any[]>([]),[ratingSummary,setRatingSummary]=useState<any>({}),[reviewOrders,setReviewOrders]=useState<any[]>([]),[reviewOrder,setReviewOrder]=useState(""),[reviewRating,setReviewRating]=useState(5),[reviewTitle,setReviewTitle]=useState(""),[reviewBody,setReviewBody]=useState(""),[compareIds,setCompareIds]=useState<string[]>([]),[compareOpen,setCompareOpen]=useState(false);
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
 const recentProducts=recentIds.map(id=>products.find(p=>p.id===id)).filter(Boolean) as Product[];
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
 async function submitReview(e:any){
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
return <main>diagnostic</main>;
