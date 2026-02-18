import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm color palette
        brand: {
          50: "#FFF8F0",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316",
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
        },
        cream: {
          50: "#FEFDFB",
          100: "#FDF8F0",
          200: "#FAF0E4",
        },
        charcoal: {
          50: "#F7F6F5",
          100: "#E8E5E3",
          200: "#D1CBC6",
          300: "#B8AFA8",
          400: "#9F938A",
          500: "#87796E",
          600: "#6B5F55",
          700: "#504740",
          800: "#3A332D",
          900: "#2A2420",
          950: "#1A1613",
        },
        success: {
          50: "#F0FDF4",
          100: "#DCFCE7",
          200: "#BBF7D0",
          500: "#22C55E",
          600: "#16A34A",
          700: "#15803D",
        },
        warning: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          500: "#F59E0B",
          600: "#D97706",
        },
        danger: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
        },
        sidebar: {
          DEFAULT: "#2A2420",
          foreground: "#FAF0E4",
          muted: "#87796E",
          accent: "#F97316",
          hover: "#3A332D",
        },
      },
      fontSize: {
        // Enforcing minimum 16px base
        sm: ["0.9375rem", { lineHeight: "1.5" }], // 15px minimum "small"
        base: ["1.125rem", { lineHeight: "1.75" }], // 18px body
        lg: ["1.25rem", { lineHeight: "1.75" }], // 20px
        xl: ["1.5rem", { lineHeight: "2" }], // 24px
        "2xl": ["1.875rem", { lineHeight: "2.25" }], // 30px
        "3xl": ["2.25rem", { lineHeight: "2.5" }], // 36px
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.25s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
