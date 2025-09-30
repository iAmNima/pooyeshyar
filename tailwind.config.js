/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#48a0b8',
      },
      boxShadow: {
        'sm': '0 0 8px 3px rgba(0, 0, 0, 0.08)',
        'soft': '0 0 15px 5px rgba(0, 0, 0, 0.15)',
        'strong': '0 0 25px 8px rgba(0, 0, 0, 0.2)',
        'xl-custom': '0 0 35px 10px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  plugins: [require('tailwindcss-rtl')],
}
