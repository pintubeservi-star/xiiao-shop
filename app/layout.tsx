import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "Cotuí Go | Viajes, taxis y delivery",
  description: "Solicita viajes, envía paquetes y reserva rutas en Cotuí con Cotuí Go.",
  applicationName: "Cotuí Go",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Cotuí Go" }
};
export const viewport: Viewport = { themeColor: "#14251d", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body><PwaRegister />{children}</body></html>;
}
