import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#FFF8F0",
          100: "#FEECD9",
          200: "#FCD9B4",
          300: "#F8BA7D",
          400: "#F39646",
          500: "#C4772A",
          600: "#9D5D1D",
          700: "#7A4615",
          800: "#5C330F",
          900: "#3D220A",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#FFFBF7",
          card: "#FFFFFF",
          input: "#EDE4D8",
        },
        border: {
          DEFAULT: "#E8D5C0",
          light: "#F5E6D8",
        },
        text: {
          primary: "#1A1104",
          secondary: "#6B5744",
          muted: "#9C7E68",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          '"Noto Sans KR"',
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 2px 16px 0 rgba(196,119,42,0.07), 0 1px 4px 0 rgba(196,119,42,0.05)",
        "card-hover":
          "0 8px 32px 0 rgba(196,119,42,0.12), 0 2px 8px 0 rgba(196,119,42,0.07)",
        modal:
          "0 32px 80px -8px rgba(26,17,4,0.18), 0 8px 32px -4px rgba(26,17,4,0.1)",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
      },
      animation: {
        "modal-in": "modal-in 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
        "sheet-in": "sheet-in 0.32s cubic-bezier(0.16, 1, 0.3, 1)",
        "overlay-in": "overlay-in 0.18s ease",
      },
      keyframes: {
        "modal-in": {
          "0%": { opacity: "0", transform: "scale(0.95) translateY(10px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "sheet-in": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "overlay-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
