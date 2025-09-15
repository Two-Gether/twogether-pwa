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

// 장소명으로 구글 플레이스 검색
export async function searchGooglePlace(placeName: string): Promise<GooglePlaceSearchResult | null> {
  try {
    const service = initializePlacesService();
    if (!service) {
      return null;
    }

    return new Promise((resolve) => {
      const request: google.maps.places.TextSearchRequest = {
        query: placeName
      };

      service.textSearch(request, (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
          const result = results[0];
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

// 장소명으로 대표사진 URL 가져오기
export async function getPlaceImageUrl(placeName: string): Promise<string> {
  try {
    const placeResult = await searchGooglePlace(placeName);
    
    if (!placeResult || !placeResult.photos || placeResult.photos.length === 0) {
      return '/images/illust/cats/backgroundCat.png';
    }

    // JavaScript SDK에서는 이미 URL이 반환됨
    return placeResult.photos[0].photo_reference;
  } catch {
    return '/images/illust/cats/backgroundCat.png';
  }
}
