/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#E31E24",
          darkRed: "#B81419",
          gray: "#6D6E71",
          lightGray: "#F4F5F7",
          green: "#2E9E5B",
        },
      },
      fontFamily: {
        sans: ["Montserrat", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
