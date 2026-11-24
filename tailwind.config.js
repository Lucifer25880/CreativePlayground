/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#07070d',
          900: '#0a0a14',
          850: '#0e0e1a',
          800: '#12121f',
          700: '#181828',
          600: '#222236',
        },
        accent: {
          DEFAULT: '#7c6cff',
          cyan: '#38e1ff',
          pink: '#ff5ca8',
          lime: '#a3ff5c',
          amber: '#ffb454',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(124,108,255,0.25), 0 0 40px -8px rgba(124,108,255,0.55)',
        'glow-cyan': '0 0 0 1px rgba(56,225,255,0.25), 0 0 40px -8px rgba(56,225,255,0.5)',
        panel: '0 24px 60px -24px rgba(0,0,0,0.8)',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(rgba(124,108,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(124,108,255,0.06) 1px, transparent 1px)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
        shimmer: 'shimmer 2.2s linear infinite',
      },
    },
  },
  plugins: [],
}
