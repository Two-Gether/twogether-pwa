"use client";

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/ui/Header';
import { PlaceSearchResult } from '@/types/map';
import { getPlaceImageUrl } from '@/utils/googlePlacesApi';
import { Waypoint } from '@/types/waypoint';
import { useAuthStore } from '@/hooks/auth/useAuth';
import Notification from '@/components/ui/Notification';

// 하이라이트 타입 정의
interface Highlight {
  id: number;
  memberId: number;
  imageUrl: string;
  name: string;
  address: string;
  description: string;
  tags: string[];
}

interface PlaceDetail {
  place_name: string;
  address_name: string;
  road_address_name: string;
  phone: string;
  place_url: string;
  category_name: string;
}

function DetailPageContent() {
  const searchParams = useSearchParams();
  const { accessToken } = useAuthStore();
  const [placeDetail, setPlaceDetail] = useState<PlaceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [kakaoApiResponse, setKakaoApiResponse] = useState<PlaceSearchResult | null>(null);
  const [placeImageUrl, setPlaceImageUrl] = useState<string>('');
  const [highlights, setHighlights] = useState<Array<{ id: number; imageUrl: string; description: string }>>([]);
  const [isLoadingHighlights, setIsLoadingHighlights] = useState(false);
  
  // 웨이포인트 모달 관련 상태
  const [isWaypointModalOpen, setIsWaypointModalOpen] = useState(false);
  const [waypointLists, setWaypointLists] = useState<Waypoint[]>([]);
  const [isLoadingWaypoints, setIsLoadingWaypoints] = useState(false);
  
  // 메모 모달 관련 상태
  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
  const [memoText, setMemoText] = useState('');
  const [selectedWaypointId, setSelectedWaypointId] = useState<number | null>(null);
  
  // 웨이포인트 추가 관련 상태
  const [isAddingWaypoint, setIsAddingWaypoint] = useState(false);
  const [newWaypointName, setNewWaypointName] = useState('');
  
  // Toast 상태
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success'
  });

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

  // 하이라이트 데이터 가져오기
  const fetchHighlights = async (address: string) => {
    try {
      setIsLoadingHighlights(true);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/place?address=${encodeURIComponent(address)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('하이라이트 데이터를 가져오는데 실패했습니다.');
      }

      const data: Highlight[] = await response.json();

      // imageUrl과 description만 추출
      const highlightsData = data.map((item: Highlight) => ({
        id: item.id,
        imageUrl: item.imageUrl,
        description: item.description
      }));

      setHighlights(highlightsData);
    } catch {
      setHighlights([]);
    } finally {
      setIsLoadingHighlights(false);
    }
  };

  useEffect(() => {
    const placeId = searchParams.get('id');
    const placeName = searchParams.get('name');
    const address = searchParams.get('address');
    const phone = searchParams.get('phone');
    const placeUrl = searchParams.get('placeUrl');
    const category = searchParams.get('category');

    // 카카오맵 API로 장소 상세 정보 가져오기
    const fetchPlaceDetailFromKakao = async (placeId: string) => {
      try {
        // 카카오맵 API 키워드 검색으로 장소 정보 가져오기
        if (!window.kakao || !window.kakao.maps.services) {
          return;
        }

        return new Promise<PlaceSearchResult>((resolve, reject) => {
          const places = new window.kakao.maps.services.Places();

          // placeId로 장소 검색 (실제로는 place_name으로 검색)
          const placeName = searchParams.get('name');
          if (!placeName) {
            reject(new Error('장소명이 없습니다.'));
            return;
          }

          places.keywordSearch(placeName, (result: unknown[], status: string) => {
            if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
              // placeId와 일치하는 결과 찾기
              const matchedPlace = result.find(place => (place as PlaceSearchResult).id === placeId);
              if (matchedPlace) {
                const placeData = matchedPlace as PlaceSearchResult;
                setKakaoApiResponse(placeData);
                resolve(placeData);
              } else {
                const firstPlace = result[0] as PlaceSearchResult;
                setKakaoApiResponse(firstPlace);
                resolve(firstPlace);
              }
            } else {
              reject(new Error(`API 검색 실패: ${status}`));
            }
          });
        });
      } catch (error) {
        throw error;
      }
    };

    if (placeId && placeName) {
      const placeDetailData = {
        place_name: placeName,
        address_name: address || '',
        road_address_name: address || '',
        phone: phone || '',
        place_url: placeUrl || '',
        category_name: category || '',
      };
      setPlaceDetail(placeDetailData);

      // 카카오맵 API로 상세 정보 가져오기
      if (window.kakao && window.kakao.maps.services) {
        fetchPlaceDetailFromKakao(placeId).catch(() => {
        });
      } else {
        const checkKakaoServices = () => {
          if (window.kakao && window.kakao.maps.services) {
            fetchPlaceDetailFromKakao(placeId).catch(() => {
            });
          } else {
            setTimeout(checkKakaoServices, 100);
          }
        };
        checkKakaoServices();
      }

      // 구글 플레이스에서 장소 이미지 가져오기
      if (placeName) {
        getPlaceImageUrl(placeName).then(imageUrl => {
          setPlaceImageUrl(imageUrl);
        }).catch(() => {
          setPlaceImageUrl('/images/illust/cats/backgroundCat.png');
        });
      }
    } else {
    }

    // 하이라이트 데이터 가져오기
    if (address) {
      fetchHighlights(address);
    }

    setIsLoading(false);
  }, [searchParams]);

  // 카카오맵 열기 함수
  const handleKakaoMapOpen = (placeUrl: string) => {
    window.open(placeUrl, '_blank');
  };

  // 웨이포인트 목록 조회
  const fetchWaypoints = useCallback(async () => {
    try {
      setIsLoadingWaypoints(true);
      
      if (!accessToken) {
        throw new Error('인증 토큰이 없습니다. 로그인이 필요합니다.');
      }

      const response = await fetch('/api/waypoint', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('웨이포인트 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setWaypointLists(data.waypointSummaryResponses || []);
    } catch (error) {
      console.error('웨이포인트 목록 조회 에러:', error);
      setWaypointLists([]);
    } finally {
      setIsLoadingWaypoints(false);
    }
  }, [accessToken]);

  // 웨이포인트 모달 토글
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

  // 웨이포인트 추가 모드 시작
  const handleStartAddingWaypoint = useCallback(() => {
    setIsAddingWaypoint(true);
    setNewWaypointName('');
  }, []);

  // 웨이포인트 추가 취소
  const handleCancelAddingWaypoint = useCallback(() => {
    setIsAddingWaypoint(false);
    setNewWaypointName('');
  }, []);

  // 웨이포인트 추가 실행
  const handleAddWaypoint = useCallback(async () => {
    if (!newWaypointName.trim()) {
      alert('웨이포인트 이름을 입력해주세요.');
      return;
    }

    try {
      if (!accessToken) {
        throw new Error('인증 토큰이 없습니다. 로그인이 필요합니다.');
      }

      const response = await fetch('/api/waypoint', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newWaypointName.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '웨이포인트 추가에 실패했습니다.');
      }

      // 성공 시 웨이포인트 목록 새로고침
      await fetchWaypoints();
      setIsAddingWaypoint(false);
      setNewWaypointName('');
      showToast('웨이포인트가 추가되었습니다.', 'success');
    } catch (error) {
      console.error('웨이포인트 추가 에러:', error);
      showToast('웨이포인트 추가에 실패했습니다.', 'error');
    }
  }, [newWaypointName, accessToken, fetchWaypoints]);

  // ESC 키 처리 (취소만)
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancelAddingWaypoint();
    }
  }, [handleCancelAddingWaypoint]);

  // 웨이포인트 선택 핸들러 (메모 입력 모달 열기)
  const handleSelectWaypoint = useCallback((waypointId: number) => {
    setSelectedWaypointId(waypointId);
    setMemoText('');
    setIsMemoModalOpen(true);
    setIsWaypointModalOpen(false);
  }, []);

  // 메모 모달 닫기
  const closeMemoModal = useCallback(() => {
    setIsMemoModalOpen(false);
    setMemoText('');
    setSelectedWaypointId(null);
  }, []);

  // 웨이포인트에 아이템 추가 (메모 포함)
  const handleAddToWaypoint = useCallback(async () => {
    if (!placeDetail || !selectedWaypointId) {
      alert('장소 정보가 없습니다.');
      return;
    }

    try {
      if (!accessToken) {
        throw new Error('인증 토큰이 없습니다. 로그인이 필요합니다.');
      }

      // 웨이포인트에 추가할 아이템 데이터
      const itemData = {
        name: placeDetail.place_name,
        address: placeDetail.road_address_name || placeDetail.address_name,
        imageUrl: null, // imageUrl은 null로 전송
        memo: memoText.trim() // 메모 텍스트 전송
      };

      const response = await fetch(`/api/waypoint/${selectedWaypointId}/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '웨이포인트에 장소를 추가하는데 실패했습니다.');
      }

      // 성공 메시지 표시
      showToast('웨이포인트 지정에 성공했습니다!', 'success');
      closeMemoModal();
    } catch (error) {
      console.error('웨이포인트 아이템 추가 에러:', error);
      showToast('웨이포인트 지정에 실패했습니다.', 'error');
    }
  }, [placeDetail, selectedWaypointId, memoText, accessToken, closeMemoModal]);

  // 웨이포인트 저장 핸들러
  const handleSaveWaypoint = () => {
    toggleWaypointModal();
  };

  if (isLoading) {
    return (
      <div className="w-full h-full bg-gray-100">
        <Header title="장소 상세" />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (!placeDetail) {
    return (
      <div className="w-full h-full bg-gray-100">
        <Header title="장소 상세" />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">장소 정보를 찾을 수 없습니다.</div>
        </div>
      </div>
    );
  }

  // 카카오맵 API 응답이 있으면 그것을 우선 사용, 없으면 URL 파라미터 사용
  const displayData = kakaoApiResponse || placeDetail;

  return (
    <div className="w-full h-full min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <Header title="지도" showBackButton={true} />
      {/* 메인 콘텐츠 영역 - 남은 높이 채우기 */}
      <div className="flex-1 overflow-y-auto">
        {/* 장소 이미지 영역 */}
        <div className="w-full h-[200px] bg-[#F9F9F9] flex items-center justify-center">
          {placeImageUrl ? (
            <Image
              src={placeImageUrl}
              alt={displayData.place_name}
              width={200}
              height={200}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 bg-gray-300 rounded-lg flex items-center justify-center">
              <span className="text-gray-500 text-sm">이미지</span>
            </div>
          )}
        </div>

        {/* 장소 정보 */}
        <div className="px-5 pt-6 flex flex-col">
          {/* 카테고리 그룹명 및 재방문 정보 */}
          <div className="flex items-center gap-3 mb-4">
            {kakaoApiResponse?.category_group_name && (
              <div className="px-2 py-1 bg-[#F4FBF4] rounded text-[#539C58] text-sm font-normal">
                {kakaoApiResponse.category_group_name}
              </div>
            )}
          </div>

          {/* 장소명 */}
          <h1 className="text-gray-900 text-2xl font-semibold leading-[28.8px] mb-4">
            {displayData.place_name}
          </h1>

          {/* 장소 상세 정보 */}
          <div className="flex flex-col gap-1.5 mb-6">
            {/* 주소 및 카카오맵 열기 */}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 flex items-center justify-center">
              <Image
                    src="/images/common/place.svg"
                    alt="Phone"
                    width={16}
                    height={16}
                  />
              </div>
              <span className="text-gray-900 text-sm font-normal leading-[19.6px]">
                {displayData.road_address_name || displayData.address_name}
              </span>
              {displayData.place_url && (
                <button
                  onClick={() => handleKakaoMapOpen(displayData.place_url!)}
                  className="text-semantic-info text-sm font-normal leading-[19.6px] hover:underline"
                >
                  카카오맵 열기
                </button>
              )}
            </div>

            {/* 카테고리 */}
            {displayData.category_name && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 flex items-center justify-center">
                <Image
                    src="/images/common/category.svg"
                    alt="Phone"
                    width={16}
                    height={16}
                  />
                </div>
                <div className="flex items-center gap-1">
                  {displayData.category_name.split(' > ').map((category, index, array) => (
                    <div key={index} className="flex items-center gap-1">
                      <span className="text-gray-900 text-sm font-normal leading-[19.6px]">
                        {category}
                      </span>
                      {index < array.length - 1 && (
                        <div className="w-2 h-2 flex items-center justify-center">
                          <Image
                            src="/images/common/arrowTop.svg"
                            alt="Arrow Top"
                            width={10}
                            height={10}
                            className="w-1.5 h-2.5 transform rotate-90"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 전화번호 */}
            {displayData.phone && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 flex items-center justify-center">
                  <Image
                    src="/images/common/call.svg"
                    alt="Phone"
                    width={16}
                    height={16}
                  />
                </div>
                <span className="text-gray-900 text-sm font-normal leading-[19.6px]">
                  {displayData.phone}
                </span>
              </div>
            )}
          </div>

          {/* 웨이포인트 지정 버튼 */}
          <div className="flex items-center gap-4 mb-8">
            <button onClick={handleSaveWaypoint} className="flex-1 py-4 bg-white border border-[#CCCCCC] rounded-lg text-gray-900 text-sm font-normal">
              웨이포인트 지정
            </button>
          </div>

          {/* 하이라이트 섹션 */}
          <h2 className="text-gray-900 text-xl font-semibold leading-6 mb-8">
            하이라이트
          </h2>

          {/* 하이라이트 이미지들 */}
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {isLoadingHighlights ? (
              <div className="w-[123px] h-[164px] bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-gray-500 text-sm">로딩 중...</span>
              </div>
            ) : highlights.length > 0 ? (
              highlights.map((highlight) => (
                <div key={highlight.id} className="w-[123px] h-[164px] relative flex-shrink-0">
                  <Image
                    src={highlight.imageUrl}
                    alt={highlight.description}
                    width={123}
                    height={164}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70 rounded-lg" />
                  <div className="absolute inset-3 flex flex-col justify-end">
                    <div className="text-white text-sm font-normal leading-[19.6px]">
                      {highlight.description}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="w-[123px] h-[164px] bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-gray-500 text-sm">하이라이트가 없습니다</span>
              </div>
            )}
          </div>

          {/* 하단 여백 - 남은 공간 채우기 */}
          <div className="flex-1 bg-gray-100" />
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 2px;
          height: 2px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 2px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>

      {/* 웨이포인트 지정 모달 */}
      {isWaypointModalOpen && (
        <div 
          className="fixed left-0 right-0 bottom-0 z-10 bg-white border-t border-gray-200 rounded-t-[20px] shadow-[0px_-4px_12px_rgba(0,0,0,0.08)] max-h-[50vh] flex flex-col"
        >
          {/* 핸들 바 */}
          <div className="flex justify-center pt-4 pb-2" onClick={toggleWaypointModal}>
            <div className="w-[74px] h-1 bg-gray-300 rounded-full cursor-pointer" />
          </div>
          
          {/* 웨이포인트 지정 내용 */}
          <div className="flex flex-col gap-1 px-5 pb-6 flex-1 min-h-0">
            {/* 제목 */}
            <div className="text-gray-700 text-xl font-pretendard font-semibold leading-6 mb-4">
              웨이포인트 지정하기
            </div>
            
            {/* 웨이포인트 목록 */}
            <div className="flex flex-col overflow-y-auto custom-scrollbar flex-1">
              {/* 웨이포인트 추가 */}
              {!isAddingWaypoint ? (
                <div 
                  className="py-5 border-b border-gray-200 flex items-end gap-3 cursor-pointer hover:bg-gray-50"
                  onClick={handleStartAddingWaypoint}
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
              ) : (
                <div className="py-5 border-b border-gray-200 flex items-center gap-3">
                  <input
                    type="text"
                    value={newWaypointName}
                    onChange={(e) => setNewWaypointName(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="웨이포인트 이름을 입력하세요"
                    className="flex-1 text-base font-pretendard font-normal text-brand-500 placeholder-brand-300 focus:outline-none bg-transparent"
                    autoFocus
                  />
                  <button
                    onClick={handleAddWaypoint}
                    className="flex items-center justify-center w-6 h-6 mr-2 bg-brand-500 rounded-full hover:bg-brand-600 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20.6272 12.3137H3.99977" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12.3135 4V20.6274" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              )}
              
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
          className="fixed left-0 right-0 bottom-0 z-20 bg-white border-t border-gray-200 rounded-t-[20px] shadow-[0px_-4px_12px_rgba(0,0,0,0.08)] pb-6 px-5 flex flex-col gap-5"
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

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-8 left-0 right-0 z-50 p-4">
          <Notification
            type={toast.type}
            onClose={() => setToast(prev => ({ ...prev, show: false }))}
          >
            {toast.message}
          </Notification>
        </div>
      )}
    </div>
  );
}

export default function DetailPage() {
  return (
    <Suspense fallback={null}>
      <DetailPageContent />
    </Suspense>
  );
}
