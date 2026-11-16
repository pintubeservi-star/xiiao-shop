import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
const url=process.env.EXPO_PUBLIC_SUPABASE_URL||"https://hezjaxdmuwgejgcitavw.supabase.co";
const key=process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY||"sb_publishable_XwSI2KQoru3oHwy-H-vtOA_WqhweORG";
export const configured=!!url&&!!key&&!url.includes("YOUR_PROJECT")&&!key.includes("YOUR_SUPABASE");
export const supabase=createClient(url,key,{auth:{storage:AsyncStorage,persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
