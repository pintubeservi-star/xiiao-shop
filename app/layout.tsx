import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "XiiAO | Compra fácil, recibe rápido",
  description: "Compra productos disponibles en República Dominicana, recibe rápido y paga al recibir.",
  applicationName: "XiiAO",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "XiiAO" }
};
export const viewport: Viewport = { themeColor: "#c8f169", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body><PwaRegister />{children}</body></html>;
}
