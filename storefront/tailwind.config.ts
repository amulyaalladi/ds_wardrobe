import type { Config } from "tailwindcss"

// DS Wardrobe tokens. Replace after completing docs/design-analysis.md.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F4F3F0",
        ink: "#1A1A1E",
        mulberry: { DEFAULT: "#5B2245", dark: "#431932", tint: "#EFE3EA" },
        stone: "#7C7B77",
        line: "#DCDAD5",
        sale: "#B3261E",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}
export default config
