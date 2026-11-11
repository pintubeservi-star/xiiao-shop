"use client";
declare global { interface Window { L?: any; __cgLeafletPromise?: Promise<any>; } }
export function loadCotuiGoLeaflet(): Promise<any> {
 if (typeof window === "undefined") return Promise.reject(new Error("El mapa solo puede cargarse en el navegador."));
 if (window.L?.map) return Promise.resolve(window.L);
 if (window.__cgLeafletPromise) return window.__cgLeafletPromise;
 window.__cgLeafletPromise = new Promise((resolve, reject) => {
  const cssUrls = [
   "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
   "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css"
  ];
  if (!document.querySelector('link[data-cg-leaflet-css]')) {
   const link = document.createElement("link");
   link.rel = "stylesheet"; link.href = cssUrls[0]; link.dataset.cgLeafletCss = "1";
   link.onerror = () => { link.href = cssUrls[1]; };
   document.head.appendChild(link);
  }
  const urls = ["https://unpkg.com/leaflet@1.9.4/dist/leaflet.js", "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"];
  let index = 0;
  const fail = () => { window.__cgLeafletPromise = undefined; reject(new Error("No se pudo cargar el motor del mapa. Comprueba tu conexión.")); };
  const load = () => {
   const script = document.createElement("script"); script.src = urls[index++]; script.async = true; script.dataset.cgLeafletJs = "1";
   script.onload = () => window.L?.map ? resolve(window.L) : index < urls.length ? load() : fail();
   script.onerror = () => { script.remove(); index < urls.length ? load() : fail(); };
   document.body.appendChild(script);
  };
  load();
 });
 return window.__cgLeafletPromise;
}
