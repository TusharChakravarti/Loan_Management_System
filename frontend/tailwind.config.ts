import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        credora: {
          50: "#f0f6ff",
          100: "#e0edff",
          200: "#bae0fd",
          300: "#7cc8fb",
          400: "#36aaf7",
          500: "#0c8ee9",
          600: "#006fca",
          700: "#0058a5",
          800: "#054b87",
          900: "#0a3f70",
          950: "#07284a",
        },
        navy: {
          800: "#0b192c",
          900: "#06101e",
          950: "#030811",
        },
      },
    },
  },
  plugins: [],
};
export default config;
