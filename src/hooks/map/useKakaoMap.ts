import { useEffect, useState, useRef, useCallback } from 'react';

interface LocationCoordinates {
  lat: number;
  lng: number;
}

interface PlaceSearchResult {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  distance: string;
  category_name: string;
}

interface SearchState {
  results: PlaceSearchResult[];
  isLoading: boolean;
  hasMore: boolean;
  pagination?: {
    current: number;
    last: number;
  };
}

/**
 * 카카오맵 초기화와 관리를 위한 Hook
 */
export const useKakaoMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<unknown>(null);
  const [currentPosition, setCurrentPosition] = useState<LocationCoordinates | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clickPosition, setClickPosition] = useState<LocationCoordinates | null>(null);

  /**
   * 현재 위치 가져오기
   */
  const getCurrentLocation = useCallback(() => {
    console.log('📍 현재 위치 가져오기 시작');
    
    if (navigator.geolocation) {
      console.log('✅ Geolocation API 사용 가능');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('📍 현재 위치 획득:', { latitude, longitude });
          setCurrentPosition({ lat: latitude, lng: longitude });
          setIsLoading(false);
        },
        (error) => {
          console.error('❌ 위치 정보를 가져올 수 없습니다:', error);
          // 기본 위치 (서울 시청)
          console.log('📍 기본 위치 사용 (서울 시청)');
          setCurrentPosition({ lat: 37.5665, lng: 126.9780 });
          setIsLoading(false);
        }
      );
    } else {
      console.log('❌ Geolocation API 사용 불가, 기본 위치 사용');
      // 기본 위치 (서울 시청)
      setCurrentPosition({ lat: 37.5665, lng: 126.9780 });
      setIsLoading(false);
    }
  }, []);

  /**
   * 카카오맵 초기화
   */
  const initKakaoMap = useCallback((lat: number, lng: number) => {
    if (!mapRef.current) {
      return;
    }
    
    // 카카오맵 SDK가 완전히 로드될 때까지 대기
    const waitForKakaoMap = () => {
      if (window.kakao && window.kakao.maps && window.kakao.maps.Map) {
        try {
          // 공식 문서 방식으로 지도 생성
          const container = mapRef.current!; // 지도를 담을 영역의 DOM 레퍼런스
          const options = { // 지도를 생성할 때 필요한 기본 옵션
            center: new window.kakao.maps.LatLng(lat, lng), // 지도의 중심좌표
            level: 3 // 지도의 레벨(확대, 축소 정도)
          };

          const kakaoMap = new window.kakao.maps.Map(container, options); // 지도 생성 및 객체 리턴
      setMap(kakaoMap);
      
      // 현재 위치 마커 추가
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(lat, lng)
      }) as { setMap: (map: unknown) => void };
      
      marker.setMap(kakaoMap);
      
      // 지도 클릭 이벤트 등록
      window.kakao.maps.event.addListener(kakaoMap, 'click', (mouseEvent: { latLng: { getLat: () => number; getLng: () => number } }) => {
        const lat = mouseEvent.latLng.getLat();
        const lng = mouseEvent.latLng.getLng();
        setClickPosition({ lat, lng });
      });
        } catch {
          setError('카카오맵 초기화에 실패했습니다.');
        }
      } else {
        // SDK가 아직 로드되지 않았으면 100ms 후 다시 시도
        setTimeout(waitForKakaoMap, 100);
      }
    };

    // 초기화 시작
    waitForKakaoMap();
  }, []);

  /**
   * 지도 중심 이동
   */
  const moveToLocation = (lat: number, lng: number, level?: number) => {
    if (!map || !window.kakao) return;
    
    const position = new window.kakao.maps.LatLng(lat, lng);
    (map as { setCenter: (position: unknown) => void }).setCenter(position);
    
    if (level) {
      (map as { setLevel: (level: number) => void }).setLevel(level);
    }
  };

  // 현재 위치 가져오기
  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  // 카카오맵 초기화
  useEffect(() => {
    if (currentPosition && mapRef.current && window.kakao && !map) {
      initKakaoMap(currentPosition.lat, currentPosition.lng);
    }
  }, [currentPosition, map, initKakaoMap]);

  return {
    mapRef,
    map,
    currentPosition,
    isLoading,
    error,
    clickPosition,
    moveToLocation
  };
};

/**
 * 장소 검색을 위한 Hook
 */
export const usePlaceSearch = () => {
  const [searchState, setSearchState] = useState<SearchState>({
    results: [],
    isLoading: false,
    hasMore: false
  });
  const [showResults, setShowResults] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // 사용자 현재 위치 가져오기
  const getUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserLocation({ lat, lng });
      }, () => {
        // 받아올 수 없는 경우 서울역 좌표 사용
        setUserLocation({ lat: 37.554678, lng: 126.970606 });
      });
    } else {
      // 받아올 수 없는 경우 서울역 좌표 사용
      setUserLocation({ lat: 37.554678, lng: 126.970606 });
    }
  }, []);

  // 컴포넌트 마운트 시 현재 위치 가져오기
  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  const searchPlaces = useCallback(async (keyword: string, page: number = 1) => {
    if (!window.kakao || !window.kakao.maps.services) {
      console.error('카카오맵 서비스가 로드되지 않았습니다.');
      return;
    }

    // 키워드 검증
    if (!keyword.replace(/^\s+|\s+$/g, '')) {
      alert('장소명을 입력해 주세요!');
      return;
    }

    setSearchState(prev => ({ ...prev, isLoading: true }));

    try {
      const places = new window.kakao.maps.services.Places();
      
      const searchCallback = (result: unknown[], status: string) => {
        if (status === window.kakao.maps.services.Status.OK) {
          const typedResults = result as PlaceSearchResult[];
          setSearchState({
            results: page === 1 ? typedResults : [...searchState.results, ...typedResults],
            isLoading: false,
            hasMore: typedResults.length === 15, // 카카오맵은 한 번에 최대 15개 결과
            pagination: {
              current: page,
              last: page + 1
            }
          });
          setShowResults(true);
        } else {
          setSearchState(prev => ({ ...prev, isLoading: false }));
          console.error('장소 검색 실패:', status);
        }
      };

      // 검색 옵션 설정
      const searchOptions: {
        page: number;
        size: number;
        location?: unknown;
      } = {
        page: page,
        size: 15
      };

      // 현재 위치가 있으면 location 옵션 추가
      if (userLocation) {
        searchOptions.location = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng);
      }

      places.keywordSearch(keyword, searchCallback, searchOptions);
    } catch (error) {
      console.error('장소 검색 중 오류:', error);
      setSearchState(prev => ({ ...prev, isLoading: false }));
    }
  }, [searchState.results, userLocation]);

  const clearSearchResults = useCallback(() => {
    setSearchState({
      results: [],
      isLoading: false,
      hasMore: false
    });
    setShowResults(false);
  }, []);

  return {
    searchState,
    showResults,
    searchPlaces,
    clearSearchResults,
    setShowResults,
    userLocation
  };
};
