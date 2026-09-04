/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                'color-primary': 'var(--color-primary)',
                'color-primary-dark': 'var(--color-primary-dark)',
                'color-primary-light': 'var(--color-primary-light)',
                'color-secondary': 'var(--color-secondary)',
                'color-background-dark': 'var(--color-background-dark)',
                'color-surface': 'var(--color-surface)',
                'color-surface-hover': 'var(--color-surface-hover)',
                'color-border': 'var(--color-border)',
                'color-text-primary': 'var(--color-text-primary)',
                'color-text-secondary': 'var(--color-text-secondary)',
                'color-text-muted': 'var(--color-text-muted)',
                'color-success': 'var(--color-success)',
                'color-warning': 'var(--color-warning)',
                'color-error': 'var(--color-error)',
            },
        },
    },
    plugins: [],
};