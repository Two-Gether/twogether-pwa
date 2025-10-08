"use client";

import Header from '@/components/ui/Header';
import Footer from '@/components/Footer';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PlusIcon from '@/components/icons/PlusIcon';
import Notification from '@/components/ui/Notification';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/auth';
import { Waypoint } from '@/types/waypoint';

export default function WaypointPage() {
  const router = useRouter();
  const [waypointLists, setWaypointLists] = useState<Waypoint[]>([]);
  const [waypointCount, setWaypointCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [waypointName, setWaypointName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [waypointToDelete, setWaypointToDelete] = useState<Waypoint | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // 웨이포인트 목록 조회
  const fetchWaypoints = async () => {
    try {
      setIsLoading(true);
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
        setWaypointCount(waypoints.length);
      } else if (Array.isArray(data)) {
        // 배열로 응답하는 경우
        setWaypointLists(data);
        setWaypointCount(data.length);
      } else {
        // 기타 응답 구조
        setWaypointLists([]);
        setWaypointCount(0);
      }
    } catch (error) {
      console.error('웨이포인트 조회 에러:', error);
      // 에러 발생 시에도 빈 배열로 초기화하여 페이지가 정상 렌더링되도록 함
      setWaypointLists([]);
      setWaypointCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  // 웨이포인트 생성
  const handleAddWaypoint = async () => {
    if (!waypointName.trim()) return;
    
    try {
      setIsCreating(true);
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('인증 토큰이 없습니다. 로그인이 필요합니다.');
      }

      const { createWaypoint } = await import('@/api/waypoint');
      const data = await createWaypoint({ 
        name: waypointName.trim()
      });
      if (data.waypointId) {
        // 새로 생성된 웨이포인트를 목록에 추가
        setWaypointLists(prev => [...prev, { 
          waypointId: parseInt(data.waypointId, 10), 
          name: waypointName.trim(), 
          itemCount: 0
        }]);
        setWaypointCount(prev => prev + 1);
        setShowModal(false);
        setWaypointName('');
        // 생성 후 바로 새로고침
        fetchWaypoints();
      }
    } catch (error) {
      // 에러 처리 (토스트 메시지 등)
      const errorMessage = error instanceof Error ? error.message : '웨이포인트 생성에 실패했습니다.';
      alert(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  // 메뉴 토글 함수
  const toggleMenu = (waypointId: number) => {
    setOpenMenuId(openMenuId === waypointId ? null : waypointId);
  };

  // 삭제 확인 모달 표시
  const showDeleteConfirmModal = (waypoint: Waypoint) => {
    setWaypointToDelete(waypoint);
    setShowDeleteModal(true);
    setOpenMenuId(null);
  };

  // 웨이포인트 삭제
  const handleDeleteWaypoint = async () => {
    if (!waypointToDelete) return;
    
    try {
      setIsDeleting(true);
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const { deleteWaypoint } = await import('@/api/waypoint');
      await deleteWaypoint(waypointToDelete.waypointId);

      // 삭제 성공 시 목록에서 제거
      setWaypointLists(prev => prev.filter(w => w.waypointId !== waypointToDelete.waypointId));
      setWaypointCount(prev => prev - 1);
      setShowDeleteModal(false);
      setWaypointToDelete(null);
      
      // Toast 표시
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '웨이포인트 삭제에 실패했습니다.';
      alert(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  // 웨이포인트 클릭 시 상세 페이지로 이동
  const handleWaypointClick = (waypointId: number) => {
    router.push(`/waypoint/list?waypointId=${waypointId}`);
  };

  // 외부 클릭 감지하여 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-menu-id]')) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 페이지 로드 시 웨이포인트 목록 조회
  useEffect(() => {
    fetchWaypoints();
  }, []);

  const plusIcon = <PlusIcon width={12} height={12} className="text-brand-500" />;

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col">
      {/* Header */}
            <Header title="웨이포인트" showBackButton={false} />

            {/* Main Content */}
      <div className="flex-1 px-5 pt-6 bg-gray-100 flex flex-col min-h-0">
        {/* Main Title */}
        <div className="relative mb-8 flex-shrink-0">
          <h1 className="text-gray-900 text-2xl font-pretendard font-semibold leading-[28.80px]">
            우리의<br />
            웨이포인트 {waypointCount}
          </h1>
          
          {/* Cat Image Container */}
          <div className="absolute right-0 top-[-8px] w-[134px] h-[105px] z-5">
            <Image
              src="/images/illust/cats/playCat.png"
              alt="Play Cat"
              width={134}
              height={105}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        </div>

        {/* Add Waypoint Button */}
        <div className="mb-4 flex-shrink-0">
          <Button
            kind="functional"
            styleType="outline"
            tone="brand"
            fullWidth
            icon={plusIcon}
            onClick={() => setShowModal(true)}
          >
            웨이포인트 추가하기
          </Button>
        </div>

        {/* Waypoint Lists */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4 custom-scrollbar min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500 text-sm">웨이포인트를 불러오는 중...</div>
            </div>
          ) : waypointLists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-gray-700 text-sm mb-2">아직 웨이포인트가 없습니다</div>
              <div className="text-gray-700 text-xs">새로운 웨이포인트를 추가해보세요</div>
            </div>
          ) : (
            waypointLists.map((waypoint) => (
              <div 
                key={waypoint.waypointId} 
                className="w-full p-4 bg-gray-200 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleWaypointClick(waypoint.waypointId)}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="text-gray-700 text-base font-pretendard font-normal leading-[22.4px] mb-1">
                      {waypoint.name}
                    </h3>
                    <p className="text-gray-500 text-sm font-pretendard font-normal leading-[19.6px]">
                      보관중인 장소 {waypoint.itemCount}
                    </p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMenu(waypoint.waypointId);
                      }}
                      className="w-5 h-5 flex items-center justify-center"
                    >
                      <Image
                        src="/images/common/menu.svg"
                        alt="Menu"
                        width={16}
                        height={16}
                      />
                    </button>
                    
                    {/* 드롭다운 메뉴 */}
                    {openMenuId === waypoint.waypointId && (
                      <div 
                        className="absolute right-0 top-6 w-36 bg-gray-100 border border-gray-300 rounded-lg shadow-lg z-50"
                        data-menu-id={waypoint.waypointId}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            showDeleteConfirmModal(waypoint);
                          }}
                          className="w-full px-4 py-3 text-left text-brand-500 hover:bg-gray-50 border-b border-gray-100"
                        >
                          웨이포인트 삭제
                        </button>
                        {/* <div className="h-px bg-gray-300" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // 공유 기능은 추후 구현
                            alert('공유 기능은 준비 중입니다.');
                          }}
                          className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50"
                        >
                          공유하기
                        </button> */}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {/* 푸터 높이만큼 여백 */}
          <div className="h-14" />
        </div>
      </div>

      {/* Toast Bar */}
      {showToast && (
        <div className="fixed top-2 left-0 right-0 z-50 p-4">
          <Notification type="default" onClose={() => setShowToast(false)}>
            웨이포인트가 삭제되었어요.
          </Notification>
        </div>
      )}

      {/* Footer */}
      <Footer />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-60 bg-black bg-opacity-50"
          onClick={() => setShowDeleteModal(false)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-sm mx-4 p-5 shadow-[2px_4px_8px_rgba(0,0,0,0.08)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-7">
              <div className="w-full flex flex-col items-center gap-5">
                <h3 className="text-center text-gray-800 text-xl font-pretendard font-semibold">
                  웨이포인트 삭제하기
                </h3>
                <p className="text-center text-gray-500 text-sm font-pretendard font-normal">
                  삭제할 경우 등록되어있던 장소들도 삭제되며<br />
                  한 번 삭제한 웨이포인트는 되돌릴 수 없습니다.
                </p>
              </div>
              <div className="w-full flex gap-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="w-[107px] py-4 bg-gray-200 rounded-lg text-center text-gray-800 text-sm font-pretendard font-normal leading-[19.6px] hover:bg-gray-200 transition-colors"
                >
                  닫기
                </button>
                <button
                  onClick={handleDeleteWaypoint}
                  disabled={isDeleting}
                  className="flex-1 py-4 bg-brand-500 rounded-lg text-center text-white text-sm font-pretendard font-semibold leading-[19.6px] hover:bg-[#FF5A73] transition-colors disabled:opacity-50"
                >
                  {isDeleting ? '삭제 중...' : '삭제하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Waypoint Modal */}
      {showModal && (
        <div 
          className="absolute inset-0 flex items-end justify-center z-50 bg-black bg-opacity-20"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-t-lg w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-end gap-2">
                <h3 className="text-[#333333] text-xl font-pretendard font-bold leading-7">
                  웨이포인트 추가하기
                </h3>
                <span className="text-[#767676] text-sm font-pretendard font-normal leading-[19.6px]">
                  {waypointName.length}/20
                </span>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 text-xl"
              >
                ×
              </button>
            </div>
            
            <Input 
              type="text"
              variant="placeholder"
              placeholder="웨이포인트 이름을 입력해주세요."
              value={waypointName}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 20) {
                  setWaypointName(value);
                }
              }}
              maxLength={20}
              className="w-full pb-3 border-b border-gray-300 flex justify-between items-end mb-4 text-gray-500 placeholder:text-gray-500"
              style={{ marginBottom: '20px' }}
            />

            <Button
              kind="functional"
              styleType="fill"
              tone="brand"
              fullWidth
              onClick={handleAddWaypoint}
              disabled={!waypointName.trim() || isCreating}
            >
              {isCreating ? '추가 중...' : '추가하기'}
            </Button>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 0px;
          display: none;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: transparent;
        }
      `}</style>
    </div>
  );
}
