// Clinical Clarity design tokens — ported from clinical_clarity/DESIGN.md
// and the tailwind-config blocks in the UI mockups.
//
// Colors resolve through CSS variables (RGB triplets defined in
// app/globals.css for :root and .dark) so the whole app themes from one
// place — `bg-surface/80`-style opacity modifiers keep working via
// <alpha-value>.
function v(name) {
  return `rgb(var(--c-${name}) / <alpha-value>)`;
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: v('primary'),
        'on-primary': v('on-primary'),
        'primary-container': v('primary-container'),
        'on-primary-container': v('on-primary-container'),
        'primary-fixed': v('primary-fixed'),
        'primary-fixed-dim': v('primary-fixed-dim'),
        'on-primary-fixed': v('on-primary-fixed'),
        'on-primary-fixed-variant': v('on-primary-fixed-variant'),
        'inverse-primary': v('inverse-primary'),
        secondary: v('secondary'),
        'on-secondary': v('on-secondary'),
        'secondary-container': v('secondary-container'),
        'on-secondary-container': v('on-secondary-container'),
        'secondary-fixed': v('secondary-fixed'),
        'secondary-fixed-dim': v('secondary-fixed-dim'),
        'on-secondary-fixed': v('on-secondary-fixed'),
        'on-secondary-fixed-variant': v('on-secondary-fixed-variant'),
        tertiary: v('tertiary'),
        'on-tertiary': v('on-tertiary'),
        'tertiary-container': v('tertiary-container'),
        'on-tertiary-container': v('on-tertiary-container'),
        'tertiary-fixed': v('tertiary-fixed'),
        'tertiary-fixed-dim': v('tertiary-fixed-dim'),
        'on-tertiary-fixed': v('on-tertiary-fixed'),
        'on-tertiary-fixed-variant': v('on-tertiary-fixed-variant'),
        error: v('error'),
        'on-error': v('on-error'),
        'error-container': v('error-container'),
        'on-error-container': v('on-error-container'),
        surface: v('surface'),
        'surface-dim': v('surface-dim'),
        'surface-bright': v('surface-bright'),
        'surface-container-lowest': v('surface-container-lowest'),
        'surface-container-low': v('surface-container-low'),
        'surface-container': v('surface-container'),
        'surface-container-high': v('surface-container-high'),
        'surface-container-highest': v('surface-container-highest'),
        'surface-variant': v('surface-variant'),
        'surface-tint': v('surface-tint'),
        'on-surface': v('on-surface'),
        'on-surface-variant': v('on-surface-variant'),
        'inverse-surface': v('inverse-surface'),
        'inverse-on-surface': v('inverse-on-surface'),
        outline: v('outline'),
        'outline-variant': v('outline-variant'),
        background: v('background'),
        'on-background': v('on-background'),
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      spacing: {
        'container-margin': '24px',
        'section-gap': '48px',
        base: '8px',
        'card-padding': '20px',
        gutter: '16px',
      },
      fontFamily: {
        display: ['var(--font-geist-sans)', 'sans-serif'],
        'headline-lg': ['var(--font-geist-sans)', 'sans-serif'],
        'headline-lg-mobile': ['var(--font-geist-sans)', 'sans-serif'],
        'headline-md': ['var(--font-geist-sans)', 'sans-serif'],
        'label-md': ['var(--font-geist-sans)', 'sans-serif'],
        'label-sm': ['var(--font-geist-sans)', 'sans-serif'],
        'body-lg': ['var(--font-inter)', 'sans-serif'],
        'body-md': ['var(--font-inter)', 'sans-serif'],
      },
      fontSize: {
        'label-sm': ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '600' }],
        'label-md': ['14px', { lineHeight: '20px', letterSpacing: '0.02em', fontWeight: '500' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'headline-lg-mobile': ['28px', { lineHeight: '34px', fontWeight: '600' }],
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '600' }],
        display: ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '700' }],
      },
    },
  },
  plugins: [],
};
