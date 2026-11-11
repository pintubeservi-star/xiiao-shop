"use client";

export async function loadCotuiGoMapLibre(): Promise<any> {
  if (typeof window === "undefined") throw new Error("El mapa solo puede cargarse en el navegador.");
  try {
    const imported: any = await import("maplibre-gl");
    // MapLibre exposes Map, Marker and controls as named exports.
    // Do not blindly return default: in some builds it is the Map class itself.
    const api = imported?.Map ? imported : imported?.default?.Map ? imported.default : imported;
    if (!api?.Map || !api?.Marker || !api?.NavigationControl) {
      throw new Error("La biblioteca MapLibre se cargó sin sus componentes principales.");
    }
    return api;
  } catch (error) {
    console.error("MapLibre initialization failed:", error);
    throw new Error("No se pudo inicializar el mapa. Recarga la aplicación e inténtalo nuevamente.");
  }
}

export const COTUI_GO_MAP_STYLES = {
  light: "https://tiles.openfreemap.org/styles/positron",
  dark: "https://tiles.openfreemap.org/styles/dark"
} as const;

export const COTUI_GO_CENTER = { lat: 19.0527, lng: -70.1494 };
