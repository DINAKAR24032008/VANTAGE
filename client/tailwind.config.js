/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'Arial', 'sans-serif'],
      },
      colors: {
        background: 'rgb(var(--bg) / <alpha-value>)',
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        surface2: 'rgb(var(--surface-2) / <alpha-value>)',
        surfaceBorder: 'rgb(var(--border) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        borderStrong: 'rgb(var(--border-strong) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          50: 'rgb(var(--primary-soft) / <alpha-value>)',
          100: 'rgb(var(--primary-soft) / <alpha-value>)',
          500: 'rgb(var(--primary) / <alpha-value>)',
          600: 'rgb(var(--primary-hover) / <alpha-value>)',
        },
        primaryHover: 'rgb(var(--primary-hover) / <alpha-value>)',
        primarySoft: 'rgb(var(--primary-soft) / <alpha-value>)',
        primaryContrast: 'rgb(var(--primary-contrast) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          50: 'rgb(var(--accent-soft) / <alpha-value>)',
          100: 'rgb(var(--accent-soft) / <alpha-value>)',
          500: 'rgb(var(--accent) / <alpha-value>)',
        },
        accentMuted: 'rgb(var(--accent) / <alpha-value>)',
        accentHover: 'rgb(var(--accent) / <alpha-value>)',
        accentSoft: 'rgb(var(--accent-soft) / <alpha-value>)',
        textPrimary: 'rgb(var(--text) / <alpha-value>)',
        textSecondary: 'rgb(var(--text-muted) / <alpha-value>)',
        textMuted: 'rgb(var(--text-muted) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
        dangerHover: 'rgb(var(--danger) / <alpha-value>)',
        dangerSoft: 'rgb(var(--danger-soft) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        overlay: 'rgba(0, 0, 0, 0.50)',
        progressTrack: 'rgb(var(--surface-2) / <alpha-value>)',
        scrollbarThumb: 'rgb(var(--border-strong) / <alpha-value>)',
        adminRing: 'rgb(var(--admin-ring) / <alpha-value>)',
      },
      boxShadow: {
        'paper-sm': 'var(--shadow-sm)',
        'paper-md': 'var(--shadow-md)',
        'paper-lg': 'var(--shadow-md)',
      }
    },
  },
  plugins: [],
}
