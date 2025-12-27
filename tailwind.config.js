/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fantasy: {
          dark: '#0a0a0c', // Deep near-black
          surface: '#1a1b1e', // Dark gray surface
          border: '#2c2d31', // Subtle border
          accent: '#c5a059', // Gold/Brass accent
          blood: '#880808', // Deep red for health/danger
          essence: '#2e7d32', // Green for essence
          protection: '#1565c0', // Blue for protection
        }
      },
      fontFamily: {
        serif: ['Georgia', 'serif'],
      }
    },
  },
  plugins: [],
}



