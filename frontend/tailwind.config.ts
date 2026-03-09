import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Orange & Navy Theme (From your Button Image)
        brand: {
          bg: '#040316',       // Deepest navy for main background
          surface: '#0C0A4B',  // Navy from your image for cards
          border: '#1E1985',   // Lighter navy for borders
          muted: '#8A87C3',    // Muted blue-gray for subtext
          accent: '#E87D20',   // Exact Orange from your image
          light: '#FFB366',    // Light orange for glows
          deep: '#06052B',     // Extra dark navy
        }
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Devanagari', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Noto Sans Devanagari', 'Inter', 'sans-serif'],
        hindi: ['Noto Sans Devanagari', 'sans-serif'],
      },
      backgroundImage: {
        'btn-gradient': 'linear-gradient(to right, #E87D20, #0C0A4B)',
        'btn-gradient-hover': 'linear-gradient(to right, #FF9933, #151185)',
        'hero-glow': 'radial-gradient(circle at center, rgba(232, 125, 32, 0.15) 0%, transparent 60%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
        'neon-accent': '0 0 30px rgba(232, 125, 32, 0.4)',
        'neon-surface': '0 0 30px rgba(12, 10, 75, 0.6)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'blob': 'blob 10s infinite',
        'gradient-x': 'gradient-x 5s ease infinite',
        'gradient-xy': 'gradient-xy 8s ease infinite',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center',
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center',
          },
        },
        'gradient-xy': {
          '0%, 100%': {
            'background-size': '400% 400%',
            'background-position': 'left top',
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right bottom',
          },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
} satisfies Config