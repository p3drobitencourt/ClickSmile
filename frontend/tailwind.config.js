/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts,css,scss}',
    './index.html'
  ],
  theme: {
    extend: {
      colors: {
        cs: {
          bg: 'var(--cs-bg)',
          surface: 'var(--cs-surface)',
          text: 'var(--cs-text)',
          muted: 'var(--cs-text-muted)',
          primary: {
            DEFAULT: '#06b6d4', // cyan-500
            dark: '#0891b2'
          }
        }
      },
      borderRadius: {
        'xl': '1rem'
      }
    }
  },
  plugins: []
}
