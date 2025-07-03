const config = {
  darkMode: ["class"],
  content: ["./pages/**/*.{js,jsx}", "./components/**/*.{js,jsx}", "./app/**/*.{js,jsx}", "./src/**/*.{js,jsx}", "*.{js,jsx,mdx}", "*.{js,ts,jsx,tsx,mdx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["General Sans", "system-ui", "sans-serif"],
      },
      colors: {
        // Fradium Design System Colors
        primary: {
          green: "#9BEB83",
          purple: "#A259FF", 
          black: "#0C0D14",
          white: "#FFFFFF",
        },
        support: {
          pink: "#FF2C9C",
          blue: "#2CDDFE", 
          yellow: "#FFD74B",
          cyan: "#00F0FF",
        },
        // Keep original shadcn colors for compatibility
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontSize: {
        // Fradium Typography Scale
        'h1': ['64px', { lineHeight: '120%', fontWeight: '700' }],
        'h2': ['48px', { lineHeight: '120%', fontWeight: '600' }],
        'subtitle': ['20px', { lineHeight: '150%', fontWeight: '500' }],
        'body': ['16px', { lineHeight: '150%', fontWeight: '400' }],
        'caption': ['14px', { lineHeight: '140%', fontWeight: '500' }],
        'button': ['16px', { lineHeight: '130%', fontWeight: '600' }],
      },
      spacing: {
        // 8pt Grid System
        'xs': '4px',
        's': '8px', 
        'm': '16px',
        'l': '32px',
        'xl': '64px',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
