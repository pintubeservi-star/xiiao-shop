import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { colors: {
    ink: "#111111",
    lime: { DEFAULT: "#c8f169", 100: "#effbd8", 200: "#ddf7ad", 500: "#a3d747" },
    paper: "#f7f7f3"
  }, boxShadow: { soft: "0 16px 50px rgba(0,0,0,.07)" } } },
  plugins: []
};
export default config;
