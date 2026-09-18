/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Instrument Serif"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        background: '#050805',
        surface: '#0C140C',
        surfaceBorder: '#1E3A1E',
        accent: '#39FF14',
        accentMuted: '#CFFFC2',
        textPrimary: '#E8FBE8',
        textSecondary: '#6FA36F',
        border: '#163016',
        primary: {
          50: '#0C140C',
          100: '#163016',
          500: '#39FF14',
          600: '#2ed110',
          700: '#24a30d',
        },
        navy: {
          800: '#0C140C',
          900: '#050805',
        }
      }
    },
  },
  plugins: [],
}
