/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sand: "#EDE6D6",
        "sand-dark": "#DCD1B6",
        ink: "#1C2321",
        marina: "#1B3A4B",
        "marina-light": "#2E5468",
        dune: "#7C8B6F",
        driftwood: "#A69B8D",
        coral: "#E8886B",
        fog: "#F6F3EA",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        grain: "radial-gradient(circle at 1px 1px, rgba(28,35,33,0.06) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};

export default config;
