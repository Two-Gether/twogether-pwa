/**
 * 이미지 압축 유틸리티
 * 원본 이미지를 압축하여 서버 용량을 절약합니다.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
}

export interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * 이미지 압축 함수
 * @param file 원본 이미지 파일
 * @param options 압축 옵션
 * @returns 압축된 파일과 압축 정보
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> => {
  const {
    maxWidth = 800,
    maxHeight = 600,
    quality = 0.7,
    format = 'jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Canvas context를 생성할 수 없습니다.'));
      return;
    }

    img.onload = () => {
      try {
        // 원본 크기
        const originalWidth = img.width;
        const originalHeight = img.height;
        
        // 비율을 유지하면서 리사이즈 계산
        const { width, height } = calculateDimensions(
          originalWidth,
          originalHeight,
          maxWidth,
          maxHeight
        );

        // 캔버스 크기 설정
        canvas.width = width;
        canvas.height = height;

        // 이미지 그리기 (고품질 리샘플링)
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // 압축된 이미지로 변환
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('이미지 압축에 실패했습니다.'));
              return;
            }

            // 압축된 파일 생성
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, `.${format}`),
              {
                type: `image/${format}`,
                lastModified: Date.now()
              }
            );

            const originalSize = file.size;
            const compressedSize = compressedFile.size;
            const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);

            resolve({
              compressedFile,
              originalSize,
              compressedSize,
              compressionRatio
            });
          },
          `image/${format}`,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('이미지를 로드할 수 없습니다.'));
    };

    // 이미지 로드 시작
    img.src = URL.createObjectURL(file);
  });
};

/**
 * 비율을 유지하면서 리사이즈할 크기 계산
 */
const calculateDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  let width = originalWidth;
  let height = originalHeight;

  // 가로가 세로보다 긴 경우
  if (width > height) {
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }
  } else {
    // 세로가 가로보다 긴 경우
    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }
  }

  return { width: Math.round(width), height: Math.round(height) };
};

/**
 * 바이트를 읽기 쉬운 형태로 변환
 */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 기본 압축 옵션 (모바일 최적화)
 */
export const DEFAULT_COMPRESSION_OPTIONS: CompressionOptions = {
  maxWidth: 800,
  maxHeight: 600,
  quality: 0.7,
  format: 'jpeg'
};

/**
 * 썸네일용 압축 옵션 (더 작은 크기)
 */
export const THUMBNAIL_COMPRESSION_OPTIONS: CompressionOptions = {
  maxWidth: 400,
  maxHeight: 300,
  quality: 0.6,
  format: 'jpeg'
};
