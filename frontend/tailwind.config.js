/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        emergency: {
          primary: '#1e40af',
          secondary: '#3b82f6',
          danger: '#dc2626',
          warning: '#f59e0b',
          success: '#10b981',
          neutral: '#6b7280',
        },
      },
    },
  },
  plugins: [],
}


