"use client";
declare global {
 interface Window { maplibregl?: any; __cgMapLibrePromise?: Promise<any>; }
}
export function loadCotuiGoMapLibre(): Promise<any> {
 if(typeof window==="undefined") return Promise.reject(new Error("El mapa solo puede cargarse en el navegador."));
 if(window.maplibregl) return Promise.resolve(window.maplibregl);
 if(window.__cgMapLibrePromise) return window.__cgMapLibrePromise;
 window.__cgMapLibrePromise=new Promise((resolve,reject)=>{
  if(!document.querySelector('link[data-cg-maplibre-css]')){
   const css=document.createElement("link");css.rel="stylesheet";css.href="https://unpkg.com/maplibre-gl@5.6.1/dist/maplibre-gl.css";css.dataset.cgMaplibreCss="1";document.head.appendChild(css);
  }
  const finish=()=>{if(window.maplibregl)resolve(window.maplibregl);else fail();};
  const fail=()=>{window.__cgMapLibrePromise=undefined;document.querySelector('script[data-cg-maplibre-js]')?.remove();reject(new Error("No se pudo cargar el motor vectorial del mapa. Comprueba tu conexión."));};
  const existing=document.querySelector<HTMLScriptElement>('script[data-cg-maplibre-js]');
  if(existing){existing.addEventListener("load",finish,{once:true});existing.addEventListener("error",fail,{once:true});if(window.maplibregl)finish();return;}
  const script=document.createElement("script");script.src="https://unpkg.com/maplibre-gl@5.6.1/dist/maplibre-gl.js";script.async=true;script.dataset.cgMaplibreJs="1";script.onload=finish;script.onerror=fail;document.body.appendChild(script);
 });
 return window.__cgMapLibrePromise;
}
