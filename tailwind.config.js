/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // This tells Tailwind to create classes like 'text-ocean-dark', 'bg-ocean-dark', etc.
      colors: {
        'ocean-dark': '#073b4c',
        'ocean-light': '#f0f9ff',
        'accent-aqua': '#118ab2',
        'accent-coral': '#ef476f',
        'border-color': '#d1e5f0',
      }
    },
  },
  plugins: [],
}