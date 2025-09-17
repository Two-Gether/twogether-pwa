import EXIF from 'exif-js';
// @ts-expect-error: heic-convert 타입 선언 파일이 없음
import convert from 'heic-convert';

export interface EXIFData {
  make?: string;
  model?: string;
  dateTime?: string;
  gpsLatitude?: number[];
  gpsLongitude?: number[];
  orientation?: number;
  flash?: number;
  fNumber?: number;
  exposureTime?: number;
  iso?: number;
  focalLength?: number;
  whiteBalance?: number;
  meteringMode?: number;
  exposureMode?: number;
  sceneCaptureType?: number;
  address?: string; // GPS → 주소 변환 결과
}

export interface ProcessedImageResult {
  file: File;
  preview: string | null;
  exifData: EXIFData;
  address?: string;
}

export const extractEXIFData = (file: File): Promise<EXIFData> => {
  return new Promise((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    EXIF.getData(file as any, function(this: any) {
      const exifData: EXIFData = {
        dateTime: EXIF.getTag(this, 'DateTime'),
        gpsLatitude: EXIF.getTag(this, 'GPSLatitude'),
        gpsLongitude: EXIF.getTag(this, 'GPSLongitude'),
        orientation: EXIF.getTag(this, 'Orientation'),
        flash: EXIF.getTag(this, 'Flash'),
        fNumber: EXIF.getTag(this, 'FNumber'),
        exposureTime: EXIF.getTag(this, 'ExposureTime'),
        iso: EXIF.getTag(this, 'ISOSpeedRatings'),
        focalLength: EXIF.getTag(this, 'FocalLength'),
        whiteBalance: EXIF.getTag(this, 'WhiteBalance'),
        meteringMode: EXIF.getTag(this, 'MeteringMode'),
        exposureMode: EXIF.getTag(this, 'ExposureMode'),
        sceneCaptureType: EXIF.getTag(this, 'SceneCaptureType')
      };
      resolve(exifData);
    });
  });
};



// HEIC 파일을 JPEG로 변환하는 함수 (메타데이터 없이)
export const convertHEICToJPEG = async (file: File): Promise<File> => {
  try {
    console.log('HEIC 파일을 JPEG로 변환 중... (메타데이터 없이)');
    
    // File을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);
    
    // heic-convert로 HEIC → JPEG 변환
    const outputBuffer = await convert({
      buffer: inputBuffer,
      format: 'JPEG',
      quality: 0.8
    });
    
    // Buffer를 Blob으로 변환
    const blob = new Blob([outputBuffer], { type: 'image/jpeg' });
    
    const convertedFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
      type: 'image/jpeg',
      lastModified: Date.now()
    });

    return convertedFile;
  } catch {
    throw new Error('HEIC 파일 변환에 실패했습니다.');
  }
};

// GPS 좌표를 주소로 변환하는 함수
export const getAddressFromGPS = async (latitude: number, longitude: number): Promise<string | null> => {
  try {
    console.log(`GPS → 주소 변환 시도: ${latitude}, ${longitude}`);
    
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${longitude}&y=${latitude}`,
      {
        headers: {
          'Authorization': `KakaoAK ${process.env.NEXT_PUBLIC_KAKAO_API_KEY || 'YOUR_KAKAO_API_KEY'}`
        }
      }
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    if (data.documents && data.documents.length > 0) {
      const address = data.documents[0].address;
      const addressName = `${address.region_1depth_name} ${address.region_2depth_name} ${address.region_3depth_name}`;
      return addressName;
    }
    
    return null;
  } catch {
    return null;
  }
};

// 이미지 압축 함수
const compressImage = async (file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // 원본 비율 유지하면서 최대 크기로 조정
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 이미지 그리기
      ctx?.drawImage(img, 0, 0, width, height);
      
      // JPEG로 압축하여 Blob 생성
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // File 객체로 변환
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('이미지 압축 실패'));
          }
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = URL.createObjectURL(file);
  });
};

// 통합 이미지 처리 함수
export const handleImageUpload = async (file: File): Promise<ProcessedImageResult> => {
  console.log('이미지 업로드 처리 시작:', file.name, file.type);
  
  // 지원되는 이미지 파일 타입 확인
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 업로드 가능합니다.');
  }
  
  let processedFile = file;
  let exifData: EXIFData = {};
  
  // HEIC/HEIF은 모바일 웹뷰에서 변환/압축이 불안정하므로 원본 그대로 사용
  if (!(file.type === 'image/heic' || file.type === 'image/heif')) {
    exifData = await extractEXIFData(file);
  }
  
  // HEIC/HEIF 이외의 포맷만 압축 적용 (웹뷰 호환성 고려)
  if (!(file.type === 'image/heic' || file.type === 'image/heif')) {
    try {
      processedFile = await compressImage(processedFile);
    } catch {
    }
  }
  
  // 미리보기 생성
  let preview: string | null = null;
  try {
    preview = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(processedFile);
    });
  } catch {
    try {
      preview = URL.createObjectURL(processedFile);
    } catch {
      preview = null;
    }
  }
  
  // GPS 좌표가 있으면 주소 변환 (HEIC 파일이 아닌 경우만)
  let address: string | null = null;
  if (exifData.gpsLatitude && exifData.gpsLongitude && 
      exifData.gpsLatitude.length > 0 && exifData.gpsLongitude.length > 0) {
    
    const lat = exifData.gpsLatitude[0];
    const lng = exifData.gpsLongitude[0];
    
    address = await getAddressFromGPS(lat, lng);
    
    if (address) {
      exifData.address = address;
    }
  }
  
  return {
    file: processedFile,
    preview,
    exifData,
    address: address || undefined
  };
};

