/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2e7d32', // Deep emerald green
          hover: '#1b5e20', // Dark forest green
          light: '#e8f5e9', // Soft mint green background
          accent: '#4caf50', // Vibrant green accent
        },
        bg: {
          body: '#f4f7f5', // Warm medical off-white body background
          card: '#ffffff', // Pure white card backgrounds
        },
        text: {
          main: '#1f2937', // Charcoal
          muted: '#6b7280', // Cool gray
        }
      },
      fontFamily: {
        sans: ['Outfit', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '20px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
        md: '0 4px 6px -1px rgba(46,125,50,0.08), 0 2px 4px -1px rgba(0,0,0,0.04)',
        lg: '0 10px 25px -5px rgba(46,125,50,0.12), 0 8px 10px -6px rgba(0,0,0,0.04)',
      }
    },
  },
  plugins: [],
}
