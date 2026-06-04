import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#ffffff",
          muted: "#ffffff",
        },
        ink: {
          DEFAULT: "#18181b",
          muted: "#71717a",
        },
        calendar: {
          bg: "#ffffff",
          header: "#ffffff",
          cell: "#ffffff",
          line: "#e4e4e7",
          lineSubtle: "#f4f4f5",
          today: "#f8fafc",
        },
      },
    },
  },
  plugins: [],
};

export default config;
