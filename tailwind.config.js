/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        hungers: '#c1ff72',
        'hungers-dark': '#1a3a1a',
        'hungers-medium': '#88d43d',
        'hungers-soft': '#f1ffde'
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '3rem'
      }
    }
  },
  plugins: [],
};
