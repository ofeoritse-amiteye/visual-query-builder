import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "rgb(var(--border) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        warn: "rgb(var(--warn) / <alpha-value>)"
      },
      boxShadow: {
        soft: "0 16px 50px rgb(15 23 42 / 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
