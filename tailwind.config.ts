import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Clay design tokens (canonical names)
        canvas: "#fffaf0",
        ink: "#0a0a0a",
        soft: "#faf5e8",
        card: "#f5f0e0",
        strong: "#ebe6d6",
        hairline: "#e5e5e5",
        "body-strong": "#1a1a1a",
        "body-text": "#3a3a3a",
        "muted-soft": "#9a9a9a",
        "on-dark": "#ffffff",
        "surface-dark": "#0a1a1a",
        "surface-dark-elevated": "#1a2a2a",
        "brand-pink": "#ff4d8b",
        "brand-teal": "#1a3a3a",
        "brand-lavender": "#b8a4ed",
        "brand-peach": "#ffb084",
        "brand-ochre": "#e8b94a",
        "brand-mint": "#a4d4c5",
        "brand-coral": "#ff6b5a",

        // Back-compat tokens — mapped onto the Clay palette so every existing
        // className reskins automatically without churn.
        bg: "#fffaf0",      // canvas
        panel: "#ffffff",   // white card on cream
        border: "#e8e2d2",  // warm hairline
        accent: "#0d6e63",  // deep teal (CTA / "alive" signal)
        danger: "#e23b5a",  // coral red
        warn: "#c08a1a",    // ochre-deep
        muted: "#6a6a6a",   // body-muted

        // Re-tone the default gray scale so dark-mode shades map to ink hierarchy.
        gray: {
          100: "#0a0a0a",
          200: "#1a1a1a",
          300: "#3a3a3a",
          400: "#5a5a5a",
          500: "#6a6a6a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Manrope", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        display: "-0.045em",
        tightish: "-0.02em",
      },
      borderRadius: {
        clay: "24px",
      },
      boxShadow: {
        clay: "0 1px 0 rgba(10,10,10,0.04), 0 8px 24px -12px rgba(10,10,10,0.08)",
        "clay-lift":
          "0 1px 0 rgba(10,10,10,0.04), 0 24px 48px -24px rgba(10,10,10,0.18)",
      },
    },
  },
  plugins: [],
};
export default config;
