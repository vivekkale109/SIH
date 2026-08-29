/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bgPage: 'var(--bg-page)',
        bgSurface: 'var(--bg-surface)',
        bgSurfaceMuted: 'var(--bg-surface-muted)',
        borderDefault: 'var(--border-default)',
        textPrimary: 'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
        accentPrimary: 'var(--accent-primary)',
        accentPrimaryHover: 'var(--accent-primary-hover)',
        accentPrimarySoft: 'var(--accent-primary-soft)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
        info: 'var(--info)',
        neutral: 'var(--neutral)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '10px',
        xl: '12px',
        '2xl': '16px',
        '3xl': '20px',
        pill: '999px',
        full: '9999px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(16, 24, 40, 0.06)',
        cardHover: '0 4px 16px rgba(16, 24, 40, 0.09)',
        modal: '0 12px 32px rgba(16, 24, 40, 0.14)',
      },
    },
  },
  plugins: [],
};
