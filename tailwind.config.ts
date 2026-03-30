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
        navy: "#1B2B4B",
        copper: "#C17A3A",
        stone: "#F5F0EB",
        "warm-gray": "#6B7280",
        green: "#2D8A5E",
        red: "#C4423C",
        amber: "#D4920B",
        border: "#E5E0DB",
      },
      fontFamily: {
        serif: ["DM Serif Display", "Georgia", "serif"],
        sans: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "monospace"],
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
      },
      borderRadius: {
        card: "12px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(27,43,75,0.06)",
        "card-hover": "0 4px 12px rgba(27,43,75,0.1)",
      },
      animation: {
        "fade-up": "fadeUp 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "slide-in": "slideIn 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "pulse-border": "pulseBorder 2s ease-in-out infinite",
        "check-in": "checkIn 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulseBorder: {
          "0%, 100%": { borderColor: "rgba(193,122,58,0.4)" },
          "50%": { borderColor: "rgba(193,122,58,1)" },
        },
        checkIn: {
          "0%": { opacity: "0", transform: "scale(0.5)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
