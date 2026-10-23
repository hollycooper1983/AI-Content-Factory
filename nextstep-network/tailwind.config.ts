import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#11213B", 50: "#EEF2F8", 100: "#D6DFEC", 700: "#1B3157", 800: "#162A4A", 900: "#11213B", 950: "#0B1628" },
        brand: { DEFAULT: "#2563EB", 50: "#EFF5FF", 100: "#DBE7FE", 600: "#2563EB", 700: "#1D4FD7" },
        teal: { DEFAULT: "#14B8A6", 50: "#EDFCF9", 100: "#CCF6EF", 600: "#0F9C8C", 700: "#0E7E72" },
        ink: "#172334",
        surface: "rgb(var(--surface) / <alpha-value>)",
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        fg: "rgb(var(--fg) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: { card: "0 1px 2px rgb(17 33 59 / 0.06), 0 1px 3px rgb(17 33 59 / 0.04)" },
    },
  },
  plugins: [],
};

export default config;
