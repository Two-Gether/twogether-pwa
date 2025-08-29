// TwoGether 앱 간격(spacing) 설정
export const spacing = {
    // Base spacing units (4px 단위)
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    12: 48,
    14: 56,
    16: 64,
    20: 80,
    24: 96,
    28: 112,
    32: 128,
    36: 144,
    40: 160,
    44: 176,
    48: 192,
    52: 208,
    56: 224,
    60: 240,
    64: 256,
    72: 288,
    80: 320,
    96: 384,
};

// 특정 용도의 간격
export const layout = {
    // Screen padding
    screenPadding: {
        horizontal: 16,
        vertical: 20,
    },

    // Component spacing
    componentSpacing: {
        small: 8,
        medium: 16,
        large: 24,
        xlarge: 32,
    },

    // Border radius
    borderRadius: {
        none: 0,
        sm: 4,
        base: 8,
        md: 12,
        lg: 16,
        xl: 20,
        '2xl': 24,
        '3xl': 32,
        full: 9999,
    },

    // Border width
    borderWidth: {
        0: 0,
        1: 1,
        2: 2,
        4: 4,
        8: 8,
    },
};

// 타입 정의
export type Spacing = typeof spacing;
export type SpacingKey = keyof Spacing;
export type Layout = typeof layout; 