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
  return (<main>diagnostic</main>);
}
