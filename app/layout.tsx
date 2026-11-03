import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "XiiAO Shop | Compra, comparte y gana",
  description: "Descubre productos, comparte lo que te gusta y gana comisiones por tus recomendaciones.",
  applicationName: "XiiAO Shop",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "XiiAO Shop" }
};
export const viewport: Viewport = { themeColor: "#c8f169", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
