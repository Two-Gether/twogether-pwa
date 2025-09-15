export interface UploadResult {
  success: boolean;
  imageUrl?: string;
  fileName?: string;
  size?: number;
  type?: string;
  error?: string;
}

/**
 * 이미지를 S3에 업로드하는 함수
 * @param file 이미지 파일
 * @returns 업로드 결과
 */
export const uploadImageToS3 = async (file: File): Promise<UploadResult> => {
  try {
    // 파일 유효성 검사
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: '지원하지 않는 파일 형식입니다.'
      };
    }

    // 파일 크기 제한 (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: '파일 크기가 너무 큽니다. (최대 5MB)'
      };
    }

    // 고유한 파일명 생성
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `img_${timestamp}_${randomString}.${fileExtension}`;

    // TODO: 실제 S3 업로드 구현
    // 현재는 임시 URL만 반환
    const imageUrl = `https://your-s3-bucket.s3.amazonaws.com/images/${fileName}`;

    return {
      success: true,
      imageUrl,
      fileName,
      size: file.size,
      type: file.type
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '이미지 업로드 중 오류가 발생했습니다.'
    };
  }
};
