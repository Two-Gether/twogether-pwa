/**
 * 이미지 URL을 230x314 크기로 리사이즈하는 유틸리티
 * 한국관광공사 API 이미지에 최적화
 */

/**
 * 관광공사 이미지 URL을 230x314 크기로 리사이즈
 * @param originalUrl 원본 이미지 URL
 * @returns 리사이즈된 이미지 URL
 */
export const resizeTourismImage = (originalUrl: string): string => {
  if (!originalUrl || originalUrl.includes('placehold.co')) {
    return originalUrl; // placeholder는 그대로 반환
  }
  
  // 관광공사 이미지 URL 패턴 확인
  if (originalUrl.includes('tong.visitkorea.or.kr')) {
    return originalUrl;
  }
  
  // 다른 이미지 서비스의 경우 썸네일 서비스 사용
  if (originalUrl.includes('placehold.co')) {
    return 'https://placehold.co/230x314';
  }
  
  // 기본적으로 원본 URL 반환
  return originalUrl;
};

/**
 * 이미지 URL이 유효한지 확인
 * @param url 이미지 URL
 * @returns 유효한 URL인지 여부
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * 이미지 로드 실패 시 placeholder로 대체
 * @param url 원본 이미지 URL
 * @returns 안전한 이미지 URL
 */
export const getSafeImageUrl = (url: string): string => {
  if (!url || !isValidImageUrl(url)) {
    return 'https://placehold.co/230x314';
  }
  
  return resizeTourismImage(url);
};
