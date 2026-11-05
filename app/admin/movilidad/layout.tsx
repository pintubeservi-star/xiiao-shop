import type {Metadata} from "next";
export const metadata:Metadata={title:"Cotuí Go Administración",applicationName:"Cotuí Go Administración",manifest:"/manifest-admin.json",appleWebApp:{capable:true,statusBarStyle:"black-translucent",title:"Cotuí Admin"}};
export default function AdminMobilityLayout({children}:{children:React.ReactNode}){return children;}
