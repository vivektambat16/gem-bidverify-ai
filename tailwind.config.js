/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        "champagne": {
              "50": "#FFFBEB",
              "100": "#FEF3C7",
              "200": "#FDE68A",
              "300": "#FCD34D",
              "400": "#F59E0B",
              "500": "#D97706",
              "600": "#C2410C",
              "700": "#9A3412",
              "800": "#78350F",
              "900": "#451A03"
        },
        "pine": {
              "400": "#2DD4BF",
              "500": "#14B8A6",
              "600": "#0F766E",
              "700": "#134E43",
              "800": "#0D3830",
              "900": "#08231E",
              "950": "#041411"
        },
        "obsidian": {
              "850": "#0E1C2F",
              "900": "#0B1524",
              "950": "#060D17"
        }
  },
      boxShadow: {
        'card-soft': '0 2px 10px -2px rgba(0, 0, 0, .04), 0 1px 3px -1px rgba(0, 0, 0, .02)',
        'card-hover': '0 12px 24px -6px rgba(11, 21, 36, .08), 0 4px 8px -2px rgba(11, 21, 36, .04)',
        'glow-teal': '0 0 20px -3px rgba(20, 184, 166, .25)',
        'glow-champagne': '0 0 20px -3px rgba(245, 158, 11, .25)',
      },
    },
  },
  plugins: [],
};
