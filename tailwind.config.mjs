/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sand: "#DFF5F4",
        "sand-dark": "#C2E9E8",
        ink: "#0B3040",
        marina: "#079EC4",
        "marina-light": "#22BCDA",
        dune: "#4E8390",
        driftwood: "#84B9BE",
        coral: "#F4C879",
        fog: "#F6FCFC",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        grain: "radial-gradient(circle at 1px 1px, rgba(7,158,196,0.08) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};

export default config;
