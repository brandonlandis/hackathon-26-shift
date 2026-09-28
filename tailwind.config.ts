import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#11263E',
        teal: '#0D8A8D',
        amber: '#C98214',
        danger: '#C53F3F',
        shell: '#F4F7FA',
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        panel: '0 10px 30px rgba(17, 38, 62, 0.08)',
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        rise: 'rise 280ms ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
