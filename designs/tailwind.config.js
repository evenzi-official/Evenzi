/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./**/*.html', './**/*.js'],
  safelist: ['hidden'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', card: 'var(--card)',
        cream: 'var(--bg)', 'cream-soft': 'var(--cream-soft)',
        peach: 'var(--peach)', 'peach-deep': 'var(--peach-deep)',
        'dark-card': 'var(--dark-card)', 'dark-card-soft': 'var(--dark-card-soft)',
        brand: 'var(--brand)', 'brand-hover': 'var(--brand-hover)',
        'brand-tint': 'var(--brand-tint)', 'brand-tint-2': 'var(--brand-tint-2)',
        ink: 'var(--ink)', 'ink-soft': 'var(--ink-soft)',
        muted: 'var(--muted)', 'muted-soft': 'var(--muted-soft)',
        line: 'var(--line)', 'line-soft': 'var(--line-soft)',
      },
      fontFamily: {
        display: ['Poppins', 'sans-serif'],
        body: ['Poppins', 'sans-serif'],
      },
      borderRadius: { clay: '24px', 'clay-sm': '16px', 'clay-lg': '32px' },
    },
  },
}
