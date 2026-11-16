const variants = {
  all: { name: "Cotuí Go", slug: "cotui-go", scheme: "cotuigo", android: "com.cotuigo.app", ios: "com.cotuigo.app" },
  business: { name: "Cotuí Go Negocios", slug: "cotui-go-negocios", scheme: "cotuigonegocios", android: "com.cotuigo.negocios", ios: "com.cotuigo.negocios" },
  delivery: { name: "Cotuí Go Delivery", slug: "cotui-go-delivery", scheme: "cotuigodelivery", android: "com.cotuigo.delivery", ios: "com.cotuigo.delivery" }
};
export default ({config})=>{
 const key=process.env.APP_VARIANT||"all";
 const selected=variants[key]||variants.all;
 const plugins=(config.plugins||[]).filter(plugin=>(Array.isArray(plugin)?plugin[0]:plugin)!=="expo-share-intent");
 if(key==="business") plugins.push(["expo-share-intent",{disableIOS:true,androidIntentFilters:["text/*"]}]);
 return {
  ...config,
  plugins,
  name:selected.name,
  slug:selected.slug,
  scheme:selected.scheme,
  android:{...config.android,package:selected.android,config:{...config.android?.config,googleMaps:{apiKey:process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY||""}}},
  ios:{...config.ios,bundleIdentifier:selected.ios},
  extra:{...config.extra,appRole:key}
 };
};
