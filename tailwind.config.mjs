/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        abyss: '#0A0F0D',
        forest: '#1A2820',
        patagonia: '#2D5A3D',
        lima: '#7CFC8A',
        bone: '#E8E4DC',
        moss: '#6B7B70',
        // surface tokens for glass / bento depth
        surface: '#0E1512',
        glow: '#7CFC8A',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', '"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(124,252,138,0.45)',
        'glow-sm': '0 0 24px -6px rgba(124,252,138,0.35)',
        card: '0 24px 60px -24px rgba(0,0,0,0.7)',
      },
      backgroundImage: {
        'grid-lima':
          'linear-gradient(rgba(124,252,138,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(124,252,138,.5) 1px, transparent 1px)',
        'radial-glow':
          'radial-gradient(600px circle at var(--mx,50%) var(--my,50%), rgba(124,252,138,0.12), transparent 40%)',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.6' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2.4s ease-out infinite',
      },
    },
  },
  plugins: [],
};
