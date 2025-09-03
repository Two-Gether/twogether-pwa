/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/shared/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      maxWidth: {
        'mobile': '393px',
      },
      screens: {
        'mobile': '393px',
        'desktop': '394px',
      },
      colors: {
        // 단순 매핑(투명도 수식 `/50` 같은 건 작동 X)
        gray: {
          100: 'var(--color-grayScale-100)',
          200: 'var(--color-grayScale-200)',
          300: 'var(--color-grayScale-300)',
          400: 'var(--color-grayScale-400)',
          500: 'var(--color-grayScale-500)',
          600: 'var(--color-grayScale-600)',
          700: 'var(--color-grayScale-700)',
        },
        brand: {
          100: 'var(--color-brand-100)',
          200: 'var(--color-brand-200)',
          300: 'var(--color-brand-300)',
          400: 'var(--color-brand-400)',
          500: 'var(--color-brand-500)',
          600: 'var(--color-brand-600)',
          700: 'var(--color-brand-700)',
        },
        sub: {
          100: 'var(--color-sub-100)',
          200: 'var(--color-sub-200)',
          300: 'var(--color-sub-300)',
          400: 'var(--color-sub-400)',
          500: 'var(--color-sub-500)',
          600: 'var(--color-sub-600)',
          700: 'var(--color-sub-700)',
        },
        semantic: {
          error: 'var(--color-semantic-error)',
          success: 'var(--color-semantic-success)',
          info: 'var(--color-semantic-info)',
          caution: 'var(--color-semantic-caution)',
        },
      },
      fontFamily: {
        'catways': ['Catways', 'sans-serif'],
        'pretendard': ['Pretendard', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
