"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import SearchBar from '@/components/ui/SearchBar';
import LocationItem from '@/components/ui/LocationItem';

interface PlaceSearchResult {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  category_group_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
  distance: string;
}

export default function AddressSearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [places, setPlaces] = useState<unknown>(null);
  const [geocoder, setGeocoder] = useState<unknown>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 사용자 현재 위치 가져오기
  const getUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCurrentLocation({ lat, lng });
        },
        () => {
          // 에러 시 기본값 사용 (서울시청)
          setCurrentLocation({ lat: 37.554678, lng: 126.970606 });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      // Geolocation API 미지원 시 기본값 사용
      setCurrentLocation({ lat: 37.554678, lng: 126.970606 });
    }
  }, []);

  // 카카오맵 초기화
  useEffect(() => {
    if (window.kakao && window.kakao.maps) {
      const kakaoPlaces = new window.kakao.maps.services.Places();
      const kakaoGeocoder = new window.kakao.maps.services.Geocoder();
      setPlaces(kakaoPlaces);
      setGeocoder(kakaoGeocoder);
    }
  }, []);

  // 컴포넌트 마운트 시 현재 위치 가져오기
  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  // 키워드 정리 함수
  const cleanKeyword = useCallback((keyword: string): string => {
    return keyword.trim().replace(/\s+/g, ' ');
  }, []);

  // 수동 검색용 함수 (Enter 키나 검색 버튼 클릭 시)
  const handleSearch = useCallback((query?: string) => {
    const searchKeyword = cleanKeyword(query || searchQuery);
    
    if (!searchKeyword || !places) {
      return;
    }
    
    // 즉시 검색 실행 (디바운싱 없음)
    setIsSearching(true);
    setSearchResults([]);

    // 1단계: 위치 기반 검색 (현재 위치가 있을 때만, 거리 제한 없음)
    const performLocationBasedSearch = () => {
      if (currentLocation) {
        const userLocation = new window.kakao.maps.LatLng(currentLocation.lat, currentLocation.lng);
        const searchOptions = {
          location: userLocation,
          sort: 'distance' // 거리순 정렬만 적용, 반경 제한 없음
        };

        (places as { keywordSearch: (keyword: string, callback: (result: PlaceSearchResult[], status: string) => void, options?: { location?: unknown; sort?: string }) => void })
          .keywordSearch(searchKeyword, (result: PlaceSearchResult[], status: string) => {
            if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
              setIsSearching(false);
              setSearchResults(result);
            } else {
              // 위치 기반 검색 실패 시 전국 검색 시도
              performNationwideSearch();
            }
          }, searchOptions);
      } else {
        // 현재 위치가 없으면 바로 전국 검색
        performNationwideSearch();
      }
    };

    // 2단계: 전국 검색 (위치 제한 없음)
    const performNationwideSearch = () => {
      (places as { keywordSearch: (keyword: string, callback: (result: PlaceSearchResult[], status: string) => void) => void })
        .keywordSearch(searchKeyword, (result: PlaceSearchResult[], status: string) => {
          if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
            setIsSearching(false);
            setSearchResults(result);
          } else {
            // 장소 검색 실패 시 주소 검색 시도
            performAddressSearch();
          }
        });
    };

    // 3단계: 주소 검색
    const performAddressSearch = () => {
      if (geocoder) {
        (geocoder as { addressSearch: (address: string, callback: (result: unknown[], status: string) => void) => void })
          .addressSearch(searchKeyword, (addressResult: unknown[], addressStatus: string) => {
            setIsSearching(false);
            
            if (addressStatus === window.kakao.maps.services.Status.OK && addressResult.length > 0) {
              // 주소 검색 결과를 PlaceSearchResult 형태로 변환
              const convertedResults: PlaceSearchResult[] = addressResult.map((addr, index) => {
                const addressData = addr as { address_name: string; road_address_name?: string; x: string; y: string };
                return {
                  id: `address_${index}`,
                  place_name: addressData.address_name,
                  category_name: '주소',
                  category_group_code: 'AD5',
                  category_group_name: '주소',
                  phone: '',
                  address_name: addressData.address_name,
                  road_address_name: addressData.road_address_name || addressData.address_name,
                  x: addressData.x,
                  y: addressData.y,
                  place_url: '',
                  distance: ''
                };
              });
              setSearchResults(convertedResults);
            } else {
              setSearchResults([]);
            }
          });
      } else {
        setIsSearching(false);
        setSearchResults([]);
      }
    };

    // 검색 시작
    performLocationBasedSearch();
  }, [places, geocoder, currentLocation, cleanKeyword]);

  // 실시간 검색을 위한 디바운싱
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        // 검색 로직을 직접 실행
        const rawKeyword = searchQuery;
        const searchKeyword = cleanKeyword(rawKeyword);
        
        if (!searchKeyword || !places) {
          return;
        }
        
        setIsSearching(true);
        setSearchResults([]);

        // 1단계: 위치 기반 검색 (현재 위치가 있을 때만, 거리 제한 없음)
        const performLocationBasedSearch = () => {
          if (currentLocation) {
            const userLocation = new window.kakao.maps.LatLng(currentLocation.lat, currentLocation.lng);
            const searchOptions = {
              location: userLocation,
              sort: 'distance' // 거리순 정렬만 적용, 반경 제한 없음
            };

            (places as { keywordSearch: (keyword: string, callback: (result: PlaceSearchResult[], status: string) => void, options?: { location?: unknown; sort?: string }) => void })
              .keywordSearch(searchKeyword, (result: PlaceSearchResult[], status: string) => {
                if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
                  setIsSearching(false);
                  setSearchResults(result);
                } else {
                  // 위치 기반 검색 실패 시 전국 검색 시도
                  performNationwideSearch();
                }
              }, searchOptions);
          } else {
            // 현재 위치가 없으면 바로 전국 검색
            performNationwideSearch();
          }
        };

        // 2단계: 전국 검색 (위치 제한 없음)
        const performNationwideSearch = () => {
          (places as { keywordSearch: (keyword: string, callback: (result: PlaceSearchResult[], status: string) => void) => void })
            .keywordSearch(searchKeyword, (result: PlaceSearchResult[], status: string) => {
              if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
                setIsSearching(false);
                setSearchResults(result);
              } else {
                // 장소 검색 실패 시 주소 검색 시도
                performAddressSearch();
              }
            });
        };

        // 3단계: 주소 검색
        const performAddressSearch = () => {
          if (geocoder) {
            (geocoder as { addressSearch: (address: string, callback: (result: unknown[], status: string) => void) => void })
              .addressSearch(searchKeyword, (addressResult: unknown[], addressStatus: string) => {
                setIsSearching(false);
                
                if (addressStatus === window.kakao.maps.services.Status.OK && addressResult.length > 0) {
                  // 주소 검색 결과를 PlaceSearchResult 형태로 변환
                  const convertedResults: PlaceSearchResult[] = addressResult.map((addr, index) => {
                    const addressData = addr as { address_name: string; road_address_name?: string; x: string; y: string };
                    return {
                      id: `address_${index}`,
                      place_name: addressData.address_name,
                      category_name: '주소',
                      category_group_code: 'AD5',
                      category_group_name: '주소',
                      phone: '',
                      address_name: addressData.address_name,
                      road_address_name: addressData.road_address_name || addressData.address_name,
                      x: addressData.x,
                      y: addressData.y,
                      place_url: '',
                      distance: ''
                    };
                  });
                  setSearchResults(convertedResults);
                } else {
                  setSearchResults([]);
                }
              });
          } else {
            setIsSearching(false);
            setSearchResults([]);
          }
        };

        // 검색 시작
        performLocationBasedSearch();
      }, 500); // 500ms 디바운싱
    } else if (searchQuery.trim().length === 0) {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, places, geocoder, currentLocation, cleanKeyword]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSelectPlace = (place: PlaceSearchResult) => {
    setIsSelecting(true);
    
    // 선택된 장소의 주소를 하이라이트 페이지로 전달
    // 도로명 주소를 우선으로 하고, 없으면 지번 주소, 그것도 없으면 장소명 사용
    const addressString = place.road_address_name || place.address_name || place.place_name;
    
    console.log('🏪 선택된 장소 정보:', {
      place_name: place.place_name,
      road_address_name: place.road_address_name,
      address_name: place.address_name,
      addressString: addressString
    });
    
    // 잠시 로딩 상태를 보여준 후 페이지 이동
    setTimeout(() => {
      const url = `/highlight?address=${encodeURIComponent(addressString)}&name=${encodeURIComponent(place.place_name)}`;
      console.log('🔗 이동할 URL:', url);
      router.push(url);
    }, 300);
  };


  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header 
        title="주소 검색"
        showBackButton={true}
      />

      {/* 검색 영역 */}
      <div className="px-6 py-6">
        <div className="mb-6">
          <SearchBar
            placeholder="장소명 또는 주소를 입력하세요"
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
          />
        </div>

        {/* 검색 중 상태 */}
        {isSearching && (
          <div className="text-center py-8">
            <div className="text-gray-500 text-sm font-pretendard">
              검색 중...
            </div>
          </div>
        )}

        {/* 선택 중 상태 */}
        {isSelecting && (
          <div className="text-center py-8">
            <div className="text-brand-500 text-sm font-pretendard">
              주소를 선택하는 중...
            </div>
          </div>
        )}

        {/* 검색 결과 */}
        {!isSearching && !isSelecting && searchResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-gray-700 text-base font-pretendard font-semibold">
              검색 결과 ({searchResults.length}개)
            </h3>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {searchResults.map((place) => (
                <LocationItem
                  key={place.id}
                  title={place.place_name}
                  address={place.road_address_name || place.address_name}
                  onClick={() => handleSelectPlace(place)}
                  disabled={isSelecting}
                />
              ))}
            </div>
          </div>
        )}

        {/* 검색 결과가 없을 때 */}
        {!isSearching && !isSelecting && searchQuery && searchResults.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500 text-sm font-pretendard">
              검색 결과가 없습니다.
            </div>
            <div className="text-gray-400 text-xs font-pretendard mt-1">
              다른 키워드로 검색해보세요.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
