import type {Metadata,Viewport} from "next";
import "./globals.css";
import {PwaRegister} from "@/components/pwa-register";
import AppExperience from "@/components/app-experience";
export const metadata:Metadata={title:"Cotuí Go | Viajes y entregas",description:"Solicita viajes y envía paquetes en Cotuí con Cotuí Go.",applicationName:"Cotuí Go",manifest:"/manifest-client.json",appleWebApp:{capable:true,statusBarStyle:"default",title:"Cotuí Go"}};
export const viewport:Viewport={themeColor:"#14251d",width:"device-width",initialScale:1,viewportFit:"cover"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body><PwaRegister/>{children}<AppExperience/></body></html>;}
