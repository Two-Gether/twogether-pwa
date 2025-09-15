import { compressImage, DEFAULT_COMPRESSION_OPTIONS, CompressionResult } from './imageCompression';

export interface UploadResult {
  success: boolean;
  imageUrl?: string;
  fileName?: string;
  size?: number;
  type?: string;
  error?: string;
  compressionInfo?: {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
  };
}

/**
 * 이미지를 압축하고 서버에 업로드하는 함수
 * @param file 원본 이미지 파일
 * @param compressionOptions 압축 옵션 (선택사항)
 * @returns 업로드 결과
 */
export const uploadImage = async (
  file: File,
  compressionOptions = DEFAULT_COMPRESSION_OPTIONS
): Promise<UploadResult> => {
  try {
    // 1. 이미지 압축
    const compressionResult: CompressionResult = await compressImage(file, compressionOptions);
    
    // 2. 압축된 파일을 FormData에 담기
    const formData = new FormData();
    formData.append('image', compressionResult.compressedFile);

    // 3. S3에 업로드
    const { uploadImageToS3 } = await import('@/api/upload');
    const uploadData = await uploadImageToS3(compressionResult.compressedFile);
    
    if (!uploadData.success) {
      throw new Error(uploadData.error || '업로드 실패');
    }
    return {
      success: true,
      imageUrl: uploadData.imageUrl,
      fileName: uploadData.fileName,
      size: uploadData.size,
      type: uploadData.type,
      compressionInfo: {
        originalSize: compressionResult.originalSize,
        compressedSize: compressionResult.compressedSize,
        compressionRatio: compressionResult.compressionRatio,
      },
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
};

/**
 * 여러 이미지를 순차적으로 업로드하는 함수
 * @param files 이미지 파일 배열
 * @param compressionOptions 압축 옵션 (선택사항)
 * @returns 업로드 결과 배열
 */
export const uploadMultipleImages = async (
  files: File[],
  compressionOptions = DEFAULT_COMPRESSION_OPTIONS
): Promise<UploadResult[]> => {
  const results: UploadResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const result = await uploadImage(files[i], compressionOptions);
    results.push(result);
    
    // 실패한 경우 중단
    if (!result.success) {
      break;
    }
  }
  return results;
};

/**
 * 이미지 업로드 진행률을 추적하는 함수
 * @param file 원본 이미지 파일
 * @param onProgress 진행률 콜백 (0-100)
 * @param compressionOptions 압축 옵션 (선택사항)
 * @returns 업로드 결과
 */
export const uploadImageWithProgress = async (
  file: File,
  onProgress: (progress: number) => void,
  compressionOptions = DEFAULT_COMPRESSION_OPTIONS
): Promise<UploadResult> => {
  try {
    onProgress(10); // 압축 시작
    
    // 1. 이미지 압축
    const compressionResult = await compressImage(file, compressionOptions);
    onProgress(50); // 압축 완료
    
    // 2. FormData 생성
    const formData = new FormData();
    formData.append('image', compressionResult.compressedFile);
    onProgress(60); // 업로드 준비 완료
    
    // 3. S3에 업로드
    const { uploadImageToS3 } = await import('@/api/upload');
    const uploadData = await uploadImageToS3(compressionResult.compressedFile);
    
    onProgress(90); // 업로드 완료
    
    if (!uploadData.success) {
      throw new Error(uploadData.error || '업로드 실패');
    }
    onProgress(100); // 완료
    
    return {
      success: true,
      imageUrl: uploadData.imageUrl,
      fileName: uploadData.fileName,
      size: uploadData.size,
      type: uploadData.type,
      compressionInfo: {
        originalSize: compressionResult.originalSize,
        compressedSize: compressionResult.compressedSize,
        compressionRatio: compressionResult.compressionRatio,
      },
    };
    
  } catch (error) {
    onProgress(0); // 실패 시 진행률 초기화
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
};
