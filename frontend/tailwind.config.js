/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#1D3557', light: '#457B9D' },
        coral: { DEFAULT: '#E63946', light: '#ff6b6b' },
        teal: { DEFAULT: '#2A9D8F' },
        sand: { DEFAULT: '#F1FAEE' },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
