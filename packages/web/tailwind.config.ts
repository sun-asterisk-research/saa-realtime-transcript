import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Base colors from CSS variables
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },

        // Plum Red Palette
        plum: {
          50: 'var(--plum-50)',
          100: 'var(--plum-100)',
          200: 'var(--plum-200)',
          300: 'var(--plum-300)',
          400: 'var(--plum-400)',
          500: 'var(--plum-500)',
          600: 'var(--plum-600)',
          700: 'var(--plum-700)',
          800: 'var(--plum-800)',
          900: 'var(--plum-900)',
          950: 'var(--plum-950)',
        },

        // Surface colors
        surface: {
          white: 'var(--surface-white)',
          light: 'var(--surface-light)',
          muted: 'var(--surface-muted)',
          dark: 'var(--surface-dark)',
          'dark-secondary': 'var(--surface-dark-secondary)',
          'dark-accent': 'var(--surface-dark-accent)',
        },

        // Border colors
        border: {
          DEFAULT: 'var(--border-light)',
          light: 'var(--border-light)',
          muted: 'var(--border-muted)',
          primary: 'var(--border-primary)',
        },

        // Text colors
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          light: 'var(--text-light)',
        },

        // Semantic colors
        success: {
          DEFAULT: 'hsl(var(--success))',
          light: 'var(--success-light)',
        },
        error: {
          DEFAULT: 'hsl(var(--error))',
          light: 'var(--error-light)',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          light: 'var(--warning-light)',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          light: 'var(--info-light)',
        },
      },

      // Box shadows
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        primary: 'var(--shadow-primary)',
      },

      // Border radius
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },

      // Font sizes
      fontSize: {
        subtitle: 'var(--text-subtitle)',
        'subtitle-streaming': 'var(--text-subtitle-streaming)',
        placeholder: 'var(--text-placeholder)',
      },

      // Animations
      animation: {
        blink: 'blink 1s infinite',
        fadeIn: 'fadeIn 0.2s ease-out forwards',
        textPulse: 'textPulse 0.5s ease-in-out',
        float: 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        gradient: 'gradientShift 8s ease infinite',
        slideUp: 'slideUp 0.4s ease-out forwards',
        scaleIn: 'scaleIn 0.2s ease-out forwards',
      },

      // Background gradients
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-light': 'var(--gradient-light)',
        'gradient-dark': 'var(--gradient-dark)',
        'gradient-hero': 'var(--gradient-hero)',
      },

      // Transitions
      transitionDuration: {
        fast: '150ms',
        normal: '250ms',
        slow: '350ms',
      },

      // Z-index
      zIndex: {
        modal: '100',
        tooltip: '110',
        toast: '120',
      },
    },
  },
  plugins: [],
} satisfies Config;
