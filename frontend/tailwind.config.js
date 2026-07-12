/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: "#0A111F",
          card: "#111B2E",
          glass: "rgba(255,255,255,0.06)",
        },
        band: {
          hero: "#0A111F",
          search: "#EEF2F8",
          features: "#131C32",
          properties: "#080E1A",
          stats: "#E4EAF3",
          why: "#0C1428",
          footer: "#060A14",
        },
        surface: {
          light: "#E8EDF4",
          white: "#F8FAFC",
        },
        accent: {
          DEFAULT: "#2563EB",
          light: "#3B82F6",
          glow: "#60A5FA",
        },
        cta: {
          DEFAULT: "#F97316",
          light: "#FB923C",
          dark: "#EA580C",
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        glow: "0 0 40px rgba(37,99,235,0.35)",
        "glow-lg": "0 0 80px rgba(37,99,235,0.45)",
        "glow-orange": "0 0 32px rgba(249,115,22,0.4)",
        glass: "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)",
        card: "0 20px 50px rgba(0,0,0,0.25)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-glow": "radial-gradient(ellipse 70% 60% at 70% 40%, rgba(37,99,235,0.22), transparent)",
        "hero-orb": "radial-gradient(circle, rgba(59,130,246,0.5) 0%, rgba(37,99,235,0.15) 45%, transparent 70%)",
        "feature-blue": "linear-gradient(145deg, #2563EB 0%, #1D4ED8 55%, #1E40AF 100%)",
      },
    },
  },
  plugins: [],
};
