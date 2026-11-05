import type {Metadata} from "next";
export const metadata:Metadata={title:"Cotuí Go Conductores",applicationName:"Cotuí Go Conductores",manifest:"/manifest-driver.json",appleWebApp:{capable:true,statusBarStyle:"black-translucent",title:"Cotuí Driver"}};
export default function DriverLayout({children}:{children:React.ReactNode}){return children;}
