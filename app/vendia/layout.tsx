import type { Metadata } from "next";
export const metadata: Metadata = { title: "VENDIA | Gestión inteligente para tu negocio", description: "Punto de venta, catálogo, inventario, facturación y administración para comercios.", applicationName: "VENDIA" };
export default function VendiaLayout({children}:{children:React.ReactNode}) { return <>{children}</>; }
