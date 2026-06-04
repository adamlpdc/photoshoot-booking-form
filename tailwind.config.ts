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
          DEFAULT: "#fafafa",
          muted: "#f4f4f5",
        },
        ink: {
          DEFAULT: "#18181b",
          muted: "#71717a",
        },
        calendar: {
          bg: "#f5f7fa",
          header: "#ffffff",
          cell: "#f5f7fa",
          line: "#e2e8f0",
          lineSubtle: "#eef2f6",
          today: "#eff6ff",
        },
      },
    },
  },
  plugins: [],
};

export default config;
