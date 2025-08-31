"use client";

import Header from '@/components/ui/Header';
import Footer from '@/components/Footer';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PlusIcon from '@/components/icons/PlusIcon';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { getAuthToken } from '@/auth';
import { Waypoint, CreateWaypointResponse, GetWaypointsResponse } from '@/types/waypoint';

export default function WaypointPage() {
  const [waypointLists, setWaypointLists] = useState<Waypoint[]>([]);
  const [waypointCount, setWaypointCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [waypointName, setWaypointName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // 웨이포인트 목록 조회
  const fetchWaypoints = async () => {
    try {
      setIsLoading(true);
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('인증 토큰이 없습니다. 로그인이 필요합니다.');
      }

      const response = await fetch('/api/waypoint', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GetWaypointsResponse = await response.json();
      if (data.success) {
        setWaypointLists(data.data);
        setWaypointCount(data.data.length);
      }
    } catch {
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

      const response = await fetch('/api/waypoint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: waypointName.trim() }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CreateWaypointResponse = await response.json();
      if (data.waypointId) {
        // 새로 생성된 웨이포인트를 목록에 추가
        setWaypointLists(prev => [...prev, { id: parseInt(data.waypointId, 10), name: waypointName.trim(), placeCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
        setWaypointCount(prev => prev + 1);
        setShowModal(false);
        setWaypointName('');
        // 생성 후 바로 새로고침
        fetchWaypoints();
      }
    } catch {
      // 에러 처리 (토스트 메시지 등)
      alert('웨이포인트 생성에 실패했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  // 페이지 로드 시 웨이포인트 목록 조회
  useEffect(() => {
    fetchWaypoints();
  }, []);

  const plusIcon = <PlusIcon width={12} height={12} className="text-brand-500" />;

  return (
    <div className="w-full h-screen bg-white flex flex-col">
      {/* Header */}
            <Header title="웨이포인트" showBackButton={false} />

            {/* Main Content */}
      <div className="flex-1 px-5 pt-6 bg-white flex flex-col min-h-0">
        {/* Main Title */}
        <div className="relative mb-8 flex-shrink-0">
          <h1 className="text-[#333333] text-2xl font-gowun font-normal leading-[39.2px]">
            우리의<br />
            웨이포인트 {waypointCount}
          </h1>
          
          {/* Cat Image Container */}
          <div className="absolute right-0 top-0 w-[134px] h-[105px]">
            <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-500 text-sm">고양이 이미지</span>
            </div>
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
              <div key={waypoint.id} className="w-full p-4 bg-[#F9F9F9] border border-[#EEEEEE] rounded-lg">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="text-[#333333] text-base font-gowun font-normal leading-[22.4px] mb-1">
                      {waypoint.name}
                    </h3>
                    <p className="text-[#767676] text-sm font-gowun font-normal leading-[19.6px]">
                      보관중인 장소 {waypoint.placeCount}
                    </p>
                  </div>
                  <div className="w-5 h-5 flex items-center justify-center">
                    <div className="flex gap-1">
                    <Image
                      src="/images/common/menu.svg"
                      alt="Menu"
                      width={16}
                      height={16}
                    />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {/* 푸터 높이만큼 여백 */}
          <div className="h-14" />
        </div>
      </div>

      {/* Footer */}
            <Footer />

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
                <h3 className="text-[#333333] text-xl font-gowun font-bold leading-7">
                  웨이포인트 추가하기
                </h3>
                <span className="text-[#767676] text-sm font-gowun font-normal leading-[19.6px]">
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
