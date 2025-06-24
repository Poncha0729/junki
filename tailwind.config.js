/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // ダークモードをクラスベースで有効化
  content: [
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ekicho: {
          primary: '#FF4E4E',
          accent: '#FF9F1C',
        },
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      animation: {
        'letter-reveal': 'letter-reveal 1s ease-out forwards',
        'sparkle': 'sparkle 2s ease-in-out infinite',
      },
      keyframes: {
        'letter-reveal': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'sparkle': {
          '0%': { opacity: '0.1', transform: 'scale(0.95)' },
          '50%': { opacity: '0.5', transform: 'scale(1.05)' },
          '100%': { opacity: '0.1', transform: 'scale(0.95)' },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}
