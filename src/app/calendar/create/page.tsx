"use client";

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/ui/Header';
import Input from '@/components/ui/Input';
import DatePicker from '@/components/ui/DatePicker';
import Button from '@/components/ui/Button';
import { Waypoint, WaypointItem } from '@/types/waypoint';
import { useAuthStore } from '@/hooks/auth/useAuth';
import { getPlaceImageUrl } from '@/utils/googlePlacesApi';

export default function CreateEventPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    memo: ''
  });
  const [inputStates, setInputStates] = useState({
    title: 'placeholder' as 'placeholder' | 'focus'
  });
  
  // 웨이포인트 모달 관련 상태
  const [isWaypointModalOpen, setIsWaypointModalOpen] = useState(false);
  const [waypointLists, setWaypointLists] = useState<Waypoint[]>([]);
  const [isLoadingWaypoints, setIsLoadingWaypoints] = useState(false);
  
  // 선택된 웨이포인트 아이템들
  const [selectedWaypointItems, setSelectedWaypointItems] = useState<WaypointItem[]>([]);
  const [selectedWaypointId, setSelectedWaypointId] = useState<number | null>(null);
  const [isLoadingWaypointItems, setIsLoadingWaypointItems] = useState(false);
  const [itemImageUrls, setItemImageUrls] = useState<Record<number, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInputFocus = (field: string) => {
    setInputStates(prev => ({
      ...prev,
      [field]: 'focus'
    }));
  };

  const handleInputBlur = (field: string) => {
    setInputStates(prev => ({
      ...prev,
      [field]: 'placeholder'
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 유효성 검사
    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    
    if (!formData.startDate) {
      alert('시작일을 선택해주세요.');
      return;
    }
    
    if (!formData.endDate) {
      alert('종료일을 선택해주세요.');
      return;
    }
    
    // 시작일이 종료일보다 늦으면 안됨
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      alert('시작일은 종료일보다 늦을 수 없습니다.');
      return;
    }
    
    try {
      // 일정 생성 API 호출
      const requestData = {
        title: formData.title,
        startDate: formData.startDate,
        endDate: formData.endDate,
        stickerListRequest: {
          stickerRequests: []
        },
        waypointId: selectedWaypointId,
        memo: formData.memo
      };

      console.log('일정 생성 요청:', requestData);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/diary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('일정 생성에 실패했습니다.');
      }

      // 성공 시 캘린더로 돌아가기
      router.push('/calendar');
    } catch (error) {
      console.error('일정 생성 에러:', error);
      alert('일정 생성에 실패했습니다.');
    }
  };

  const handleCancel = () => {
    router.push('/calendar');
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

  // 웨이포인트 아이템 조회
  const fetchWaypointItems = useCallback(async (waypointId: number) => {
    try {
      setIsLoadingWaypointItems(true);
      
      if (!accessToken) {
        throw new Error('인증 토큰이 없습니다. 로그인이 필요합니다.');
      }

      const response = await fetch(`/api/waypoint/${waypointId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('웨이포인트 아이템을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setSelectedWaypointItems(data.waypointInfoResponse || []);
      
      // 구글 이미지 URL 가져오기
      if (data.waypointInfoResponse && data.waypointInfoResponse.length > 0) {
        const imagePromises = data.waypointInfoResponse.map(async (item: WaypointItem) => {
          try {
            const imageUrl = await getPlaceImageUrl(item.name);
            return { itemId: item.itemId, imageUrl };
          } catch (error) {
            console.error(`장소 ${item.name} 이미지 가져오기 실패:`, error);
            return { itemId: item.itemId, imageUrl: '' };
          }
        });
        
        const imageResults = await Promise.all(imagePromises);
        const imageUrlMap: Record<number, string> = {};
        imageResults.forEach(({ itemId, imageUrl }) => {
          // 이미지 URL이 있으면 사용하고, 없으면 기본 이미지 사용
          imageUrlMap[itemId] = imageUrl || '/images/illust/cats/backgroundCat.png';
        });
        setItemImageUrls(imageUrlMap);
      }
    } catch (error) {
      console.error('웨이포인트 아이템 조회 에러:', error);
      setSelectedWaypointItems([]);
    } finally {
      setIsLoadingWaypointItems(false);
    }
  }, [accessToken]);

  // 웨이포인트 선택 핸들러
  const handleSelectWaypoint = useCallback((waypointId: number) => {
    setSelectedWaypointId(waypointId);
    fetchWaypointItems(waypointId);
    setIsWaypointModalOpen(false);
  }, [fetchWaypointItems]);

  return (
    <div className="w-full min-h-screen relative bg-white overflow-hidden">
      {/* Header */}
      <Header title="일정 생성" showBackButton={true} />

      {/* Form */}
      <div className="flex-1 px-6 py-6 mb-24">
        <form onSubmit={handleSubmit} className="flex flex-col gap-10">
          {/* 제목 */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-1">
              <span className="text-gray-700 text-base font-pretendard font-semibold leading-[19.2px]">제목</span>
              <span className="text-brand-500 text-base font-pretendard font-semibold leading-[19.2px]">*</span>
            </div>
            <Input
              type="text"
              variant={inputStates.title}
              placeholder="일정 제목을 입력하세요"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              onFocus={() => handleInputFocus('title')}
              onBlur={() => handleInputBlur('title')}
            />
          </div>

          {/* 기간 */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-1">
              <span className="text-gray-700 text-base font-pretendard font-semibold leading-[19.2px]">기간</span>
              <span className="text-brand-500 text-base font-pretendard font-semibold leading-[19.2px]">*</span>
            </div>
            
            {/* 시작일 */}
            <div className="flex items-center gap-7">
              <span className="w-7 text-gray-700 text-sm font-pretendard font-normal leading-[19.6px]">시작</span>
              <DatePicker
                value={formData.startDate}
                onChange={(date) => handleInputChange('startDate', date)}
                placeholder="날짜를 선택하세요"
              />
            </div>

            {/* 종료일 */}
            <div className="flex items-center gap-7">
              <span className="w-7 text-gray-700 text-sm font-pretendard font-normal leading-[19.6px]">종료</span>
              <DatePicker
                value={formData.endDate}
                onChange={(date) => handleInputChange('endDate', date)}
                placeholder="날짜를 선택하세요"
              />
            </div>
          </div>

          {/* 스티커 추가 */}

          {/* 웨이포인트 불러오기 */}
          <div className="flex flex-col gap-4">
            <span className="text-gray-700 text-base font-pretendard font-semibold leading-[19.2px]">일정</span>
            {/* 선택된 웨이포인트 아이템들 */}
            {isLoadingWaypointItems ? (
              <div className="py-4 text-center text-gray-500">
                웨이포인트 아이템을 불러오는 중...
              </div>
            ) : selectedWaypointItems.length > 0 ? (
              <div className="flex flex-col gap-6">
                {selectedWaypointItems.map((item) => (
                  <div key={item.itemId} className="flex items-start gap-3">
                    {/* 장소 이미지 */}
                    {itemImageUrls[item.itemId] ? (
                      <div className="w-[75px] h-[75px] rounded-lg border border-gray-200 overflow-hidden flex-shrink-0">
                        <Image
                          src={itemImageUrls[item.itemId]}
                          alt={item.name}
                          width={75}
                          height={75}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-[75px] h-[75px] rounded-lg border border-gray-200 overflow-hidden flex-shrink-0">
                        <Image
                          src="/images/illust/cats/backgroundCat.png"
                          alt="기본 이미지"
                          width={75}
                          height={75}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {/* 장소 텍스트 정보 */}
                    <div className="flex-1 flex flex-col gap-1">
                      {/* 장소명 */}
                      <div className="text-gray-700 text-base font-pretendard font-normal leading-[22.4px]">
                        {item.name}
                      </div>
                      
                      {/* 장소 주소 */}
                      <div className="text-gray-700 text-xs font-pretendard font-normal break-words">
                        {item.address}
                      </div>
                      
                      {/* 메모 (조건부 렌더링) */}
                      {item.memo && (
                        <div className="flex items-center mt-2">
                          <span className="text-gray-500 text-sm font-pretendard font-normal leading-[19.6px]">메모</span>
                          <span className="text-gray-500 text-sm font-pretendard font-normal leading-[19.6px] mx-1">ㅣ</span>
                          <span className="text-gray-700 text-sm font-pretendard font-normal leading-[19.6px]">
                            {item.memo}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            
            {/* 웨이포인트 불러오기 버튼 */}
            <Button
              kind="functional"
              tone="gray"
              fullWidth
              onClick={(e) => {
                e.preventDefault();
                toggleWaypointModal();
              }}
            >
              {selectedWaypointItems.length > 0 ? '웨이포인트 다시 불러오기' : '웨이포인트 불러오기'}
            </Button>
          </div>

          {/* 메모 */}
          <div className="flex flex-col gap-4">
          <span className="text-gray-700 text-base font-pretendard font-semibold leading-[19.2px]">메모</span>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 text-sm font-pretendard font-normal leading-[19.6px] resize-none focus:outline-none focus:border-brand-500 placeholder:text-gray-500"
              placeholder="자유롭게 메모를 입력하세요"
              value={formData.memo}
              onChange={(e) => handleInputChange('memo', e.target.value)}
              rows={4}
            />
          </div>
        </form>
      </div>

      {/* 웨이포인트 지정 모달 */}
      {isWaypointModalOpen && (
        <>
          {/* 배경 오버레이 */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-10"
            onClick={toggleWaypointModal}
          />
          <div 
            className="fixed left-0 right-0 bottom-0 z-20 bg-white border-t border-gray-200 rounded-t-[20px] shadow-[0px_-4px_12px_rgba(0,0,0,0.08)] pb-6 px-5 flex flex-col gap-5"
          >
          {/* 웨이포인트 지정 내용 */}
          <div className="flex flex-col gap-4 pt-4">
            {/* 제목 */}
            <div className="text-gray-700 text-xl font-pretendard font-semibold">
              웨이포인트 지정하기
            </div>
            
            {/* 웨이포인트 목록 */}
            <div className="flex flex-col">
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
        </>
      )}

      {/* 하단 버튼들 */}
      <div className="absolute bottom-5 left-5 right-5 flex gap-3">
        <button 
          type="button"
          onClick={handleCancel}
          className="flex-1 py-4 bg-gray-100 rounded-lg shadow-[2px_4px_8px_rgba(0,0,0,0.08)] flex items-center justify-center"
        >
          <span className="text-gray-700 text-sm font-pretendard font-normal leading-[19.6px]">취소</span>
        </button>
        <button 
          type="submit"
          onClick={handleSubmit}
          className="flex-1 py-4 bg-brand-500 rounded-lg shadow-[2px_4px_8px_rgba(0,0,0,0.08)] flex items-center justify-center"
        >
          <span className="text-white text-sm font-pretendard font-semibold leading-[19.6px]">생성하기</span>
        </button>
      </div>
    </div>
  );
}
