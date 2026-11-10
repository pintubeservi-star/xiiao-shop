"use client";
import {useEffect,useState} from "react";
import {getSupabase} from "@/lib/supabase/client";
import CotuiGoLiveMap from "@/components/cotui-go-live-map";
export default function CotuiGoDriverLiveMap({driverId,className=""}:{driverId:string;className?:string}){
 const [point,setPoint]=useState<{lat:number|null;lng:number|null}>({lat:null,lng:null});
 useEffect(()=>{if(!driverId)return;let active=true,inFlight=false;const refresh=async()=>{if(inFlight||!active)return;inFlight=true;try{const {data,error}=await getSupabase().from("cg_driver_profiles").select("current_lat,current_lng").eq("id",driverId).maybeSingle();if(!error&&data&&active)setPoint({lat:data.current_lat,lng:data.current_lng});}finally{inFlight=false;}};void refresh();const timer=window.setInterval(()=>void refresh(),4000);return()=>{active=false;window.clearInterval(timer);};},[driverId]);
 return <CotuiGoLiveMap driver={point} className={className}/>;
}
