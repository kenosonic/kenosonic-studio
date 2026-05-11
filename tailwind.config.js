/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'ks-lava':      '#F56E0F',
        'ks-lava-tint': '#FFF0E6',
        'ks-void':      '#0D0D0D',
        'ks-ash':       '#F0EDE8',
        'ks-white':     '#FFFFFF',
        'ks-pebble':    '#E8E5E0',
        'ks-smoke':     '#F8F6F3',
        'ks-ink':       '#0D0D0D',
        'ks-slate':     '#3A3A3A',
        'ks-silver':    '#9A9A9A',
        'ks-ghost':     '#BCBCBC',
        'ks-rule':      '#D4D0CA',
        'ks-hairline':  '#E8E5E0',
        'ks-void-rule': '#1E1E1E',
        'ks-void-grid': '#2A2A2A',
        'ks-lava-dark': '#C24D00',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        ks: '2px',
      },
    },
  },
  plugins: [],
}
