"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Capacitor } from '@capacitor/core';
import { useRouter, useSearchParams } from 'next/navigation';
import Footer from '@/components/Footer';
import Input from '@/components/ui/Input';
import Image from 'next/image';
import { LocationInfo, PlaceSearchResult, GeocoderResult } from '@/types/map';
import { Waypoint } from '@/types/waypoint';
import { getAuthToken } from '@/auth';
import { addLocationToWaypoint } from '@/services/waypointService';
import Notification from '@/components/ui/Notification';

const MapScreenContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [isWaypointModalOpen, setIsWaypointModalOpen] = useState(false);
  const [waypointLists, setWaypointLists] = useState<Waypoint[]>([]);
  const [isLoadingWaypoints, setIsLoadingWaypoints] = useState(false);
  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
  const [memoText, setMemoText] = useState('');
  const [selectedWaypointId, setSelectedWaypointId] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success'
  });
  const [showLocationModal, setShowLocationModal] = useState(false);

  const hasAskedLocationPermission = useCallback(() => {
    try {
      return typeof window !== 'undefined' && localStorage.getItem('locationPermissionAsked') === 'true';
    } catch {
      return false;
    }
  }, []);

  // Toast 표시 함수
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({
      show: true,
      message,
      type
    });
    
    // 1.5초 후 자동으로 숨기기
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 1500);
  };

  // 사용자 현재 위치 가져오기 (웹/네이티브 공통)
  const getUserLocation = useCallback(async () => {
    try {
      if (Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios') {
        const { Geolocation } = await import('@capacitor/geolocation');
        // 권한 요청은 최초 1회만 (우리 앱 내 안내 모달 확인 후)
        if (!hasAskedLocationPermission()) {
          await Geolocation.requestPermissions();
        }
        const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const createLatLng = () => {
          if (window.kakao && window.kakao.maps && window.kakao.maps.LatLng) {
            try {
              const kakaoLatLng = new window.kakao.maps.LatLng(lat, lng);
              setUserLocation(kakaoLatLng);
              setCurrentLocation({ lat, lng });
            } catch (error) {
              console.error('Kakao LatLng 객체 생성 실패:', error);
              const fallback = new window.kakao.maps.LatLng(37.554678, 126.970606);
              setUserLocation(fallback);
              setCurrentLocation({ lat: 37.554678, lng: 126.970606 });
            }
          } else {
            setTimeout(createLatLng, 100);
          }
        };
        createLatLng();
        return true;
      } else {
        if (!navigator.geolocation) throw new Error('Geolocation not supported');
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
        });
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const createLatLng = () => {
          if (window.kakao && window.kakao.maps && window.kakao.maps.LatLng) {
            try {
              const kakaoLatLng = new window.kakao.maps.LatLng(lat, lng);
              setUserLocation(kakaoLatLng);
              setCurrentLocation({ lat, lng });
            } catch (error) {
              console.error('Kakao LatLng 객체 생성 실패:', error);
              const fallback = new window.kakao.maps.LatLng(37.554678, 126.970606);
              setUserLocation(fallback);
              setCurrentLocation({ lat: 37.554678, lng: 126.970606 });
            }
          } else {
            setTimeout(createLatLng, 100);
          }
        };
        createLatLng();
        return true;
      }
    } catch (err) {
      console.error('현재 위치 가져오기 실패:', err);
      return false;
    }
  }, [hasAskedLocationPermission]);

  const handlePermissionConfirm = useCallback(async () => {
    setShowLocationModal(false);
    try {
      localStorage.setItem('locationPermissionAsked', 'true');
    } catch {}
    const ok = await getUserLocation();
    if (!ok) {
      // 차단되었거나 실패한 경우 설정 유도 또는 메인 이동 안내를 고려
      setToast({ show: true, message: '현재 위치를 가져오지 못했습니다.', type: 'error' });
    }
  }, [getUserLocation]);

  const handlePermissionCancel = useCallback(() => {
    alert('지도 페이지는 이용할 수 없어요ㅠㅠ');
    router.push('/main');
  }, [router]);

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

  // 검색 결과 목록 렌더링: searchPlaces 내부에서 직접 상태 업데이트로 처리

  // 장소 정보 시트 토글 함수
  const toggleLocationInfoSheet = useCallback(() => {
    setIsLocationInfoSheetOpen(prev => !prev);
  }, []);

  // 웨이포인트 목록 조회
  const fetchWaypoints = useCallback(async () => {
    try {
      setIsLoadingWaypoints(true);
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('인증 토큰이 없습니다. 로그인이 필요합니다.');
      }

      const { getWaypoints } = await import('@/api/waypoint');
      const data = await getWaypoints();
      
      // 실제 서버 응답 구조에 맞게 처리
      if (data && data.waypointSummaryResponses && Array.isArray(data.waypointSummaryResponses)) {
        // { waypointSummaryResponses } 구조
        const waypoints: Waypoint[] = data.waypointSummaryResponses.map((item: { waypointId: number; name: string; itemCount: number }) => ({
          waypointId: item.waypointId,
          name: item.name,
          itemCount: item.itemCount
        }));
        setWaypointLists(waypoints);
      } else if (Array.isArray(data)) {
        // 배열로 응답하는 경우
        setWaypointLists(data);
      } else {
        // 기타 응답 구조
        setWaypointLists([]);
      }
    } catch (error) {
      console.error('웨이포인트 조회 에러:', error);
      // 에러 발생 시에도 빈 배열로 초기화하여 페이지가 정상 렌더링되도록 함
      setWaypointLists([]);
    } finally {
      setIsLoadingWaypoints(false);
    }
  }, []);

  // 웨이포인트 모달 토글 함수
  const toggleWaypointModal = useCallback(() => {
    setIsWaypointModalOpen(prev => {
      const newState = !prev;
      // 모달이 열릴 때 웨이포인트 목록을 가져옴
      if (newState) {
        fetchWaypoints();
      }
      return newState;
    });
  }, [fetchWaypoints]);

  // 웨이포인트 추가 핸들러: 모달(인라인 입력) 열기로 복구
  const handleAddWaypoint = useCallback(() => {
    setIsWaypointModalOpen(true);
  }, []);

  // 웨이포인트 선택 핸들러 (메모 입력 모달 열기)
  const handleSelectWaypoint = useCallback((waypointId: number) => {
    setSelectedWaypointId(waypointId);
    setMemoText('');
    setIsMemoModalOpen(true);
  }, []);

  // 메모 모달 닫기
  const closeMemoModal = useCallback(() => {
    setIsMemoModalOpen(false);
    setSelectedWaypointId(null);
    setMemoText('');
  }, []);

  // 웨이포인트에 장소 추가 (메모 포함)
  const handleAddToWaypoint = useCallback(async () => {
    if (!locationInfo || !selectedWaypointId) {
      console.error('장소 정보 또는 웨이포인트 ID가 없습니다.');
      return;
    }

    // 웨이포인트 서비스를 통해 장소 추가
    const result = await addLocationToWaypoint(selectedWaypointId, locationInfo, memoText);
    
    if (result.success) {
      // 성공 시 모든 모달 닫기 및 성공 메시지
      setIsWaypointModalOpen(false);
      setIsMemoModalOpen(false);
      showToast('웨이포인트 지정에 성공했습니다!', 'success');
      
      // 웨이포인트 목록 새로고침
      fetchWaypoints();
    } else {
      // 실패 시 에러 메시지 표시
      showToast('웨이포인트 지정에 실패했습니다.', 'error');
    }
  }, [locationInfo, selectedWaypointId, memoText, fetchWaypoints]);

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
  const searchPlaces = useCallback(() => {
    if (!places || !searchKeyword.trim()) {
      alert('장소명을 입력해 주세요!');
      return;
    }

    (places as { keywordSearch: (keyword: string, callback: (result: PlaceSearchResult[], status: string) => void, options?: { location?: unknown }) => void })
      .keywordSearch(searchKeyword, (result: PlaceSearchResult[], status: string) => {
        if (status === window.kakao.maps.services.Status.OK) {
          setSearchResults(result);
          setShowResults(true);
        } else {
          console.error('검색 실패:', status);
        }
      }, {
        location: userLocation,
      });
  }, [places, searchKeyword, userLocation]);

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

  // 컴포넌트 마운트 시: 최초 1회만 안내 모달 노출, 그 외엔 바로 시도
  useEffect(() => {
    if (hasAskedLocationPermission()) {
      setShowLocationModal(false);
      // 이미 안내를 본 경우, 즉시 현재 위치 시도 (OS 권한은 플랫폼이 관리)
      void getUserLocation();
    } else {
      setShowLocationModal(true);
    }
  }, [hasAskedLocationPermission, getUserLocation]);

  // 현재 위치와 SDK가 준비되면 지도 초기화
  useEffect(() => {
    if (currentLocation && window.kakao && window.kakao.maps && window.kakao.maps.Map && window.kakao.maps.services) {
      init();
    }
  }, [currentLocation, init]);

  // URL 파라미터에서 검색어 가져와서 자동 검색
  useEffect(() => {
    const searchQuery = searchParams.get('search');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    
    if (searchQuery) {
      // 검색어가 있으면 searchKeyword에 설정하고 검색 실행
      setSearchKeyword(searchQuery);
      
      // 지도와 places가 준비되면 검색 실행
      if (places && searchQuery.trim()) {
        setTimeout(() => {
          searchPlaces();
        }, 500); // 지도 초기화 완료 후 검색
      }
    } else if (lat && lng) {
      // 좌표가 있으면 해당 위치로 이동
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        setCurrentLocation({ lat: latNum, lng: lngNum });
        
        // 지도가 준비되면 해당 위치로 이동
        if (map && window.kakao && window.kakao.maps) {
          const coords = new window.kakao.maps.LatLng(latNum, lngNum);
          (map as { setCenter: (coords: unknown) => void }).setCenter(coords);
        }
      }
    }
  }, [searchParams, places, map, searchPlaces, searchKeyword]);

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
            absolute left-0 right-0 z-10 bg-white border-t border-gray-200 rounded-t-[20px] shadow-[0px_-4px_12px_rgba(0,0,0,0.08)]
            transition-transform duration-300 ease-out
            ${isLocationInfoSheetOpen ? 'translate-y-0' : 'translate-y-[calc(100%-45px)]'}
            bottom-14
          `}
        >
          {/* 핸들 바 */}
          <div className="flex justify-center my-5" onClick={toggleLocationInfoSheet}>
            <div className="w-[74px] h-1 bg-gray-300 rounded-full cursor-pointer" />
          </div>
          
          {/* 장소 정보 내용 */}
          <div className="px-5">
            {/* 장소 정보 */}
            <div className="mb-6">
              <h3 className="text-gray-700 text-xl font-semibold leading-6 mb-1">
                {locationInfo.placeName}
              </h3>
              <p className="text-gray-500 text-sm leading-[19.6px]">
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
              <button 
                onClick={toggleWaypointModal}
                className="flex-1 py-4 bg-brand-500 rounded-lg text-white text-sm font-semibold"
              >
                웨이포인트 지정
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 웨이포인트 지정 모달 */}
      {isWaypointModalOpen && locationInfo && !isMemoModalOpen && (
        <div 
          className="absolute left-0 right-0 z-10 bg-white border-t border-gray-200 rounded-t-[20px] shadow-[0px_-4px_12px_rgba(0,0,0,0.08)] bottom-14 pb-6 px-5 flex flex-col gap-5"
        >
          {/* 핸들 바 */}
          <div className="flex justify-center pt-4" onClick={toggleWaypointModal}>
            <div className="w-[74px] h-1 bg-gray-300 rounded-full cursor-pointer" />
          </div>
          
          {/* 웨이포인트 지정 내용 */}
          <div className="flex flex-col gap-1">
            {/* 제목 */}
            <div className="text-gray-700 text-xl font-pretendard font-semibold leading-6">
              웨이포인트 지정하기
            </div>
            
            {/* 웨이포인트 목록 */}
            <div className="flex flex-col">
              {/* 웨이포인트 추가 */}
              <div 
                className="py-5 border-b border-gray-200 flex items-end gap-3 cursor-pointer hover:bg-gray-50"
                onClick={handleAddWaypoint}
              >
                <div className="flex items-center gap-2">
                  <div className="text-brand-500 text-base font-pretendard font-normal leading-[22.4px]">
                    웨이포인트 추가
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-500">
                    <path d="M20.6272 12.3137H3.99977" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12.3135 4V20.6274" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              
              {/* 웨이포인트 목록 렌더링 */}
              {isLoadingWaypoints ? (
                <div className="py-5 text-center text-gray-500">
                  웨이포인트를 불러오는 중...
                </div>
              ) : waypointLists.length > 0 ? (
                waypointLists.map((waypoint, index) => (
                  <div 
                    key={waypoint.waypointId} 
                    className={`py-5 flex items-end gap-3 cursor-pointer hover:bg-gray-50 ${index < waypointLists.length - 1 ? 'border-b border-gray-200' : ''}`}
                    onClick={() => handleSelectWaypoint(waypoint.waypointId)}
                  >
                    <div className="text-gray-700 text-base font-pretendard font-normal leading-[22.4px]">
                      {waypoint.name}
                    </div>
                    <div className="min-w-[21px] px-1.5 py-0.5 bg-gray-200 rounded flex items-center justify-center">
                      <div className="text-gray-700 text-xs font-pretendard font-semibold leading-[16.8px]">
                        {waypoint.itemCount}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-5 text-center text-gray-500">
                  등록된 웨이포인트가 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 메모 입력 모달 */}
      {isMemoModalOpen && (
        <div 
          className="absolute left-0 right-0 z-20 bg-white border-t border-gray-200 rounded-t-[20px] shadow-[0px_-4px_12px_rgba(0,0,0,0.08)] bottom-14 pb-6 px-5 flex flex-col gap-5"
        >
          {/* 핸들 바 */}
          <div className="flex justify-center pt-4" onClick={closeMemoModal}>
            <div className="w-[74px] h-1 bg-gray-300 rounded-full cursor-pointer" />
          </div>
          
          {/* 메모 입력 내용 */}
          <div className="flex flex-col gap-4">
            {/* 제목 */}
            <div className="flex items-end gap-2">
              <div className="text-gray-700 text-xl font-pretendard font-semibold leading-6">
                메모하기
              </div>
              <div className="text-xs text-gray-500 font-pretendard">
                {memoText.length}/40
              </div>
            </div>
            {/* 메모 입력 영역 */}
            <div className="flex flex-col gap-2">
              <textarea
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
                placeholder="이 장소에 대한 메모를 입력해주세요"
                maxLength={40}
                className="w-full h-24 p-3 border border-gray-200 rounded-lg resize-none text-sm font-pretendard placeholder-gray-400 focus:outline-none focus:border-brand-500"
              />
             
            </div>
            
            {/* 버튼들 */}
            <div className="flex gap-3">
              <button 
                onClick={closeMemoModal}
                className="flex-1 py-4 bg-gray-100 rounded-lg text-gray-700 text-sm font-normal"
              >
                취소
              </button>
              <button 
                onClick={handleAddToWaypoint}
                className="flex-1 py-4 bg-brand-500 rounded-lg text-white text-sm font-semibold"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Button - 장소 정보창 상태에 따라 위치 조정 */}
      {!locationInfo ? (
        // 장소 정보창이 없을 때 - 기존 위치
        <div className="absolute bottom-20 right-4 z-10">
          <button 
            className="w-12 h-12 bg-brand-500 rounded-full flex justify-center items-center shadow-lg hover:bg-brand-600 transition-colors"
            onClick={() => router.push('/highlight')}
          >
            <Image 
              src="/images/common/upload.svg" 
              alt="Upload" 
              className="w-6 h-6"
              width={24}
              height={24}
            />
          </button>
        </div>
      ) : !isLocationInfoSheetOpen ? (
        // 장소 정보창이 닫힐 때 - 핸들 바 위쪽에 위치
        <div className="absolute bottom-32 right-4 z-10">
          <button 
            className="w-12 h-12 bg-brand-500 rounded-full flex justify-center items-center shadow-lg hover:bg-brand-600 transition-colors"
            onClick={() => router.push('/highlight')}
          >
            <Image 
              src="/images/common/camera.svg" 
              alt="Camera" 
              className="w-6 h-6"
              width={24}
              height={24}
            />
          </button>
        </div>
      ) : null}

      {/* 푸터 */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <Footer />
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 left-0 right-0 z-50 p-4">
          <Notification
            type={toast.type}
            onClose={() => setToast(prev => ({ ...prev, show: false }))}
          >
            {toast.message}
          </Notification>
        </div>
      )}

      {/* 위치 권한 사전 안내 모달 */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-5">
          <div 
            className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-lg"
            style={{
              boxShadow: '2px 4px 8px rgba(0, 0, 0, 0.08)'
            }}
          >
            <div className="flex flex-col items-center gap-8">
              <div className="w-full flex flex-col items-center gap-4">
                <div className="text-center text-gray-800 text-xl font-pretendard font-semibold leading-6">
                  현재 위치를 사용하시겠어요?
                </div>
                <div className="text-center text-gray-500 text-sm font-pretendard font-normal leading-5">
                  주변 장소 검색과 지도 이동을 위해 기기의 위치 권한이 필요합니다.
                </div>
              </div>
              <div className="w-full flex items-center gap-4">
                <button
                  onClick={handlePermissionCancel}
                  className="w-24 py-4 bg-gray-200 rounded-lg flex justify-center items-center"
                >
                  <span className="text-center text-gray-700 text-sm font-pretendard font-normal leading-5">
                    취소
                  </span>
                </button>
                <button
                  onClick={handlePermissionConfirm}
                  className="flex-1 py-4 bg-brand-500 rounded-lg flex justify-center items-center"
                >
                  <span className="text-center text-white text-sm font-pretendard font-semibold leading-5">
                    확인
                  </span>
                </button>
              </div>
            </div>
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

const MapScreen = () => {
  return (
    <Suspense fallback={null}>
      <MapScreenContent />
    </Suspense>
  );
};

export default MapScreen;
