"use client";

import { useState, useEffect } from 'react';
import Footer from '@/components/Footer';
import Input from '@/components/ui/Input';
import { useKakaoMap, usePlaceSearch } from '@/hooks/map';
import { SearchResultsList } from '@/components/map/SearchResultsList';
import { PlaceInfoModal } from '@/components/PlaceInfoModal';
import { PlaceSearchResult } from '@/types/kakaoMap';
import { PlaceInfo } from '@/types/placeInfo';
import { getPlaceInfo, extractBasicInfoForDB } from '@/services/hybridPlaceService';

const MapScreen = () => {
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedPlaceInfo, setSelectedPlaceInfo] = useState<PlaceInfo | null>(null);
  const [showPlaceModal, setShowPlaceModal] = useState<boolean>(false);
  
  // 카카오맵 관련 hooks
  const { 
    mapRef, 
    map, 
    currentPosition, 
    isLoading, 
    error, 
    clickPosition,
    moveToLocation
  } = useKakaoMap();
  const { searchState, showResults, searchPlaces, clearSearchResults, setShowResults } = usePlaceSearch(map);

  // 지도 클릭 시 장소 정보 조회
  useEffect(() => {
    if (clickPosition) {
      const fetchPlaceInfo = async () => {
        try {
          console.log('🗺️ 지도 클릭:', clickPosition);
          console.log('🔍 getPlaceInfo 함수 호출 시작...');
          
          const placeInfo = await getPlaceInfo(clickPosition.lat, clickPosition.lng);
          console.log('📋 getPlaceInfo 결과:', placeInfo);
          
          if (placeInfo) {
            console.log('✅ 장소 정보 조회 성공, 모달 표시');
            console.log('📍 장소 정보:', {
              name: placeInfo.name,
              address: placeInfo.address,
              category: placeInfo.category,
              details: placeInfo.details
            });
            
            setSelectedPlaceInfo(placeInfo);
            setShowPlaceModal(true);
            
            console.log('🎯 모달 상태 업데이트 완료');
          } else {
            console.log('❌ 해당 위치의 장소 정보를 찾을 수 없습니다.');
          }
        } catch (error) {
          console.error('❌ Error getting place info:', error);
        }
      };

      fetchPlaceInfo();
    }
  }, [clickPosition]);

  // 검색어 입력 처리
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchKeyword(value);
  };

  // 검색 실행 (엔터키 또는 검색 버튼)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
  };

  // 검색 실행 함수
  const executeSearch = () => {
    if (searchKeyword.trim()) {
      searchPlaces(searchKeyword.trim());
    }
  };

  // 검색 아이콘 클릭 처리
  const handleIconClick = () => {
    executeSearch();
  };

  // 엔터키 처리
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit(e);
    }
  };

  // 장소 선택 처리
  const handlePlaceSelect = (place: PlaceSearchResult) => {
    console.log('📍 선택된 장소:', place);
    if (place.y && place.x) {
      moveToLocation(parseFloat(place.y), parseFloat(place.x), 3);
    }
  };

  // 더보기 처리
  const handleLoadMore = () => {
    console.log('📄 더보기 클릭 - 다음 페이지 로드');
    if (searchState.pagination && searchState.pagination.current < searchState.pagination.last) {
      const nextPage = searchState.pagination.current + 1;
      searchPlaces(searchKeyword, nextPage);
    }
  };

  // 검색 결과 닫기
  const handleCloseResults = () => {
    setShowResults(false);
    clearSearchResults();
  };

  // 장소 정보 모달 닫기
  const handleClosePlaceModal = () => {
    setShowPlaceModal(false);
    setSelectedPlaceInfo(null);
  };

  // DB에 저장
  const handleSaveToDB = (placeInfo: PlaceInfo) => {
    const basicInfo = extractBasicInfoForDB(placeInfo);
    console.log('💾 DB에 저장할 기본 정보:', basicInfo);
    // TODO: 실제 DB 저장 로직 구현
    handleClosePlaceModal();
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-100 relative">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">지도를 불러오는 중...</h2>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-100 relative">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2 text-red-600">오류가 발생했습니다</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-brand-500 text-white rounded-lg"
            >
              다시 시도
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="h-screen relative">
      {/* 검색창 - 투명한 헤더 위에 고정 */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-20 px-5">
        <form onSubmit={handleSearchSubmit}>
          <Input 
            type="icon"
            variant="placeholder"
            placeholder="장소를 검색하세요"
            value={searchKeyword}
            onChange={handleSearchInput}
            onKeyPress={handleKeyPress}
            onIconClick={handleIconClick}
          />
        </form>
      </div>
      
      {/* 지도 - 전체 화면 */}
      <div className="w-full h-full">
        <div 
          ref={mapRef} 
          className="w-full h-full"
        />
      </div>
      


      {/* 검색 결과 리스트 */}
      <SearchResultsList
        searchKeyword={searchKeyword}
        results={searchState.results}
        showResults={showResults}
        hasMore={searchState.hasMore}
        isLoading={searchState.isLoading}
        pagination={searchState.pagination}
        onPlaceSelect={handlePlaceSelect}
        onLoadMore={handleLoadMore}
        onClose={handleCloseResults}
      />

      {/* 장소 정보 모달 */}
      <PlaceInfoModal
        placeInfo={selectedPlaceInfo}
        isOpen={showPlaceModal}
        onClose={handleClosePlaceModal}
        onSaveToDB={handleSaveToDB}
      />
      
      {/* 푸터 */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <Footer />
      </div>
    </div>
  );
};

export default MapScreen;
