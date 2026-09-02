/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#E0FBFC',   // Light cyan background & highlights
          100: '#C2DFE3',  // Soft blue-gray secondary surface & cards
          300: '#9DB4C0',  // Muted blue-gray borders & badges
          600: '#5C6B73',  // Dark slate gray secondary text & controls
          900: '#253237',  // Deep charcoal primary headings & buttons
        },
        clinic: {
          50: '#E0FBFC',
          100: '#C2DFE3',
          300: '#9DB4C0',
          600: '#5C6B73',
          900: '#253237',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
