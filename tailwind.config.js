/** @type {import('tailwindcss').Config} */
module.exports = {
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      textColor: ['placeholder'], 
      backgroundColor: {
        "custom-gray-bg": "#F8F8F8",
        "custom-gray": "#171717",
        "custom-dark-gray": "#1D1D1D",
        "frame-gray": "EEEEEE",
      },
      borderColor: {
        "custom-gray": "#171717",
      },
      placeholderColor: {
        'dark': '#FFFFFF',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@headlessui/tailwindcss")],
};
