"use client";
declare global { interface Window { maplibregl?: any; __cgMapLibrePromise?: Promise<any>; } }
export function loadCotuiGoMapLibre(): Promise<any> {
 if(typeof window==="undefined") return Promise.reject(new Error("El mapa solo puede cargarse en el navegador."));
 if(window.maplibregl) return Promise.resolve(window.maplibregl);
 if(window.__cgMapLibrePromise) return window.__cgMapLibrePromise;
 window.__cgMapLibrePromise=new Promise((resolve,reject)=>{
  const fail=()=>{window.__cgMapLibrePromise=undefined;document.querySelectorAll('script[data-cg-maplibre-js]').forEach(x=>x.remove());reject(new Error("No se pudo cargar el motor del mapa. Comprueba tu conexión."));};
  for(const url of ["https://unpkg.com/maplibre-gl@5.6.1/dist/maplibre-gl.css","https://cdn.jsdelivr.net/npm/maplibre-gl@5.6.1/dist/maplibre-gl.css"]){if(!document.querySelector('link[data-cg-maplibre-css="'+url+'"]')){const css=document.createElement("link");css.rel="stylesheet";css.href=url;css.dataset.cgMaplibreCss=url;document.head.appendChild(css);}}
  const load=(url:string,fallback?:string)=>{const script=document.createElement("script");script.src=url;script.async=true;script.dataset.cgMaplibreJs="1";script.onload=()=>{if(window.maplibregl)resolve(window.maplibregl);else if(fallback)load(fallback);else fail();};script.onerror=()=>{script.remove();if(fallback)load(fallback);else fail();};document.body.appendChild(script);};
  load("https://unpkg.com/maplibre-gl@5.6.1/dist/maplibre-gl.js","https://cdn.jsdelivr.net/npm/maplibre-gl@5.6.1/dist/maplibre-gl.js");
 });
 return window.__cgMapLibrePromise;
}