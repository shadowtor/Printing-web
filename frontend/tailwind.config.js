/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#070b11",
          surface: "#111827",
          surfaceSoft: "#0e1625",
          border: "#273449",
          text: "#e8eef9",
          muted: "#a8b6cb",
          subtle: "#6f809d",
          primary: "#005eb0",
          danger: "#b81d20",
          accent: "#fbc70e"
        }
      },
      fontSize: {
        title: ["2.25rem", { lineHeight: "2.5rem", fontWeight: "700" }],
        h1: ["1.875rem", { lineHeight: "2.25rem", fontWeight: "700" }],
        h2: ["1.25rem", { lineHeight: "1.75rem", fontWeight: "600" }],
        body: ["0.95rem", { lineHeight: "1.5rem", fontWeight: "400" }],
        caption: ["0.75rem", { lineHeight: "1.1rem", fontWeight: "500" }]
      },
      borderRadius: {
        panel: "1rem",
        "panel-lg": "1.25rem"
      },
      boxShadow: {
        panel: "0 22px 44px -34px rgba(0, 0, 0, 0.9)",
        glow: "0 0 0 1px rgba(0, 94, 176, 0.18), 0 20px 45px -28px rgba(0, 94, 176, 0.42)",
        "soft-inner": "inset 0 1px 0 rgba(255, 255, 255, 0.05)"
      }
    }
  },
  plugins: []
};
