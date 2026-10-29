/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#080c14',
          panel: '#0e1526',
          border: '#1f2d4d',
          neonCyan: '#00f3ff',
          neonGreen: '#00ff66',
          neonRed: '#ff3333',
          neonAmber: '#ff9900',
          neonPurple: '#bd00ff',
          terminalText: '#a0b3d6'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 6s linear infinite',
        'waveform': 'waveform 1.2s ease-in-out infinite alternate',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 10px rgba(0, 243, 255, 0.7))' },
          '50%': { opacity: '0.4', filter: 'drop-shadow(0 0 2px rgba(0, 243, 255, 0.2))' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' }
        },
        waveform: {
          '0%': { height: '15%' },
          '100%': { height: '100%' }
        }
      }
    },
  },
  plugins: [],
}

