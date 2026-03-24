import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary - 暖橙色（食欲诱发色）
        primary: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316",
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
        },
        // Secondary - 暖棕色系
        secondary: {
          50: "#FEF7ED",
          100: "#FDEBD0",
          200: "#FBDCA8",
          300: "#F4C38A",
          400: "#E8A654",
          500: "#D4873E",
          600: "#B86E2E",
          700: "#9A5625",
          800: "#7C431F",
          900: "#5E3218",
        },
        // Semantic colors
        success: {
          50: "#F0FDF4",
          100: "#DCFCE7",
          500: "#22C55E",
          600: "#16A34A",
          700: "#15803D",
        },
        warning: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          500: "#F59E0B",
          600: "#D97706",
        },
        error: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
        },
        info: {
          50: "#F0F9FF",
          100: "#E0F2FE",
          500: "#0EA5E9",
          600: "#0284C7",
        },
        // Background colors
        background: {
          page: "#FBF8F4",
          card: "#FFFFFF",
          elevated: "#FFFCF9",
          overlay: "rgba(0, 0, 0, 0.5)",
          skeleton: "#F5F0EB",
          "skeleton-shimmer": "#EDE6DF",
        },
        // Text colors
        text: {
          primary: "#1C1917",
          secondary: "#57534E",
          tertiary: "#A8A29E",
          disabled: "#D6D3D1",
          inverse: "#FFFFFF",
        },
        // Border colors
        border: {
          default: "#E7E5E4",
          strong: "#D6D3D1",
          subtle: "#F5F0EB",
        },
      },
      spacing: {
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "5": "20px",
        "8": "32px",
        "10": "40px",
        "16": "64px",
      },
      borderRadius: {
        "sm": "4px",
        "DEFAULT": "8px",
        "md": "8px",
        "lg": "12px",
        "xl": "16px",
        "2xl": "20px",
      },
      boxShadow: {
        "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        "DEFAULT": "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
        "md": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
        "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
      },
      fontFamily: {
        sans: ["PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", "sans-serif"],
        mono: ["SF Mono", "Monaco", "Inconsolata", "Roboto Mono", "monospace"],
      },
      // Hide scrollbar utility for horizontal scrolling
      scrollbar: {
        hide: {
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          '&': {
            '-ms-overflow-style': 'none',
            'scrollbar-width': 'none',
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
