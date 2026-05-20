/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a56db',
        accent: '#f59e0b',
        up: '#ef4444',
        down: '#22c55e',
      },
    },
  },
  plugins: [],
}
