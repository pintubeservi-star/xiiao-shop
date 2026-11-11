"use client";

export async function loadCotuiGoMapLibre(): Promise<any> {
  if (typeof window === "undefined") throw new Error("El mapa solo puede cargarse en el navegador.");
  try {
    const module = await import("maplibre-gl");
    return module.default || module;
  } catch {
    throw new Error("No se pudo cargar MapLibre. Comprueba la conexión e inténtalo nuevamente.");
  }
}

export const COTUI_GO_MAP_STYLES = {
  light: "https://tiles.openfreemap.org/styles/positron",
  dark: "https://tiles.openfreemap.org/styles/dark"
} as const;

export const COTUI_GO_CENTER = { lat: 19.0527, lng: -70.1494 };
