/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        military: {
          50: '#f4f6f4',
          100: '#e5eae4',
          200: '#cbd6c9',
          300: '#a4b8a2',
          400: '#7a9677',
          500: '#5a7857',
          600: '#466043',
          700: '#384d36',
          800: '#2f3f2e',
          900: '#283527',
          950: '#151c14',
        },
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43',
          950: '#0a1a2b',
        },
        iaf: {
          blue: '#1b365d',
          gold: '#c99700',
          sky: '#4a90e2'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
