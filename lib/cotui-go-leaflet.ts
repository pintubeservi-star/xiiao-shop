"use client";

declare global {
  interface Window {
    L?: any;
    __cotuiGoLeafletPromise?: Promise<any>;
  }
}

export function loadCotuiGoLeaflet(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("El mapa solo puede cargarse en el navegador."));
  if (window.L) return Promise.resolve(window.L);
  if (window.__cotuiGoLeafletPromise) return window.__cotuiGoLeafletPromise;

  window.__cotuiGoLeafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-cg-leaflet-css]')) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      css.dataset.cgLeafletCss = "1";
      document.head.appendChild(css);
    }

    const finish = () => {
      if (window.L) resolve(window.L);
      else reject(new Error("Leaflet se cargó, pero no quedó disponible."));
    };
    const fail = () => {
      window.__cotuiGoLeafletPromise = undefined;
      reject(new Error("No se pudo cargar el motor del mapa. Comprueba tu conexión e inténtalo de nuevo."));
    };

    const existing = document.querySelector<HTMLScriptElement>('script[data-cg-leaflet-js]');
    if (existing) {
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener("error", fail, { once: true });
      if (window.L) finish();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.dataset.cgLeafletJs = "1";
    script.onload = finish;
    script.onerror = fail;
    document.body.appendChild(script);
  });
  return window.__cotuiGoLeafletPromise;
}
