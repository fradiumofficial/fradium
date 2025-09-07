/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.html"
  ],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        'custom-dark': '#25262B',
        'custom-darker': '#1F2025',
        'custom-hover': '#2A2B30',
        'custom-purple': '#823EFD',
        'custom-green': '#99E39E',
        'custom-green-alt': '#99E4A0',
        'custom-text-green': '#9BE4A0',
      },
      width: {
        '375': '375px',
        '327': '327px',
        '145': '145px',
        '50': '50px',
      },
      height: {
        '600': '600px',
        '215': '215px',
        '60': '60px',
        '45': '45px',
      },
      fontSize: {
        '16': '16px',
      }
    },
  },
  plugins: [],
}
