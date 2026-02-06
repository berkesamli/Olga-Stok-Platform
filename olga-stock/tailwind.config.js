/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        olga: {
          bg: "#0a0b0f",
          surface: "#12131a",
          "surface-hover": "#1a1b25",
          border: "#1e2030",
          "border-active": "#3b4070",
          text: "#e2e4f0",
          muted: "#6b7094",
          accent: "#6366f1",
          "accent-light": "#818cf8",
          "accent-glow": "rgba(99, 102, 241, 0.15)",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};
