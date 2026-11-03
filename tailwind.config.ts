import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { colors: { ink: "#111111", lime: "#c8f169", paper: "#f7f7f3" }, boxShadow: { soft: "0 16px 50px rgba(0,0,0,.07)" } } },
  plugins: []
};
export default config;
