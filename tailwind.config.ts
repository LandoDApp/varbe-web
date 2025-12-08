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
                // Base Colors
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: "#000000",
                secondary: "#FFFFFF",
                "off-white": "#F5F5F5",
                
                // Accent Colors
                accent: {
                    DEFAULT: "#CCFF00", // Neon Lime
                    pink: "#FF10F0",    // Neon Pink
                    blue: "#00F0FF",    // Electric Blue
                },
                
                // Grayscale
                gray: {
                    100: "#F9F9F9",
                    200: "#E5E5E5",
                    400: "#999999",
                    600: "#666666",
                    900: "#1A1A1A",
                },
                
                // Status Colors
                success: "#00FF00",
                warning: "#FFD700",
                error: "#FF0000",
                info: "#00F0FF",
            },
            
            fontFamily: {
                heading: ["var(--font-bangers)", "cursive"],
                body: ["var(--font-inter)", "sans-serif"],
            },
            
            fontSize: {
                // Typography Scale (Mobile)
                'hero': ['48px', { lineHeight: '1.1' }],
                'h1': ['32px', { lineHeight: '1.2' }],
                'h2': ['24px', { lineHeight: '1.3' }],
                'h3': ['20px', { lineHeight: '1.4' }],
                'body-lg': ['18px', { lineHeight: '1.5' }],
                'body': ['16px', { lineHeight: '1.6' }],
                'body-sm': ['14px', { lineHeight: '1.5' }],
                'caption': ['12px', { lineHeight: '1.4' }],
            },
            
            spacing: {
                // 8pt Grid System
                'xs': '4px',
                'sm': '8px',
                'md': '16px',
                'lg': '24px',
                'xl': '32px',
                '2xl': '48px',
                '3xl': '64px',
                // Safe Areas
                'safe-top': 'env(safe-area-inset-top, 0px)',
                'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
                'safe-left': 'env(safe-area-inset-left, 0px)',
                'safe-right': 'env(safe-area-inset-right, 0px)',
                // Nav Heights
                'nav-bottom': '64px',
                'nav-top': '56px',
            },
            
            borderWidth: {
                '3': '3px',
                '4': '4px',
                '6': '6px',
            },
            
            borderRadius: {
                'none': '0px',
                'soft': '8px',
                'pill': '999px',
            },
            
            boxShadow: {
                // Comic Shadows
                'comic': '6px 6px 0px 0px #000000',
                'comic-hover': '3px 3px 0px 0px #000000',
                'comic-pressed': '1px 1px 0px 0px #000000',
                'comic-elevated': '8px 8px 0px 0px #000000',
                'comic-sm': '4px 4px 0px 0px #000000',
                // Neon Glow
                'glow-green': '0 0 20px rgba(204, 255, 0, 0.6)',
                'glow-pink': '0 0 20px rgba(255, 16, 240, 0.6)',
                'glow-blue': '0 0 20px rgba(0, 240, 255, 0.6)',
                // Tab Bar Shadow
                'tab-bar': '0 -4px 0px 0px rgba(0,0,0,0.1)',
            },
            
            backgroundImage: {
                'halftone': 'radial-gradient(#000 1px, transparent 1px)',
                'halftone-lg': 'radial-gradient(circle, rgba(0, 0, 0, 0.12) 8px, transparent 8px)',
            },
            
            backgroundSize: {
                'halftone': '10px 10px',
                'halftone-lg': '50px 50px',
            },
            
            animation: {
                'button-press': 'button-press 150ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                'slide-in': 'slide-in-right 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                'slide-out': 'slide-out-right 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                'slide-up': 'slide-up 250ms ease-out',
                'heart-pop': 'heart-pop 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                'shake': 'shake 400ms ease-in-out',
                'pow': 'pow-burst 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                'pulse-glow': 'pulse-glow 2s infinite',
                'shimmer': 'shimmer 1.5s infinite ease-in-out',
            },
            
            keyframes: {
                'button-press': {
                    '0%': { transform: 'translate(0, 0)', boxShadow: '6px 6px 0px 0px #000000' },
                    '50%': { transform: 'translate(5px, 5px)', boxShadow: '1px 1px 0px 0px #000000' },
                    '100%': { transform: 'translate(0, 0)', boxShadow: '6px 6px 0px 0px #000000' },
                },
                'slide-in-right': {
                    from: { transform: 'translateX(100%)', opacity: '0' },
                    to: { transform: 'translateX(0)', opacity: '1' },
                },
                'slide-out-right': {
                    from: { transform: 'translateX(0)', opacity: '1' },
                    to: { transform: 'translateX(100%)', opacity: '0' },
                },
                'slide-up': {
                    from: { transform: 'translateY(100%)', opacity: '0' },
                    to: { transform: 'translateY(0)', opacity: '1' },
                },
                'heart-pop': {
                    '0%': { transform: 'scale(0)' },
                    '50%': { transform: 'scale(1.3)' },
                    '100%': { transform: 'scale(1)' },
                },
                'shake': {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '25%': { transform: 'translateX(-10px)' },
                    '75%': { transform: 'translateX(10px)' },
                },
                'pow-burst': {
                    '0%': { transform: 'scale(0) rotate(-10deg)', opacity: '0' },
                    '50%': { transform: 'scale(1.2) rotate(5deg)', opacity: '1' },
                    '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
                },
                'pulse-glow': {
                    '0%, 100%': { boxShadow: '6px 6px 0px 0px #000000' },
                    '50%': { boxShadow: '6px 6px 0px 0px #000000, 0 0 20px rgba(204, 255, 0, 0.6)' },
                },
                'shimmer': {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
            
            transitionTimingFunction: {
                'comic': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
            },
            
            zIndex: {
                'base': '1',
                'card': '10',
                'dropdown': '100',
                'sticky': '200',
                'drawer': '300',
                'modal': '400',
                'toast': '500',
                'tooltip': '600',
                'max': '9999',
            },
            
            screens: {
                // Mobile breakpoints
                'mobile-s': '320px',
                'mobile-m': '375px',
                'mobile-l': '425px',
                'tablet': '768px',
                'desktop': '1025px',
            },
            
            minHeight: {
                'touch': '48px',
                'touch-lg': '56px',
            },
            
            minWidth: {
                'touch': '48px',
                'touch-lg': '56px',
            },
        },
    },
    plugins: [],
};

export default config;
