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
          'bg-elevated': 'var(--cs-bg-elevated)',
          surface: 'var(--cs-surface)',
          border: 'var(--cs-border)',
          text: 'var(--cs-text)',
          muted: 'var(--cs-text-muted)',
          primary: {
            DEFAULT: 'var(--cs-primary)',
            hover: 'var(--cs-primary-hover)',
            active: 'var(--cs-primary-active)'
          },
          success: 'var(--cs-success)',
          warning: 'var(--cs-warning)',
          danger: 'var(--cs-danger)',
          info: 'var(--cs-info)'
        }
      },
      borderRadius: {
        'xl': '1rem'
      }
    }
  },
  plugins: []
}
