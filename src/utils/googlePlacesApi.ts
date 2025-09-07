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
    console.error('Google Places API 키가 설정되지 않았습니다.');
    return '';
  }
  
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${apiKey}`;
}

// 장소명으로 구글 플레이스 검색
export async function searchGooglePlace(placeName: string): Promise<GooglePlaceSearchResult | null> {
  try {
    const response = await fetch(
      `/api/google-places/search?query=${encodeURIComponent(placeName)}`,
      {
        method: 'GET',
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      console.error('Google Places API 호출 실패:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.log('구글 플레이스에서 해당 장소를 찾을 수 없습니다:', placeName);
      return null;
    }

    return data.results[0] as GooglePlaceSearchResult;
  } catch (error) {
    console.error('Google Places API 호출 에러:', error);
    return null;
  }
}

// 장소 ID로 구글 플레이스 상세 정보 가져오기
export async function getGooglePlaceDetails(placeId: string): Promise<GooglePlaceDetails | null> {
  try {
    const response = await fetch(
      `/api/google-places/details?place_id=${placeId}`,
      {
        method: 'GET',
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      console.error('Google Places API 호출 실패:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.status !== 'OK' || !data.result) {
      console.log('구글 플레이스에서 해당 장소 상세 정보를 찾을 수 없습니다:', placeId);
      return null;
    }

    return data.result as GooglePlaceDetails;
  } catch (error) {
    console.error('Google Places API 호출 에러:', error);
    return null;
  }
}

// 장소명으로 대표사진 URL 가져오기
export async function getPlaceImageUrl(placeName: string): Promise<string> {
  try {
    console.log('구글 플레이스에서 장소 이미지 검색 시작:', placeName);
    
    const placeResult = await searchGooglePlace(placeName);
    
    if (!placeResult || !placeResult.photos || placeResult.photos.length === 0) {
      console.log('해당 장소의 이미지를 찾을 수 없습니다:', placeName);
      return '';
    }

    // 첫 번째 사진을 대표사진으로 사용
    const photoReference = placeResult.photos[0].photo_reference;
    const imageUrl = getGooglePlacePhotoUrl(photoReference, 400);
    
    console.log('장소 이미지 URL 생성 완료:', imageUrl);
    return imageUrl;
  } catch (error) {
    console.error('장소 이미지 가져오기 에러:', error);
    return '';
  }
}
