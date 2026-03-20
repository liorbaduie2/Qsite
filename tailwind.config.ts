import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "star-wiggle": {
          "0%": { transform: "rotate(0deg) scale(1)" },
          "12%": { transform: "rotate(-24deg) scale(1.28)" },
          "28%": { transform: "rotate(20deg) scale(1.38)" },
          "44%": { transform: "rotate(-14deg) scale(1.18)" },
          "60%": { transform: "rotate(8deg) scale(1.08)" },
          "76%": { transform: "rotate(-4deg) scale(1.03)" },
          "100%": { transform: "rotate(0deg) scale(1)" },
        },
        "star-burst-ring": {
          "0%": { transform: "scale(0.78)", opacity: "0.62" },
          "100%": { transform: "scale(2.25)", opacity: "0" },
        },
      },
      animation: {
        "star-wiggle": "star-wiggle 0.58s cubic-bezier(0.34, 1.35, 0.64, 1) both",
        "star-burst-ring": "star-burst-ring 0.58s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "star-burst-ring-wave2":
          "star-burst-ring 0.58s cubic-bezier(0.22, 1, 0.36, 1) 0.13s forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
