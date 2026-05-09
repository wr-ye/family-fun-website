/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        kid: {
          red: '#FF6B6B',
          orange: '#FFA94D',
          yellow: '#FFD43B',
          green: '#69DB7C',
          blue: '#74C0FC',
          purple: '#B197FC',
          pink: '#F783AC',
        }
      },
      fontFamily: {
        kid: ['"Noto Sans SC"', 'sans-serif'],
      },
      borderRadius: {
        'kid': '1.5rem',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'celebration': 'celebration 1s ease-out',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        celebration: {
          '0%': { transform: 'scale(0) rotate(0deg)', opacity: '0' },
          '50%': { transform: 'scale(1.2) rotate(10deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
