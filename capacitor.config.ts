import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.xiaoshop.cotuigo",
  appName: "Cotuí Go",
  webDir: "capacitor/www",
  server: {
    // Temporary hosted runtime for the Next.js app; this keeps SSR and Supabase flows working.
    // Replace with a bundled web export before store release.
    url: "https://xiiao-shop-git-cotui-go-ride-7b3492-pintubeservi-3998s-projects.vercel.app",
    cleartext: false,
    allowNavigation: [
      "xiiao-shop-git-cotui-go-ride-7b3492-pintubeservi-3998s-projects.vercel.app",
      "*.supabase.co",
      "*.supabase.in"
    ]
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#eef2f1"
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      backgroundColor: "#eef2f1",
      showSpinner: false
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#eef2f1"
    }
  }
};

export default config;
