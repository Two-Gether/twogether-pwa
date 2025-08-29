// TwoGether 앱 전체 테마 설정
import { typography } from './typography';
import { spacing, layout } from './spacing';

// 전체 테마 객체
export const theme = {
    typography: typography,
    spacing: spacing,
    layout: layout,
};

// 타입 정의
export type Theme = typeof theme; 