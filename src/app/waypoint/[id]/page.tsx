"use client";

import Header from '@/components/ui/Header';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { WaypointItem } from '@/types/waypoint';
import { getPlaceImageUrl } from '@/utils/googlePlacesApi';
import { useParams, useRouter } from 'next/navigation';
import { getAuthToken } from '@/auth';
import dynamic from 'next/dynamic';
import Notification from '@/components/ui/Notification';

// @hello-pangea/dnd를 dynamic import로 SSR 방지
const DragDropContext = dynamic(
  () => import('@hello-pangea/dnd').then(mod => mod.DragDropContext),
  { ssr: false }
);
const Droppable = dynamic(
  () => import('@hello-pangea/dnd').then(mod => mod.Droppable),
  { ssr: false }
);
const Draggable = dynamic(
  () => import('@hello-pangea/dnd').then(mod => mod.Draggable),
  { ssr: false }
);

// @hello-pangea/dnd 타입 import
import type { 
  DropResult,
  DroppableProvided, 
  DraggableProvided, 
  DraggableStateSnapshot 
} from '@hello-pangea/dnd';

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
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [reorderedItems, setReorderedItems] = useState<WaypointItem[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Toast 표시 함수
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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
        
        // order 필드 기준으로 정렬
        if (data.waypointInfoResponse && data.waypointInfoResponse.length > 0) {
          // order 필드 기준으로 오름차순 정렬
          const sortedItems = [...data.waypointInfoResponse].sort((a, b) => (a.order || 0) - (b.order || 0));
          data.waypointInfoResponse = sortedItems;
          
          console.log('정렬된 웨이포인트 아이템들:', sortedItems.map(item => ({ 
            itemId: item.itemId, 
            name: item.name, 
            order: item.order 
          })));
        }
        
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
            // 이미지 URL이 있으면 사용하고, 없으면 기본 이미지 사용
            imageUrlMap[itemId] = imageUrl || '/images/illust/cats/backgroundCat.png';
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

  // 순서 변경 모드 토글
  const toggleReorderMode = () => {
    if (isReorderMode) {
      // 순서 변경 모드 종료
      setIsReorderMode(false);
      setReorderedItems([]);
    } else {
      // 순서 변경 모드 시작
      if (!waypointData?.waypointInfoResponse || waypointData.waypointInfoResponse.length === 0) {
        alert('순서를 변경할 아이템이 없습니다.');
        return;
      }
      setIsReorderMode(true);
      const items = [...waypointData.waypointInfoResponse];
      setReorderedItems(items);
      setSelectedItems(new Set());
      setIsAllSelected(false);
      
    }
  };

  // 드래그 시작 핸들러
  const handleDragStart = () => {
    setIsDragging(true);
  };

  // 드래그 앤 드롭 핸들러
  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false);
    
    if (!isReorderMode || !result.destination) {
      return;
    }
    
    const { source, destination } = result;
    
    if (source.index === destination.index) {
      return;
    }
    
    // draggableId에서 실제 itemId 추출 (item-123 -> 123)
    const itemId = parseInt(result.draggableId.replace('item-', ''));
    console.log('Parsed itemId:', itemId);
    
    // 실제 순서 변경
    const newItems = Array.from(reorderedItems);
    const [movedItem] = newItems.splice(source.index, 1);
    newItems.splice(destination.index, 0, movedItem);
    
    console.log('New order:', newItems.map(item => item.name));
    setReorderedItems(newItems);
  };

  // 순서 변경 완료
  const handleReorderComplete = async () => {
    if (!waypointData || reorderedItems.length === 0) return;

    try {
      setIsUpdating(true);
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      // 새로운 순서대로 itemId 배열 생성
      const orderedIds = reorderedItems.map(item => item.itemId);
      console.log('📤 서버에 전송할 orderedIds:', orderedIds);

      const response = await fetch(`/api/waypoint/${waypointId}/items`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderedIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '순서 변경에 실패했습니다.');
      }

      // 성공 시 Toast 표시 후 페이지 새로고침
      showToast('순서가 변경되었습니다.', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch {
      showToast('순서 변경에 실패하였습니다.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // 삭제하기 함수
  const handleDeleteItems = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const waypointItemIds = Array.from(selectedItems);
      
      // 선택된 모든 아이템을 한 번에 삭제
      const response = await fetch(`/api/waypoint/${waypointId}/items`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        body: JSON.stringify({ waypointItemIds }),
        });
        
        if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '선택된 장소 삭제에 실패했습니다.');
      }

      // 삭제 성공 시 선택 상태 초기화하고 데이터 다시 로드
      setSelectedItems(new Set());
      setIsAllSelected(false);
      
      // 웨이포인트 데이터 다시 로드
      const data = await fetchWaypointDetail(waypointId);
      setWaypointData(data);
      
      // 성공 Toast 표시
      showToast('장소가 웨이포인트에서 삭제되었습니다!', 'success');
    } catch {
      showToast('장소 삭제에 실패했습니다.', 'error');
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
          <div className="text-brand-500 text-center">
            <div className="mb-2">오류가 발생했습니다</div>
            <div className="text-sm">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!waypointData) {
    return (
      <div className="w-full h-screen bg-gray-100 flex flex-col">
        <Header title="웨이포인트 상세" showBackButton={true} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">웨이포인트를 찾을 수 없습니다</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col relative overflow-hidden">
      {/* Header */}
      <Header title="웨이포인트 상세" showBackButton={true} />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 left-0 right-0 z-50 p-4">
          <Notification
            type={toast.type}
            onClose={() => setToast(null)}
          >
          {toast.message}
          </Notification>
        </div>
      )}

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
              {!isReorderMode ? (
                <>
              <button 
                onClick={toggleAllSelection}
                disabled={isDragging}
                className={`w-5 h-5 bg-white rounded-full border border-gray-300 flex items-center justify-center ${
                  isDragging ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'
                }`}
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
                </>
              ) : (
                <div className="flex items-center">
                  <span className="text-gray-700 text-base font-pretendard font-normal">순서 변경 중</span>
                </div>
              )}
            </div>
            {!isReorderMode && (
              <button 
                onClick={toggleReorderMode}
                disabled={isDragging}
                className={`flex items-center gap-2 ${isDragging ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="text-gray-700 text-sm font-pretendard font-normal">순서변경</span>
              <Image
                src="/images/common/align.svg"
                alt="align"
                width={20}
                height={20}
              />
              </button>
            )}
          </div>

          {/* 장소 목록 */}
          <div className="flex-1 flex flex-col">
            {isReorderMode && reorderedItems && reorderedItems.length > 0 ? (
              (() => {
                console.log('Rendering DragDropContext with items:', reorderedItems.map(item => ({ id: item.itemId, name: item.name })));
                return (
                  <DragDropContext 
                    onDragStart={handleDragStart} 
                    onDragEnd={handleDragEnd}
                  >
                <Droppable 
                  droppableId={`waypoint-items-${waypointId}`} 
                  direction="vertical"
                >
                  {(provided: DroppableProvided) => (
                    <div 
                      {...provided.droppableProps} 
                      ref={provided.innerRef}
                      className="flex-1 flex flex-col min-h-0"
                      style={{ minHeight: '200px' }}
                    >
                      {reorderedItems.map((item, index) => {
                        const draggableId = `item-${item.itemId}`;
                        console.log('Rendering draggable item:', { draggableId, index, itemId: item.itemId, name: item.name });
                        return (
                          <Draggable 
                            key={draggableId} 
                            draggableId={draggableId} 
                            index={index}
                            isDragDisabled={false}
                          >
                          {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`w-full px-6 py-3 bg-white flex items-center gap-4 border border-gray-200 rounded-lg transition-all duration-200 ${
                                snapshot.isDragging ? 'shadow-2xl bg-blue-50 border-blue-300 transform rotate-2 scale-105' : 'hover:bg-gray-50'
                              }`}
                              style={{ 
                                ...provided.draggableProps.style,
                                touchAction: 'none',
                                WebkitUserSelect: 'none',
                                userSelect: 'none',
                                minHeight: '100px'
                              }}
                            >
                              {/* 드래그 핸들 아이콘 */}
                              <div 
                                {...provided.dragHandleProps}
                                className={`w-8 h-8 flex items-center justify-center cursor-move rounded p-2 touch-manipulation transition-all duration-200 ${
                                  snapshot.isDragging ? 'bg-blue-200 scale-110' : 'hover:bg-gray-100'
                                }`}
                                style={{ 
                                  touchAction: 'none',
                                  WebkitUserSelect: 'none',
                                  userSelect: 'none',
                                  minWidth: '32px',
                                  minHeight: '32px'
                                }}
                              >
                                <Image
                                  src="/images/common/align.svg"
                                  alt="align"
                                  width={24}
                                  height={24}
                                  className="opacity-70 pointer-events-none"
                                />
                              </div>
                              
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
                          )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
                  </DragDropContext>
                );
              })()
            ) : (
              /* 일반 모드 */
              waypointData.waypointInfoResponse.map((item) => (
              <div key={item.itemId} className="w-full px-6 py-3 bg-white flex items-center gap-4">
                {/* 체크박스 */}
                <button 
                  onClick={() => toggleItemSelection(item.itemId)}
                  disabled={isDragging}
                  className={`w-5 h-5 bg-white rounded-full border border-gray-300 flex items-center justify-center ${
                    isDragging ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'
                  }`}
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
                      <div className="w-full text-gray text-xs font-pretendard font-normal break-words">
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
              ))
            )}
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
              disabled={isDragging}
              className={`flex-1 py-4 rounded-lg shadow-[2px_4px_8px_rgba(0,0,0,0.08)] flex items-center justify-center ${
                isDragging 
                  ? 'bg-gray-200 cursor-not-allowed' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <span className="text-gray-700 text-sm font-pretendard font-normal leading-[19.6px]">옮겨담기</span>
            </button>
            {/* 삭제하기 버튼 */}
            <button 
              onClick={handleDeleteItems}
              disabled={isDragging}
              className={`flex-1 py-4 rounded-lg shadow-[2px_4px_8px_rgba(0,0,0,0.08)] flex items-center justify-center ${
                isDragging 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-brand-500 hover:bg-brand-600'
              }`}
            >
              <span className="text-white text-sm font-pretendard font-semibold leading-[19.6px]">삭제하기</span>
            </button>
          </>
        ) : isReorderMode ? (
          /* 순서 변경 완료 버튼 */
          <button 
            onClick={handleReorderComplete}
            disabled={isUpdating || isDragging}
            className={`flex-1 py-4 rounded-lg shadow-[2px_4px_8px_rgba(0,0,0,0.08)] flex items-center justify-center ${
              isDragging 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-brand-500 hover:bg-brand-600'
            } disabled:opacity-50`}
          >
            <span className="text-white text-sm font-pretendard font-semibold leading-[19.6px]">
              {isDragging ? '드래그 중...' : isUpdating ? '변경 중...' : '변경 완료'}
            </span>
          </button>
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
