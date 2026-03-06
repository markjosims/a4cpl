import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        fire: {
          50: "#fef7ee",
          100: "#fdeed7",
          200: "#f9d9ae",
          300: "#f5be7a",
          400: "#f09844",
          500: "#ec7a1f",
          600: "#dd6115",
          700: "#b74913",
          800: "#923b17",
          900: "#763216",
          950: "#401709",
        },
      },
    },
  },
  plugins: [],
};

export default config;
