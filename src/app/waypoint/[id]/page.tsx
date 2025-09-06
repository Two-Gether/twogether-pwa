"use client";

import Header from '@/components/ui/Header';
import Footer from '@/components/Footer';
import { useState, useEffect } from 'react';
import { Waypoint } from '@/types/waypoint';
import { useParams } from 'next/navigation';
import { getAuthToken } from '@/auth';

export default function WaypointDetailPage() {
  const params = useParams();
  const waypointId = params.id as string;
  
  const [waypoint, setWaypoint] = useState<Waypoint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 웨이포인트 상세 정보 조회
  const fetchWaypointDetail = async (id: string): Promise<Waypoint> => {
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
        setWaypoint(data);
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

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-white flex flex-col">
        <Header title="웨이포인트 상세" showBackButton={true} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">로딩 중...</div>
        </div>
        <Footer />
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
        <Footer />
      </div>
    );
  }

  if (!waypoint) {
    return (
      <div className="w-full h-screen bg-white flex flex-col">
        <Header title="웨이포인트 상세" showBackButton={true} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">웨이포인트를 찾을 수 없습니다</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <Header title={waypoint.name} showBackButton={true} />

      {/* Main Content */}
      <div className="flex-1 px-5 pt-6 bg-gray-100 flex flex-col min-h-0">
        {/* 웨이포인트 정보 */}
        <div className="mb-8">
          <h1 className="text-gray-700 text-2xl font-pretendard font-normal leading-[39.2px] mb-4">
            {waypoint.name}
          </h1>
          
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
            <div className="text-gray-500 text-sm font-pretendard font-normal leading-[19.6px]">
              보관중인 장소 {waypoint.itemCount}개
            </div>
          </div>
        </div>

        {/* 장소 목록 (추후 구현) */}
        <div className="flex-1">
          <div className="text-center text-gray-500 py-20">
            <div className="mb-2">장소 목록 기능은 준비 중입니다</div>
            <div className="text-sm">곧 만나보실 수 있어요!</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
