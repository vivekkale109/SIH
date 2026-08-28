/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bgBase: '#0B0F14',
        bgSurface: '#131922',
        bgSurfaceRaised: '#1B222D',
        borderDefault: '#2A3340',
        textPrimary: '#EAEEF2',
        textSecondary: '#9AA5B1',
        accentPrimary: '#3B82F6',
        accentPrimaryHover: '#5A96F7',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#38BDF8',
        neutral: '#6B7280',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '12px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0, 0, 0, 0.24)',
        modal: '0 8px 24px rgba(0, 0, 0, 0.32)',
      },
    },
  },
  plugins: [],
}
