/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#0F0F13',
        card: '#1A1A24',
        border: '#2A2A38',
        foreground: '#F0F0F5',
        muted: '#8888A0',
        primary: '#1D9E75',
        amber: '#BA7517',
        blue: '#378ADD',
        danger: '#E24B4A',
      },
      fontFamily: {
        sans: ['DM-Sans', 'system-ui'],
        mono: ['DM-Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
