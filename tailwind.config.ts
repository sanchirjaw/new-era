import type { Config } from "tailwindcss"

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
      borderRadius: { 
        xl: "var(--radius-xl)" 
      },
      boxShadow: { 
        soft: "var(--shadow-soft)" 
      },
      keyframes: {
        authIn: { 
          from: { 
            opacity: 0, 
            transform: "translateY(8px) scale(0.98)" 
          }, 
          to: { 
            opacity: 1, 
            transform: "translateY(0) scale(1)" 
          } 
        },
      },
      animation: { 
        authIn: "authIn .35s ease-out" 
      },
    },
  },
} satisfies Config
