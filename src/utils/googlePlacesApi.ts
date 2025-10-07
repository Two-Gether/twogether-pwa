// 구글 플레이스 API 응답 타입
export interface GooglePlacePhoto {
  photo_reference: string;
  height: number;
  width: number;
}

export interface GooglePlaceDetails {
  place_id: string;
  name: string;
  photos?: GooglePlacePhoto[];
  formatted_address?: string;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export interface GooglePlaceSearchResult {
  place_id: string;
  name: string;
  photos?: GooglePlacePhoto[];
  formatted_address?: string;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

// 구글 플레이스 사진 URL 생성
export function getGooglePlacePhotoUrl(photoReference: string, maxWidth: number = 400): string {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return '';
  }
  
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${apiKey}`;
}

// 콜백 URL에서 photo_reference 추출하여 실제 이미지 URL로 변환
export function convertCallbackUrlToImageUrl(callbackUrl: string, maxWidth: number = 400): string {
  try {
    // 콜백 URL에서 photo_reference 추출 (1s 뒤에 오는 값)
    const photoRefMatch = callbackUrl.match(/1s([A-Za-z0-9_-]+)/);
    if (!photoRefMatch) {
      console.error('콜백 URL에서 photo_reference를 추출할 수 없음:', callbackUrl);
      return '';
    }
    
    const photoReference = photoRefMatch[1];
    return getGooglePlacePhotoUrl(photoReference, maxWidth);
  } catch (error) {
    console.error('콜백 URL 변환 실패:', error);
    return '';
  }
}

// Google Maps JavaScript SDK 초기화
let placesService: google.maps.places.PlacesService | null = null;

const initializePlacesService = (): google.maps.places.PlacesService | null => {
  if (typeof window === 'undefined') return null;
  
  if (!placesService) {
    // 더미 div를 생성하여 PlacesService 초기화
    const dummyDiv = document.createElement('div');
    placesService = new google.maps.places.PlacesService(dummyDiv);
  }
  
  return placesService;
};

// 장소명으로 구글 플레이스 검색 (REST API 사용)
export async function searchGooglePlace(placeName: string): Promise<GooglePlaceSearchResult | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.error('Google Places API 키가 없습니다.');
      return null;
    }

    // REST API를 사용하여 검색 (photo_reference를 직접 받기 위해)
    // CORS 회피: next.config.ts rewrites(/api/google-maps → maps.googleapis.com) 경유
    const url = `/api/google-maps/place/textsearch/json?query=${encodeURIComponent(placeName)}&key=${apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Google Places API 요청 실패:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        place_id: result.place_id || '',
        name: result.name || '',
        photos: result.photos?.map((photo: { photo_reference: string; height: number; width: number }) => ({
          photo_reference: photo.photo_reference,
          height: photo.height,
          width: photo.width
        })),
        formatted_address: result.formatted_address,
        geometry: result.geometry
      };
    }

    return null;
  } catch (error) {
    console.error('Google Places 검색 에러:', error);
    return null;
  }
}

// 장소 ID로 구글 플레이스 상세 정보 가져오기
export async function getGooglePlaceDetails(placeId: string): Promise<GooglePlaceDetails | null> {
  try {
    const service = initializePlacesService();
    if (!service) {
      return null;
    }

    return new Promise((resolve) => {
      const request: google.maps.places.PlaceDetailsRequest = {
        placeId: placeId
      };

      service.getDetails(request, (result: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && result) {
          resolve({
            place_id: result.place_id || '',
            name: result.name || '',
            photos: result.photos?.map((photo: google.maps.places.PlacePhoto) => ({
              photo_reference: photo.getUrl({ maxWidth: 400 }) || '',
              height: 400,
              width: 400
            })),
            formatted_address: result.formatted_address,
            geometry: result.geometry?.location ? {
              location: {
                lat: result.geometry.location.lat(),
                lng: result.geometry.location.lng()
              }
            } : undefined
          });
        } else {
          resolve(null);
        }
      });
    });
  } catch {
    return null;
  }
}

// localStorage 캐싱 관련 상수 및 함수
const CACHE_KEY = 'google_places_image_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24시간

interface CacheData {
  [placeName: string]: {
    url: string;
    timestamp: number;
  };
}

// 캐시에서 이미지 URL 가져오기
function getCachedImageUrl(placeName: string): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cache = localStorage.getItem(CACHE_KEY);
    if (!cache) return null;
    
    const cacheData: CacheData = JSON.parse(cache);
    const cached = cacheData[placeName];
    // fallback 이미지는 캐시로 인정하지 않음 → 재조회 유도
    const isFallback = cached?.url === '/images/illust/cats/backgroundCat.png';
    if (cached && !isFallback && Date.now() - cached.timestamp < CACHE_EXPIRY) {
      return cached.url;
    }
    
    return null;
  } catch {
    return null;
  }
}

// 캐시에 이미지 URL 저장하기
function setCachedImageUrl(placeName: string, url: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const cache = localStorage.getItem(CACHE_KEY);
    const cacheData: CacheData = cache ? JSON.parse(cache) : {};
    
    // fallback 이미지는 캐시에 저장하지 않음
    if (url === '/images/illust/cats/backgroundCat.png') {
      delete cacheData[placeName];
    } else {
      cacheData[placeName] = {
        url,
        timestamp: Date.now()
      };
    }
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch {
  }
}

// 장소명으로 대표사진 URL 가져오기
export async function getPlaceImageUrl(placeName: string): Promise<string> {
  try {
    // 1. 먼저 캐시 확인
    const cachedUrl = getCachedImageUrl(placeName);
    if (cachedUrl) {
      console.log(`장소 "${placeName}" - 캐시된 이미지 URL 사용`);
      return cachedUrl;
    }
    
    // 2. 캐시에 없으면 API 호출
    const placeResult = await searchGooglePlace(placeName);
    
    if (!placeResult || !placeResult.photos || placeResult.photos.length === 0) {
      console.log(`장소 "${placeName}" - 사진 없음, 기본 이미지 사용`);
      return '/images/illust/cats/backgroundCat.png';
    }

    // REST API에서는 photo_reference를 직접 받음
    const photoReference = placeResult.photos[0].photo_reference;
    
    // Photo API URL 생성
    const imageUrl = getGooglePlacePhotoUrl(photoReference, 400);
    
    if (imageUrl) {
      console.log(`장소 "${placeName}" - Photo API URL 생성:`, imageUrl);
      setCachedImageUrl(placeName, imageUrl);
      return imageUrl;
    } else {
      console.log(`장소 "${placeName}" - Photo API URL 생성 실패, 기본 이미지 사용`);
      return '/images/illust/cats/backgroundCat.png';
    }
  } catch (error) {
    console.error(`장소 "${placeName}" 이미지 가져오기 에러:`, error);
    return '/images/illust/cats/backgroundCat.png';
  }
}
