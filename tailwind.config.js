/** @type {import('tailwindcss').Config} */
//this has been deprecrated by v4, but by adding @config "../tailwind.config.js"; in index.css,
//this config still works.
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx,html}', // adjust as needed for your project
    './components/**/*.{js,ts,jsx,tsx,html}', // if you have a /components folder
  ],
  theme: {
    extend: {
      colors: {
        'imos-white': '#fff',
        'imos-black': '#000',
        'imos-red': '#e53935',
        'imos-grey': '#232936',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};
