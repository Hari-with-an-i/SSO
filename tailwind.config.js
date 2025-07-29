
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./Serious-studies-Only/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        header: ['Amatic SC', 'cursive'],
        handwriting: ['Caveat', 'cursive'],
        doodle: ['Kalam', 'cursive'],
        comfortaa: ['Comfortaa', 'cursive'],
      },
    },
  },
  plugins: [],
}
