const CACHE_NAME="cotui-go-shell-v4";
const STATIC_ASSETS=["/offline.html","/icon.svg","/icon-client.svg","/icon-driver.svg","/icon-admin.svg","/manifest-client.json","/manifest-driver.json","/manifest-admin.json"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(STATIC_ASSETS)));self.skipWaiting();});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))));self.clients.claim();});
self.addEventListener("push",event=>{
 let data={title:"Cotuí Go",body:"Tienes una nueva actividad",url:"/admin/movilidad"};
 try{if(event.data)data={...data,...event.data.json()};}catch{}
 event.waitUntil(self.registration.showNotification(data.title,{body:data.body,icon:data.icon||"/icon-admin.svg",badge:data.badge||"/icon-admin.svg",tag:data.tag||"cotui-go",data:{url:data.url||"/admin/movilidad"},renotify:true}));
});
self.addEventListener("notificationclick",event=>{
 event.notification.close();
 const target=new URL(event.notification.data?.url||"/admin/movilidad",self.location.origin).href;
 event.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(async clients=>{
  for(const client of clients){if("focus" in client){await client.navigate(target);return client.focus();}}
  if(self.clients.openWindow)return self.clients.openWindow(target);
 }));
});
self.addEventListener("fetch",event=>{
 const request=event.request;if(request.method!=="GET")return;
 const url=new URL(request.url);if(url.origin!==self.location.origin)return;
 if(request.mode==="navigate"){event.respondWith(fetch(request).catch(async()=>await caches.match("/offline.html")));return;}
 if(request.destination==="image"||request.destination==="font"||request.destination==="style"||request.destination==="script"){
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));}return response;})));
 }
});
