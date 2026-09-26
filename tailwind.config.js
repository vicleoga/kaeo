/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        offwhite: '#F7F5EF',
        sand: '#D9C9B1',
        sage: '#8A9B8F',
        'washed-blue': '#5C7A8A',
        'washed-black': '#2E2E2E',
      },
      fontFamily: {
        sans: ['Jost', 'Montserrat', 'system-ui', 'sans-serif'],
        script: ['"Mrs Saint Delafield"', 'Allura', 'cursive'],
      },
      letterSpacing: {
        brand: '0.2em',
        wider2: '0.28em',
        label: '0.32em',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 2.2s ease-out both',
        'fade-up': 'fade-up 1.4s cubic-bezier(.2,.7,.2,1) both',
      },
    },
  },
  plugins: [],
}
