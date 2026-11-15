import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
const url=process.env.EXPO_PUBLIC_SUPABASE_URL||"";
const key=process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY||"";
export const configured=!!url&&!!key&&!url.includes("YOUR_PROJECT")&&!key.includes("YOUR_SUPABASE");
export const supabase=createClient(configured?url:"https://example.supabase.co",configured?key:"demo-anon-key",{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});