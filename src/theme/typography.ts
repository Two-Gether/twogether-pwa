// TwoGether 앱 타이포그래피 설정
export const typography = {
    // Font Families
    fontFamily: {
        // 기본 폰트
        base: 'Pretendard-Regular',

        // 로고용 폰트 - Catways Font
        logo: 'Catways',
    },

    fontSize: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
        '5xl': 48,
        '6xl': 60,
    },

    fontWeight: {
        thin: '100',
        extralight: '200',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
    },

    lineHeight: {
        none: 1,
        tight: 1.25,
        snug: 1.375,
        normal: 1.5,
        relaxed: 1.625,
        loose: 2,
    },

    letterSpacing: {
        tighter: -0.05,
        tight: -0.025,
        normal: 0,
        wide: 0.025,
        wider: 0.05,
        widest: 0.1,
    },

    // Text Styles
    textStyles: {
        // Headings
        h1: {
            fontSize: 32,
            fontWeight: 'bold',
            lineHeight: 1.2,
            fontFamily: 'Pretendard-Regular',
        },
        h2: {
            fontSize: 28,
            fontWeight: 'bold',
            lineHeight: 1.3,
            fontFamily: 'Pretendard-Regular',
        },
        h3: {
            fontSize: 24,
            fontWeight: 'semibold',
            lineHeight: 1.4,
            fontFamily: 'Pretendard-Regular',
        },
        h4: {
            fontSize: 20,
            fontWeight: 'semibold',
            lineHeight: 1.4,
            fontFamily: 'Pretendard-Regular',
        },
        h5: {
            fontSize: 18,
            fontWeight: 'medium',
            lineHeight: 1.5,
            fontFamily: 'Pretendard-Regular',
        },
        h6: {
            fontSize: 16,
            fontWeight: 'medium',
            lineHeight: 1.5,
            fontFamily: 'Pretendard-Regular',
        },

        // Body Text
        body1: {
            fontSize: 16,
            fontWeight: 'normal',
            lineHeight: 1.6,
            fontFamily: 'Pretendard-Regular',
        },
        body2: {
            fontSize: 14,
            fontWeight: 'normal',
            lineHeight: 1.5,
            fontFamily: 'Pretendard-Regular',
        },
        caption: {
            fontSize: 12,
            fontWeight: 'normal',
            lineHeight: 1.4,
            fontFamily: 'Pretendard-Regular',
        },

        // Button Text
        button: {
            fontSize: 16,
            fontWeight: 'medium',
            lineHeight: 1.5,
            fontFamily: 'Pretendard-Regular',
        },
        buttonSmall: {
            fontSize: 14,
            fontWeight: 'medium',
            lineHeight: 1.4,
            fontFamily: 'Pretendard-Regular',
        },

        // Navigation
        navTitle: {
            fontSize: 18,
            fontWeight: 'semibold',
            lineHeight: 1.3,
            fontFamily: 'Pretendard-Regular',
        },
        navLabel: {
            fontSize: 12,
            fontWeight: 'medium',
            lineHeight: 1.2,
            fontFamily: 'Pretendard-Regular',
        },

        // Logo Text
        logo: {
            fontSize: 24,
            fontWeight: 'bold',
            lineHeight: 1.2,
            fontFamily: 'Catways',
        },
        logoLarge: {
            fontSize: 32,
            fontWeight: 'bold',
            lineHeight: 1.1,
            fontFamily: 'Catways',
        },
    },
};

// 타입 정의
export type Typography = typeof typography;
export type FontSize = keyof typeof typography.fontSize;
export type FontWeight = keyof typeof typography.fontWeight;
export type TextStyle = keyof typeof typography.textStyles;
export type FontFamily = keyof typeof typography.fontFamily;