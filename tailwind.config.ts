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
        slot: {
          available: "#ecfdf5",
          booked: "#dbeafe",
          blocked: "#fef3c7",
          unavailable: "#f4f4f5",
        },
      },
    },
  },
  plugins: [],
};

export default config;
