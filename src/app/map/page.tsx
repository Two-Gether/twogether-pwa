"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';
import Input from '@/components/ui/Input';

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
  phone?: string;
  place_url?: string;
  category_group_code?: string;
  category_group_name?: string;
}

interface GeocoderResult {
  y: string;
  x: string;
}

const MapScreen = () => {
  const router = useRouter();
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
  const [isLocationInfoSheetOpen, setIsLocationInfoSheetOpen] = useState(false);

  // 사용자 현재 위치 가져오기
  const getUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // window.kakao.maps가 로드될 때까지 기다린 후 LatLng 객체 생성
          const createLatLng = () => {
            if (window.kakao && window.kakao.maps && window.kakao.maps.LatLng) {
              try {
                const kakaoLatLng = new window.kakao.maps.LatLng(lat, lng);
                setUserLocation(kakaoLatLng);
                setCurrentLocation({ lat, lng });
              } catch (error) {
                console.error('Kakao LatLng 객체 생성 실패:', error);
                const defaultLatLng = new window.kakao.maps.LatLng(37.554678, 126.970606);
                setUserLocation(defaultLatLng);
                setCurrentLocation({ lat: 37.554678, lng: 126.970606 });
              }
            } else {
              setTimeout(createLatLng, 100);
            }
          };
          
          createLatLng();
        },
        () => {
          // 에러 시 기본값 사용
          const createDefaultLatLng = () => {
            if (window.kakao && window.kakao.maps && window.kakao.maps.LatLng) {
              try {
                const defaultLatLng = new window.kakao.maps.LatLng(37.554678, 126.970606);
                setUserLocation(defaultLatLng);
                setCurrentLocation({ lat: 37.554678, lng: 126.970606 });
              } catch (error) {
                console.error('기본값 설정 실패:', error);
              }
            } else {
              setTimeout(createDefaultLatLng, 100);
            }
          };
          
          createDefaultLatLng();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      // Geolocation API 미지원 시 기본값 사용
      const createDefaultLatLng = () => {
        if (window.kakao && window.kakao.maps && window.kakao.maps.LatLng) {
          try {
            const defaultLatLng = new window.kakao.maps.LatLng(37.554678, 126.970606);
            setUserLocation(defaultLatLng);
            setCurrentLocation({ lat: 37.554678, lng: 126.970606 });
          } catch (error) {
            console.error('기본값 설정 실패:', error);
          }
        } else {
          setTimeout(createDefaultLatLng, 100);
        }
      };
      
      createDefaultLatLng();
    }
  }, []);

  // 초기화 함수
  const init = useCallback(() => {
    if (!mapRef.current || !window.kakao) return;

    try {
      // 지도 객체, 좌표-주소 변환 객체 초기화
      const mapContainer = mapRef.current;
      const centerLocation = currentLocation || { lat: 37.554678, lng: 126.970606 };
      
      const mapOption = {
        center: new window.kakao.maps.LatLng(centerLocation.lat, centerLocation.lng),
        level: 3,
      };
      
      const kakaoMap = new window.kakao.maps.Map(mapContainer, mapOption);
      const kakaoGeocoder = new window.kakao.maps.services.Geocoder();
      const kakaoPlaces = new window.kakao.maps.services.Places();
      
      setMap(kakaoMap);
      setGeocoder(kakaoGeocoder);
      setPlaces(kakaoPlaces);
    } catch (error) {
      console.error('지도 초기화 중 오류:', error);
    }
  }, [currentLocation]);

  // 검색 결과 목록 렌더링 함수
  const displayPlaces = (places: PlaceSearchResult[]) => {
    setSearchResults(places);
    setShowResults(true);
  };

  // 장소 정보 시트 토글 함수
  const toggleLocationInfoSheet = useCallback(() => {
    setIsLocationInfoSheetOpen(prev => !prev);
  }, []);

  // 장소 정보 시트 닫기 함수
  const closeLocationInfoSheet = useCallback(() => {
    setIsLocationInfoSheetOpen(false);
    // 완전히 사라지지 않고 접힌 상태로 유지
  }, []);

  // 장소 정보 시트 완전히 닫기 함수
  const closeLocationInfoSheetCompletely = useCallback(() => {
    setIsLocationInfoSheetOpen(false);
    // 애니메이션 완료 후 locationInfo를 null로 설정
    setTimeout(() => {
      setLocationInfo(null);
    }, 300);
  }, []);

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
    setIsLocationInfoSheetOpen(true);
    
    // 검색 결과창 닫기
    setShowResults(false);
    setSearchResults([]);
    
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

      // 지도의 중심을 결과값으로 받은 위치로 이동
      (map as { setCenter: (coords: unknown) => void }).setCenter(coords);
    }
  };

  // 키워드 검색
  const searchPlaces = () => {
    if (!places || !searchKeyword.trim()) {
      alert('장소명을 입력해 주세요!');
      return;
    }

    (places as { keywordSearch: (keyword: string, callback: (result: PlaceSearchResult[], status: string) => void, options?: { location?: unknown }) => void })
      .keywordSearch(searchKeyword, (result: PlaceSearchResult[], status: string) => {
        if (status === window.kakao.maps.services.Status.OK) {
          displayPlaces(result);
        } else {
          console.error('검색 실패:', status);
        }
      }, {
        location: userLocation,
      });
  };

  // 검색어 입력 처리
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(e.target.value);
  };

  // 검색 실행
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchPlaces();
  };

  // 검색 결과 닫기
  const closeSearchResults = () => {
    setShowResults(false);
    setSearchResults([]);
  };

  // 자세히 보기 버튼 클릭 핸들러
  const handleDetailClick = () => {
    if (locationInfo) {
      const params = new URLSearchParams({
        id: locationInfo.id,
        name: locationInfo.placeName,
        address: locationInfo.address,
        phone: '', // 전화번호는 나중에 추가
        placeUrl: '' // place_url은 나중에 추가
      });
      
      router.push(`/map/detail?${params.toString()}`);
    }
  };

  // 컴포넌트 마운트 시 현재 위치 가져오기
  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  // 현재 위치와 SDK가 준비되면 지도 초기화
  useEffect(() => {
    if (currentLocation && window.kakao && window.kakao.maps && window.kakao.maps.Map && window.kakao.maps.services) {
      init();
    }
  }, [currentLocation, init]);

  return (
    <div className="h-screen relative">
      {/* 검색창 - 투명한 헤더 위에 고정 */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-20 px-5">
        <form onSubmit={handleSearch}>
          <Input 
            type="icon"
            variant="placeholder"
            placeholder="장소를 검색하세요"
            value={searchKeyword}
            onChange={handleSearchInput}
            onIconClick={() => searchPlaces()}
          />
        </form>
      </div>
      
      {/* 지도 - 전체 화면 */}
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
        <div 
          id="locationinfo"
          className={`
            absolute left-0 right-0 z-10 bg-white border-t border-[#EEEEEE] rounded-t-[20px] shadow-[0px_-4px_12px_rgba(0,0,0,0.08)]
            transition-transform duration-300 ease-out
            ${isLocationInfoSheetOpen ? 'translate-y-0' : 'translate-y-[calc(100%-45px)]'}
            bottom-14
          `}
        >
          {/* 핸들 바 */}
          <div className="flex justify-center my-5" onClick={toggleLocationInfoSheet}>
            <div className="w-[74px] h-1 bg-[#CCCCCC] rounded-full cursor-pointer" />
          </div>
          
          {/* 장소 정보 내용 */}
          <div className="px-5">
            {/* 장소 정보 */}
            <div className="mb-6">
              <h3 className="text-[#333333] text-xl font-semibold leading-6 mb-1">
                {locationInfo.placeName}
              </h3>
              <p className="text-[#767676] text-sm leading-[19.6px]">
                {locationInfo.address}
              </p>
            </div>
            
            {/* 버튼 */}
            <div className="flex gap-2 mb-6">
              <button 
                className="w-[30%] py-4 bg-[#F9F9F9] rounded-lg text-[#333333] text-sm font-normal"
                onClick={handleDetailClick}
              >
                자세히 보기
              </button>
              <button className="flex-1 py-4 bg-[#FF6B81] rounded-lg text-white text-sm font-semibold">
                웨이포인트 지정
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 푸터 */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <Footer />
      </div>

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

export default MapScreen;
