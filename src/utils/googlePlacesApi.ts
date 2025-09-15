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

// 장소명으로 구글 플레이스 검색
export async function searchGooglePlace(placeName: string): Promise<GooglePlaceSearchResult | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return null;
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(placeName)}&key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return null;
    }

    return data.results[0] as GooglePlaceSearchResult;
  } catch {
    return null;
  }
}

// 장소 ID로 구글 플레이스 상세 정보 가져오기
export async function getGooglePlaceDetails(placeId: string): Promise<GooglePlaceDetails | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return null;
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=place_id,name,photos,formatted_address,geometry&key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data.status !== 'OK' || !data.result) {
      return null;
    }

    return data.result as GooglePlaceDetails;
  } catch {
    return null;
  }
}

// 장소명으로 대표사진 URL 가져오기
export async function getPlaceImageUrl(placeName: string): Promise<string> {
  try {
    const placeResult = await searchGooglePlace(placeName);
    
    if (!placeResult || !placeResult.photos || placeResult.photos.length === 0) {
      return '/images/illust/cats/backgroundCat.png';
    }

    // 첫 번째 사진을 대표사진으로 사용
    const photoReference = placeResult.photos[0].photo_reference;
    const imageUrl = getGooglePlacePhotoUrl(photoReference, 400);

    return imageUrl;
  } catch {
    return '/images/illust/cats/backgroundCat.png';
  }
}
