import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "rgb(var(--border) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",
        panelSoft: "rgb(var(--panel-soft) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        inkSoft: "rgb(var(--ink-soft) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        accentDeep: "rgb(var(--accent-deep) / <alpha-value>)",
        accentSoft: "rgb(var(--accent-soft) / <alpha-value>)",
        accentGlow: "rgb(var(--accent-glow) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        warn: "rgb(var(--warn) / <alpha-value>)"
      },
      boxShadow: {
        soft: "0 16px 50px rgb(var(--shadow) / 0.08)",
        lift: "0 22px 70px rgb(var(--shadow) / 0.14)"
      }
    }
  },
  plugins: []
};

export default config;
