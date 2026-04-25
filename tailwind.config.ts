import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '1200px',
      },
    },
    extend: {
      fontFamily: {
        sans: [
          'Montserrat',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'sans-serif',
        ],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        navy: {
          700: '#1E3A8A',
          800: '#0A2770',
          900: '#00205B',
        },
        teal: {
          500: '#01CFB5',
          600: '#01A695',
        },
        // Paleta oficial Medway: 5 famílias × 7 tons (DEFAULT, 80, 60, 40, 20, 10, 5).
        'brand-primary': {
          DEFAULT: '#00205B',
          80: '#334C7C',
          60: '#66799D',
          40: '#99A6BD',
          20: '#CCD2DE',
          10: '#E5E8EE',
          5: '#F2F4F7',
        },
        'brand-secondary': {
          DEFAULT: '#01CFB5',
          80: '#34D9C4',
          60: '#67E2D3',
          40: '#99ECE1',
          20: '#CCF5F0',
          10: '#E5FAF7',
          5: '#F2F4F7',
        },
        'brand-clinic': {
          DEFAULT: '#407EC9',
          80: '#6698D4',
          60: '#8CB2DF',
          40: '#B3CBE9',
          20: '#D9E5F4',
          10: '#ECF2F9',
          5: '#F5F8FC',
        },
        'brand-surgery': {
          DEFAULT: '#00EFC8',
          80: '#33F2D3',
          60: '#66F5DE',
          40: '#99F9E9',
          20: '#CCFCF4',
          10: '#E5FDF9',
          5: '#F2FEFC',
        },
        'brand-preventive': {
          DEFAULT: '#3B3FB6',
          80: '#6265C5',
          60: '#898CD3',
          40: '#B1B2E2',
          20: '#D8D9F0',
          10: '#EBEBF8',
          5: '#F5F5FB',
        },
        'brand-neutral': '#52575C',
        neutral: {
          0: '#FFFFFF',
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        'semantic-success': '#10B981',
        'semantic-warning': '#F59E0B',
        'semantic-danger': '#DC2626',
        'semantic-info': '#3B82F6',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'score-fill': {
          from: { width: '0%' },
          to: { width: 'var(--score-width)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'score-fill': 'score-fill 0.8s ease-out forwards',
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
