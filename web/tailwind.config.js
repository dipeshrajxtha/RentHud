/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#36aaf5',
          500: '#0c8ee9',
          600: '#0170c7',
          700: '#0259a1',
          800: '#064c84',
          900: '#0b406e',
          950: '#072849',
        },
      },
      fontFamily: {
        display: [
          'Lexend',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      fontSize: {
        'display-2xl': ['4.5rem',  { lineHeight: '1.1', letterSpacing: '-0.03em' }],
        'display-xl':  ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        'display-lg':  ['3rem',    { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'display-md':  ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'display-sm':  ['1.875rem',{ lineHeight: '1.25', letterSpacing: '-0.018em' }],
        'heading-xl':  ['1.5rem',  { lineHeight: '1.3', letterSpacing: '-0.015em' }],
        'heading-lg':  ['1.25rem', { lineHeight: '1.35', letterSpacing: '-0.01em' }],
        'heading-md':  ['1.125rem',{ lineHeight: '1.4', letterSpacing: '-0.01em' }],
        'heading-sm':  ['1rem',    { lineHeight: '1.5', letterSpacing: '-0.005em' }],
      },
      boxShadow: {
        'brand-sm': '0 2px 8px rgba(12, 142, 233, 0.15), 0 1px 2px rgba(12, 142, 233, 0.08)',
        'brand-md': '0 4px 20px rgba(12, 142, 233, 0.20), 0 2px 6px rgba(12, 142, 233, 0.12)',
        'card':     '0 4px 20px rgba(7, 40, 73, 0.10), 0 2px 6px rgba(7, 40, 73, 0.06)',
        'auth':     '0 16px 60px rgba(7, 40, 73, 0.14), 0 8px 24px rgba(7, 40, 73, 0.10)',
      },
      keyframes: {
        shimmer: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        pulseRing: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%':      { opacity: '1',   transform: 'scale(1.02)' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'shimmer':    'shimmer 1.8s infinite linear',
        'pulse-ring': 'pulseRing 2.4s ease-in-out infinite',
        'fade-up':    'fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in':    'fadeIn 0.3s ease both',
      },
      transitionTimingFunction: {
        'expo-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
