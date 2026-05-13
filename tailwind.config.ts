import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Wonderpad Design System (from Stitch)
        "primary": "#994200",
        "primary-container": "#c05400",
        "on-primary": "#ffffff",
        "on-primary-container": "#fffbff",
        "on-primary-fixed": "#331100",
        "on-primary-fixed-variant": "#783200",
        "primary-fixed": "#ffdbca",
        "primary-fixed-dim": "#ffb690",
        "inverse-primary": "#ffb690",

        "secondary": "#565e74",
        "secondary-container": "#dae2fd",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#5c647a",
        "on-secondary-fixed": "#131b2e",
        "on-secondary-fixed-variant": "#3f465c",
        "secondary-fixed": "#dae2fd",
        "secondary-fixed-dim": "#bec6e0",

        "tertiary": "#615c4b",
        "tertiary-container": "#7a7463",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#fffbff",
        "on-tertiary-fixed": "#1f1b0f",
        "on-tertiary-fixed-variant": "#4b4637",
        "tertiary-fixed": "#ebe2cd",
        "tertiary-fixed-dim": "#cec6b2",

        "surface": "#f8f9ff",
        "surface-dim": "#cbdbf5",
        "surface-bright": "#f8f9ff",
        "surface-variant": "#d3e4fe",
        "surface-tint": "#9d4400",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#eff4ff",
        "surface-container": "#e5eeff",
        "surface-container-high": "#dce9ff",
        "surface-container-highest": "#d3e4fe",
        "on-surface": "#0b1c30",
        "on-surface-variant": "#584237",
        "inverse-surface": "#213145",
        "inverse-on-surface": "#eaf1ff",

        "background": "#f8f9ff",
        "on-background": "#0b1c30",

        "outline": "#8c7265",
        "outline-variant": "#e0c0b1",

        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",

        "wonderpad-orange": "#E8690A",

        "sepia-bg": "#F5ECD7",
        "sepia-text": "#5C4A1E",
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
        full: "9999px",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "40px",
        "reader-width": "720px",
        "container-max": "1280px",
      },
      fontFamily: {
        "ui-body": ["Inter", "sans-serif"],
        "reader-body": ["Newsreader", "serif"],
        "headline-md": ["Inter", "sans-serif"],
        "label-sm": ["Inter", "sans-serif"],
        "display-lg": ["Inter", "sans-serif"],
      },
      fontSize: {
        "reader-body": ["20px", { lineHeight: "1.6", letterSpacing: "0", fontWeight: "400" }],
        "ui-body": ["16px", { lineHeight: "1.5", letterSpacing: "0", fontWeight: "400" }],
        "display-lg": ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "label-sm": ["13px", { lineHeight: "1", letterSpacing: "0.05em", fontWeight: "600" }],
        "headline-md": ["24px", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" }],
      },
    },
  },
  plugins: [],
};
export default config;
