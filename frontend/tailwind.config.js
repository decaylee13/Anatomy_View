/** @type {import('tailwindcss').Config} */
export default {
  content: ['index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', '"Segoe UI"', 'system-ui', '-apple-system', 'sans-serif']
      },
      boxShadow: {
        float: '0 24px 48px rgba(15, 23, 42, 0.08)',
        panel: '0 24px 48px rgba(15, 23, 42, 0.12)',
        badge: '0 10px 25px rgba(14, 165, 233, 0.25)',
        button: '0 10px 22px rgba(15, 23, 42, 0.1)',
        buttonActive: '0 12px 26px rgba(56, 189, 248, 0.32)',
        submit: '0 8px 20px rgba(37, 99, 235, 0.35)',
        chat: '0 8px 28px rgba(15, 23, 42, 0.15)'
      }
    }
  },
  plugins: []
};
