"use client";

import Header from '@/components/ui/Header';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { WaypointItem } from '@/types/waypoint';
import { getPlaceImageUrl } from '@/utils/googlePlacesApi';
import { useParams, useRouter } from 'next/navigation';
import { getAuthToken } from '@/auth';

interface WaypointDetailResponse {
  waypointName: string;
  waypointInfoResponse: WaypointItem[];
}

export default function WaypointDetailPage() {
  const params = useParams();
  const router = useRouter();
  const waypointId = params.id as string;
  
  const [waypointData, setWaypointData] = useState<WaypointDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemImageUrls, setItemImageUrls] = useState<Record<number, string>>({});
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);

  // 웨이포인트 상세 정보 조회
  const fetchWaypointDetail = async (id: string): Promise<WaypointDetailResponse> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('인증 토큰이 없습니다.');
    }

    const response = await fetch(`/api/waypoint/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('웨이포인트 상세 정보를 불러오는데 실패했습니다.');
    }

    const data = await response.json();
    return data;
  };

  useEffect(() => {
    const loadWaypointDetail = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await fetchWaypointDetail(waypointId);
        setWaypointData(data);
        
        // 각 장소의 이미지를 구글 플레이스에서 가져오기
        if (data.waypointInfoResponse && data.waypointInfoResponse.length > 0) {
          const imagePromises = data.waypointInfoResponse.map(async (item) => {
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
            if (imageUrl) {
              imageUrlMap[itemId] = imageUrl;
            }
          });
          setItemImageUrls(imageUrlMap);
        }
      } catch (error) {
        console.error('웨이포인트 상세 조회 에러:', error);
        setError(error instanceof Error ? error.message : '웨이포인트를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    if (waypointId) {
      loadWaypointDetail();
    }
  }, [waypointId]);

  // 체크박스 토글 함수
  const toggleItemSelection = (itemId: number) => {
    const newSelectedItems = new Set(selectedItems);
    if (newSelectedItems.has(itemId)) {
      newSelectedItems.delete(itemId);
    } else {
      newSelectedItems.add(itemId);
    }
    setSelectedItems(newSelectedItems);
    setIsAllSelected(newSelectedItems.size === waypointData?.waypointInfoResponse.length);
  };

  // 전체 선택/해제 함수
  const toggleAllSelection = () => {
    if (isAllSelected) {
      setSelectedItems(new Set());
      setIsAllSelected(false);
    } else {
      const allItemIds = waypointData?.waypointInfoResponse.map(item => item.itemId) || [];
      setSelectedItems(new Set(allItemIds));
      setIsAllSelected(true);
    }
  };

  // 옮겨담기 함수
  const handleMoveItems = () => {
    console.log('옮겨담기:', Array.from(selectedItems));
    // TODO: 웨이포인트 선택 모달 표시
  };

  // 삭제하기 함수
  const handleDeleteItems = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const waypointItemIds = Array.from(selectedItems);
      
      // 각 아이템마다 개별 DELETE 요청
      const deletePromises = waypointItemIds.map(async (itemId) => {
        const response = await fetch(`/api/waypoint/${waypointId}/items/${itemId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ waypointItemIds: [waypointId, itemId] }),
        });
        
        if (!response.ok) {
          throw new Error(`장소 ${itemId} 삭제에 실패했습니다.`);
        }
        
        return response;
      });
      
      // 모든 삭제 요청이 완료될 때까지 대기
      await Promise.all(deletePromises);

      // 삭제 성공 시 선택 상태 초기화하고 데이터 다시 로드
      setSelectedItems(new Set());
      setIsAllSelected(false);
      
      // 웨이포인트 데이터 다시 로드
      const data = await fetchWaypointDetail(waypointId);
      setWaypointData(data);
      
      console.log('장소 삭제 완료:', waypointItemIds);
    } catch (error) {
      console.error('장소 삭제 에러:', error);
      alert(error instanceof Error ? error.message : '장소 삭제에 실패했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-white flex flex-col">
        <Header title="웨이포인트 상세" showBackButton={true} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen bg-white flex flex-col">
        <Header title="웨이포인트 상세" showBackButton={true} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-500 text-center">
            <div className="mb-2">오류가 발생했습니다</div>
            <div className="text-sm">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!waypointData) {
    return (
      <div className="w-full h-screen bg-white flex flex-col">
        <Header title="웨이포인트 상세" showBackButton={true} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">웨이포인트를 찾을 수 없습니다</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-white flex flex-col relative overflow-hidden">
      {/* Header */}
      <Header title="웨이포인트 상세" showBackButton={true} />

      {/* Main Content */}
      <div className="flex-1 pt-6 bg-white flex flex-col min-h-0">
        {/* 웨이포인트 제목 */}
        <div className="px-6 flex items-center gap-2 mb-8">
          <h1 className="text-gray-700 text-xl font-pretendard font-normal leading-7">
            {waypointData.waypointName}
          </h1>
          <Image 
            src="/images/common/arrowTop.svg"
            alt="arrow"
            width={12}
            height={12}
            className="transform rotate-180"
          />
        </div>

        {/* 장소 목록 */}
        <div className="flex-1 flex flex-col gap-3">
          {/* 전체 선택 헤더 */}
          <div className="px-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleAllSelection}
                className="w-5 h-5 bg-white rounded-full border border-gray-300 flex items-center justify-center"
              >
                {isAllSelected && (
                  <Image 
                    src="/images/common/checkbox.svg"
                    alt="checked"
                    width={20}
                    height={20}
                  />
                )}
              </button>
              <div className="flex items-center gap-1">
                <span className="text-gray-700 text-base font-pretendard font-normal leading-[22.4px]">전체</span>
                <span className="text-brand-500 text-base font-pretendard font-normal leading-[22.4px]">{waypointData.waypointInfoResponse.length}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-700 text-sm font-pretendard font-normal leading-[19.6px]">순서변경</span>
              <Image
                src="/images/common/align.svg"
                alt="align"
                width={20}
                height={20}
              />
            </div>
          </div>

          {/* 장소 목록 */}
          <div className="flex-1 flex flex-col">
            {waypointData.waypointInfoResponse.map((item) => (
              <div key={item.itemId} className="w-full px-6 py-3 bg-white flex items-center gap-4">
                {/* 체크박스 */}
                <button 
                  onClick={() => toggleItemSelection(item.itemId)}
                  className="w-5 h-5 bg-white rounded-full border border-gray-300 flex items-center justify-center"
                >
                  {selectedItems.has(item.itemId) && (
                    <Image 
                      src="/images/common/checkbox.svg"
                      alt="checked"
                      width={20}
                      height={20}
                    />
                  )}
                </button>
                
                {/* 장소 정보 컨테이너 */}
                <div className="flex-1 flex items-start">
                  {/* 장소 이미지들 */}
                  {itemImageUrls[item.itemId] ? (
                    <div className="w-[75px] h-[75px] rounded-lg border border-gray-200 overflow-hidden">
                      <Image
                        src={itemImageUrls[item.itemId]}
                        alt={item.name}
                        width={75}
                        height={75}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-[75px] h-[75px] bg-gray-200 rounded-lg border border-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-xs">이미지</span>
                    </div>
                  )}
                  <div className="w-[13.04px] h-[13.04px] rounded-lg" />
                  
                  {/* 장소 텍스트 정보 */}
                  <div className="flex-1 flex flex-col gap-1">
                    {/* 장소명 */}
                    <div className="flex flex-col">
                      <div className="text-gray-700 text-base font-pretendard font-normal leading-[22.4px]">
                        {item.name}
                      </div>
                    </div>
                    
                    {/* 장소 주소 */}
                    <div className="w-full text-[#767676] text-xs font-pretendard font-normal break-words">
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
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 하단 버튼들 */}
      <div className="absolute bottom-5 left-5 right-5 flex gap-3">
        {selectedItems.size > 0 ? (
          <>
            {/* 옮겨담기 버튼 */}
            <button 
              onClick={handleMoveItems}
              className="flex-1 py-4 bg-gray-100 rounded-lg shadow-[2px_4px_8px_rgba(0,0,0,0.08)] flex items-center justify-center"
            >
              <span className="text-gray-700 text-sm font-pretendard font-normal leading-[19.6px]">옮겨담기</span>
            </button>
            {/* 삭제하기 버튼 */}
            <button 
              onClick={handleDeleteItems}
              className="flex-1 py-4 bg-brand-500 rounded-lg shadow-[2px_4px_8px_rgba(0,0,0,0.08)] flex items-center justify-center"
            >
              <span className="text-white text-sm font-pretendard font-semibold leading-[19.6px]">삭제하기</span>
            </button>
          </>
        ) : (
          /* 장소 추가하기 버튼 */
          <button 
            onClick={() => router.push('/map')}
            className="flex-1 py-4 bg-brand-500 rounded-lg shadow-[2px_4px_8px_rgba(0,0,0,0.08)] flex items-center justify-center"
          >
            <span className="text-white text-sm font-pretendard font-semibold leading-[19.6px]">장소 추가하기</span>
          </button>
        )}
      </div>
    </div>
  );
}
