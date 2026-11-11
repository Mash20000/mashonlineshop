/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        slideOutLeft: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(-70px)', opacity: '0' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(70px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        popIn: {
          '0%': { transform: 'scale(.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'slide-out': 'slideOutLeft .4s ease-in forwards',
        'slide-in': 'slideInRight .45s ease-out both',
        'pop-in': 'popIn .2s ease-out both',
      },
    },
  },
  plugins: [],
};
