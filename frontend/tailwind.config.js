// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-raised': 'var(--surface-raised)',
        border: 'var(--border)',
        brand: 'var(--brand)',
        'brand-hover': 'var(--brand-hover)',
        text: 'var(--text)',
        'text-muted': 'var(--text-muted)',
        accent: 'var(--accent)',
        success: 'var(--success)',
        danger: 'var(--danger)',
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'Plus Jakarta Sans', 'sans-serif'],
        serif: ['Plus Jakarta Sans', 'sans-serif'],
        arabic: ['IBM Plex Sans Arabic', 'Cairo', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
