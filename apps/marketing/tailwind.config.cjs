/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      screens: {
        xs: "480px",
      },
      colors: {
        chalk: "#F3F5F0",
        paper: "#FBFCF9",
        ink: "#0A1B17",
        pine: {
          950: "#061813",
          900: "#08211B",
          800: "#0D2A23",
          700: "#123B32",
          600: "#1B5145",
          500: "#2A6B5C",
        },
        mint: {
          50: "#F2FDF8",
          100: "#E8FBF3",
          200: "#C9F5E4",
          300: "#9DEBCF",
          400: "#5FDDB4",
          500: "#2BC894",
        },
        signal: {
          DEFAULT: "#2F5BFF",
          soft: "#E8EDFF",
        },
        alert: {
          DEFAULT: "#E5484D",
          soft: "#FDECEC",
        },
        line: "rgba(10, 27, 23, 0.13)",
        "line-strong": "rgba(10, 27, 23, 0.26)",
      },
      fontFamily: {
        sans: ["Instrument Sans Variable", "Instrument Sans", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "SF Mono", "Menlo", "Consolas", "monospace"],
      },
      maxWidth: {
        shell: "78rem",
        prose: "42rem",
      },
      borderRadius: {
        panel: "2px",
      },
      boxShadow: {
        panel: "0 1px 0 rgba(10,27,23,0.04), 0 18px 50px -24px rgba(10,27,23,0.28)",
        float: "0 20px 45px -20px rgba(10,27,23,0.42)",
      },
      keyframes: {
        "rise-in": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scan-line": {
          "0%, 100%": { transform: "translateY(0)", opacity: "0.45" },
          "50%": { transform: "translateY(100%)", opacity: "0.9" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.55", transform: "scale(0.82)" },
        },
      },
      animation: {
        "rise-in": "rise-in 700ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 900ms ease both",
        "scan-line": "scan-line 5.5s ease-in-out infinite",
        "pulse-dot": "pulse-dot 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
