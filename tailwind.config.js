/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx,html}', // adjust as needed for your project
    './components/**/*.{js,ts,jsx,tsx,html}', // if you have a /components folder
    // add other folders where you use Tailwind classes
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
