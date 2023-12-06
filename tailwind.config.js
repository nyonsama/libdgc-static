/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./build.tsx", "./src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/typography")],
};
