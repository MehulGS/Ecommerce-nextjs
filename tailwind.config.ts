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
        // Brand palette
        ivory: {
          50: '#FDFAF5',
          100: '#FAF6EE',
          200: '#F5EFE0',
          DEFAULT: '#FAF6EE',
        },
        blush: {
          50: '#FEF0F3',
          100: '#FDDDE6',
          200: '#F9B8CB',
          300: '#F49BB5',
          400: '#EC7A9A',
          500: '#E05C80',
          600: '#C94070',
          DEFAULT: '#F49BB5',
        },
        rose: {
          champagne: '#C9A96E',
          dusty: '#D4849A',
          mauve: '#B57E8E',
        },
        plum: {
          50: '#F5EFF4',
          100: '#E8D3E5',
          200: '#C9A3C4',
          700: '#5D2C5C',
          800: '#3D1C3C',
          900: '#2A1229',
          DEFAULT: '#3D1C3C',
        },
        gold: {
          light: '#E8D48F',
          DEFAULT: '#C9A96E',
          dark: '#A07840',
        },
        lavender: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          DEFAULT: '#C4B5FD',
        },
        peach: {
          50: '#FFF7F0',
          100: '#FFEADB',
          200: '#FFD4B8',
          300: '#FFBF95',
          DEFAULT: '#FFD4B8',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "hero-gradient": "linear-gradient(135deg, #FAF6EE 0%, #FEF0F3 50%, #F5F3FF 100%)",
        "card-hover": "linear-gradient(135deg, #FEF0F3 0%, #FAF6EE 100%)",
      },
      boxShadow: {
        'soft': '0 2px 20px rgba(61, 28, 60, 0.06)',
        'card': '0 4px 30px rgba(61, 28, 60, 0.08)',
        'hover': '0 8px 40px rgba(61, 28, 60, 0.12)',
        'button': '0 2px 12px rgba(201, 169, 110, 0.3)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'bounce-soft': 'bounceSoft 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
