"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

interface LocationInfo {
  id: string;
  address: string;
  placeName: string;
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

interface GeocoderResult {
  y: string;
  x: string;
}

const MapTestPage = () => {
  console.log('🎯 MapTestPage 컴포넌트 렌더링 시작');
  
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<unknown>(null);
  const [geocoder, setGeocoder] = useState<unknown>(null);
  const [places, setPlaces] = useState<unknown>(null);
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userLocation, setUserLocation] = useState<unknown>(null);

  console.log('🎯 상태 초기화 완료');

  // 사용자 현재 위치 가져오기
  const getUserLocation = useCallback(() => {
    console.log('🔍 getUserLocation 함수 시작');
    console.log('navigator.geolocation 존재 여부:', !!navigator.geolocation);
    
    if (navigator.geolocation) {
      console.log('📍 Geolocation API 지원됨, 위치 정보 요청 중...');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = position.coords.accuracy;
          
          console.log('✅ 위치 정보 수신 성공!');
          console.log('📍 위도:', lat);
          console.log('📍 경도:', lng);
          console.log('📍 정확도:', accuracy, '미터');
          console.log('📍 전체 position 객체:', position);
          
          try {
            const kakaoLatLng = new window.kakao.maps.LatLng(lat, lng);
            setUserLocation(kakaoLatLng);
            setCurrentLocation({ lat, lng });
            console.log('✅ Kakao LatLng 객체 생성 성공:', kakaoLatLng);
          } catch (error) {
            console.error('❌ Kakao LatLng 객체 생성 실패:', error);
            // 기본값 사용
            const defaultLatLng = new window.kakao.maps.LatLng(37.554678, 126.970606);
            setUserLocation(defaultLatLng);
            setCurrentLocation({ lat: 37.554678, lng: 126.970606 });
          }
        },
        (error) => {
          console.error('❌ 위치 정보 가져오기 실패!');
          console.error('❌ 에러 코드:', error.code);
          console.error('❌ 에러 메시지:', error.message);
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              console.error('❌ 사용자가 위치 정보 제공을 거부했습니다.');
              break;
            case error.POSITION_UNAVAILABLE:
              console.error('❌ 위치 정보를 사용할 수 없습니다.');
              break;
            case error.TIMEOUT:
              console.error('❌ 위치 정보 요청 시간이 초과되었습니다.');
              break;
            default:
              console.error('❌ 알 수 없는 오류가 발생했습니다.');
              break;
          }
          
          // 받아올 수 없는 경우 서울역 좌표 사용
          console.log('🔄 기본값(서울역) 사용');
          
          const createDefaultLatLng = () => {
            if (window.kakao && window.kakao.maps && window.kakao.maps.LatLng) {
              try {
                const defaultLatLng = new window.kakao.maps.LatLng(37.554678, 126.970606);
                setUserLocation(defaultLatLng);
                setCurrentLocation({ lat: 37.554678, lng: 126.970606 });
                console.log('✅ 기본값 설정 완료');
              } catch (error) {
                console.error('❌ 기본값 설정 실패:', error);
              }
            } else {
              console.log('⏳ window.kakao.maps 로딩 대기 중... (기본값)');
              setTimeout(createDefaultLatLng, 100); // 100ms 후 다시 시도
            }
          };
          
          createDefaultLatLng();
        },
        {
          enableHighAccuracy: true, // 높은 정확도
          timeout: 10000, // 10초 타임아웃
          maximumAge: 60000 // 1분 캐시
        }
      );
    } else {
      console.log('❌ Geolocation API를 지원하지 않습니다.');
      console.log('🔄 기본값(서울역) 사용');
      
      // 받아올 수 없는 경우 서울역 좌표 사용
      try {
        const defaultLatLng = new window.kakao.maps.LatLng(37.554678, 126.970606);
        setUserLocation(defaultLatLng);
        setCurrentLocation({ lat: 37.554678, lng: 126.970606 });
        console.log('✅ 기본값 설정 완료');
      } catch (error) {
        console.error('❌ 기본값 설정 실패:', error);
      }
    }
  }, []);

  // 초기화 함수
  const init = useCallback(() => {
    console.log('🔧 init 함수 시작');
    console.log('mapRef.current:', mapRef.current);
    console.log('window.kakao:', window.kakao);
    console.log('currentLocation:', currentLocation);
    
    if (!mapRef.current || !window.kakao) {
      console.error('❌ 초기화 실패: mapRef 또는 window.kakao가 없음');
      return;
    }

    try {
      // 초기화 시 사용자 현재 위치 받아오기
      getUserLocation();

      // 지도 객체, 좌표-주소 변환 객체 초기화
      const mapContainer = mapRef.current;
      console.log('🗺️ 지도 컨테이너:', mapContainer);
      
      // 현재 위치 또는 기본 위치 사용
      const centerLocation = currentLocation || { lat: 37.554678, lng: 126.970606 };
      
      const mapOption = {
        center: new window.kakao.maps.LatLng(centerLocation.lat, centerLocation.lng),
        level: 3,
      };
      console.log('🗺️ 지도 옵션:', mapOption);
      
      const kakaoMap = new window.kakao.maps.Map(mapContainer, mapOption);
      console.log('🗺️ 카카오맵 객체 생성 완료:', kakaoMap);
      
      const kakaoGeocoder = new window.kakao.maps.services.Geocoder();
      console.log('🗺️ 지오코더 객체 생성 완료:', kakaoGeocoder);
      
      const kakaoPlaces = new window.kakao.maps.services.Places();
      console.log('🗺️ 플레이스 객체 생성 완료:', kakaoPlaces);
      
      setMap(kakaoMap);
      setGeocoder(kakaoGeocoder);
      setPlaces(kakaoPlaces);
      
      console.log('✅ 지도 초기화 완료');
    } catch (error) {
      console.error('❌ 지도 초기화 중 오류:', error);
    }
  }, [currentLocation, getUserLocation]);

  // 검색 결과 목록 렌더링 함수
  const displayPlaces = (places: PlaceSearchResult[]) => {
    setSearchResults(places);
    setShowResults(true);
  };

  // 검색 결과 항목 클릭 처리
  const handlePlaceClick = (place: PlaceSearchResult) => {
    const { id, road_address_name, place_name } = place;
    const address = road_address_name || place.address_name;
    
    const newLocationInfo: LocationInfo = {
      id,
      address,
      placeName: place_name
    };
    
    setLocationInfo(newLocationInfo);
    
    // 주소로 좌표 검색
    if (geocoder && address) {
      (geocoder as { addressSearch: (address: string, callback: (result: GeocoderResult[], status: string) => void) => void })
        .addressSearch(address, addressSearchCB);
    }
  };

  // 특정 주소의 좌표 검색 후 해당 위치로 지도 중심을 이동시키는 함수
  const addressSearchCB = (result: GeocoderResult[], status: string) => {
    if (status === window.kakao.maps.services.Status.OK && map) {
      const coords = new window.kakao.maps.LatLng(parseFloat(result[0].y), parseFloat(result[0].x));

      // 결과값으로 받은 위치 마커로 표시
      const marker = new window.kakao.maps.Marker({
        position: coords,
      });
      (marker as { setMap: (map: unknown) => void }).setMap(map);

      // 인포 윈도우에 장소명 표시
      const infowindow = new window.kakao.maps.InfoWindow({
        content: `<div class='info_window__content'>${locationInfo?.placeName}</div>`,
      });
      infowindow.open(map, marker);

      // 지도의 중심을 결과값으로 받은 위치로 이동
      (map as { setCenter: (coords: unknown) => void }).setCenter(coords);
    }
  };

  // 키워드 검색
  const searchPlaces = () => {
    const keyword = searchKeyword.trim();
    if (!keyword) {
      alert('장소명을 입력해 주세요!');
      return;
    }

    if (!places) {
      console.error('❌ 장소 검색 객체가 초기화되지 않았습니다.');
      return;
    }

    console.log('🔍 키워드 검색 시작:', keyword);
    console.log('📍 사용자 위치:', userLocation);

    // 장소 검색 객체를 통한 키워드로 장소 검색 요청
    (places as { keywordSearch: (keyword: string, callback: (result: PlaceSearchResult[], status: string) => void, options?: { location?: unknown }) => void })
      .keywordSearch(keyword, (result: PlaceSearchResult[], status: string) => {
        if (status === window.kakao.maps.services.Status.OK) {
          console.log('✅ 검색 결과:', result.length, '개');
          displayPlaces(result);
        } else {
          console.error('❌ 검색 실패:', status);
        }
      }, {
        location: userLocation, // location 옵션 추가
      });
  };

  // 검색어 입력 처리
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(e.target.value);
  };

  // 검색 실행
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 입력 필드에서 포커스 제거
    const inputElement = e.currentTarget.querySelector('input');
    if (inputElement) {
      inputElement.blur();
    }
    searchPlaces();
  };

  // 검색 결과 닫기
  const closeSearchResults = () => {
    setShowResults(false);
    setSearchResults([]);
  };

  // 컴포넌트 마운트 시 현재 위치 가져오기
  useEffect(() => {
    console.log('🚀 페이지 로드됨 - 현재 위치 요청');
    getUserLocation();
  }, [getUserLocation]);

  // 현재 위치와 SDK가 준비되면 지도 초기화
  useEffect(() => {
    if (currentLocation && window.kakao && window.kakao.maps && window.kakao.maps.Map && window.kakao.maps.services) {
      console.log('🗺️ 현재 위치 기준으로 지도 초기화 시작');
      init();
    } else if (currentLocation) {
      console.log('⏳ 카카오맵 SDK 로딩 대기 중...');
    }
  }, [currentLocation, init]);

  // window.kakao가 로드된 후 userLocation 설정
  useEffect(() => {
    if (currentLocation && window.kakao && window.kakao.maps && !userLocation) {
      console.log('🔄 window.kakao 로드됨, userLocation 설정');
      try {
        const kakaoLatLng = new window.kakao.maps.LatLng(currentLocation.lat, currentLocation.lng);
        setUserLocation(kakaoLatLng);
        console.log('✅ userLocation 설정 완료:', kakaoLatLng);
      } catch (error) {
        console.error('❌ userLocation 설정 실패:', error);
      }
    }
  }, [currentLocation, userLocation]);

  return (
    <div className="h-screen relative">
      {/* 검색창 */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-20 px-5">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <input
              type="text"
              placeholder="장소를 검색하세요"
              value={searchKeyword}
              onChange={handleSearchInput}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              검색
            </button>
          </div>
        </form>
      </div>
      
      {/* 지도 */}
      <div className="w-full h-full">
        <div 
          ref={mapRef} 
          className="w-full h-full"
          style={{ 
            width: '100%', 
            height: '100%',
            minHeight: '400px',
            backgroundColor: '#f0f0f0'
          }}
        />
      </div>

      {/* 검색 결과 리스트 */}
      {showResults && (
        <div className="absolute top-32 left-0 right-0 z-30 bg-white rounded-lg shadow-lg mx-5 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">
              &quot;{searchKeyword}&quot; 검색 결과 ({searchResults.length}개)
            </h3>
            <button
              onClick={closeSearchResults}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="divide-y divide-gray-200">
            {searchResults.map((place) => (
              <div
                key={place.id}
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => handlePlaceClick(place)}
              >
                <div className="font-medium text-gray-900">{place.place_name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {place.road_address_name || place.address_name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {place.category_name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 장소 정보 */}
      {locationInfo && (
        <div id="location_info" className="absolute bottom-20 left-0 right-0 z-30 bg-white border-t border-zinc-200">
          <div className="flex justify-between items-center p-4">
            <div className="flex items-center gap-4">
              <div className="text-2xl text-[#238CFA]">📍</div>
              <div>
                <p className="font-semibold tracking-tight">{locationInfo.placeName}</p>
                <p className="text-xs text-zinc-400">{locationInfo.address}</p>
              </div>
            </div>
            <button 
              id="edit" 
              aria-label="수정" 
              className="px-4 text-zinc-500 hover:text-zinc-700"
            >
              수정
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .info_window__content {
          width: 140px;
          text-align: center;
          font-size: 12px;
          padding: 6px 0;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
};

export default MapTestPage;
