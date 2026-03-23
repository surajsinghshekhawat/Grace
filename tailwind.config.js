/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        grace: {
          pink: "#E91E63",
          "pink-light": "#FF6B8B",
          "pink-pale": "#FCE4EC",
          purple: "#A078E6",
          "purple-light": "#B39DDB",
          "purple-pale": "#EDE7F6",
          green: "#22C55E",
          "green-light": "#4ADE80",
        },
        lavender: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
        },
        teal: {
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
        },
      },
      fontFamily: {
        sans: ["Poppins", "Inter", "Nunito", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};


