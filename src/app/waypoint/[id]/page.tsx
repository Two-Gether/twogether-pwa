"use client";

import Header from '@/components/ui/Header';
import Footer from '@/components/Footer';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Waypoint } from '@/types/waypoint';
import { useParams } from 'next/navigation';
import { getAuthToken } from '@/auth';

// 장소 데이터 타입 정의
interface WaypointItem {
  itemId: number;
  name: string;
  imageUrl: string;
  memo?: string;
  order: number;
}

interface WaypointDetailResponse {
  waypointName: string;
  waypointInfoResponse: WaypointItem[];
}

export default function WaypointDetailPage() {
  const params = useParams();
  const waypointId = params.id as string;
  
  const [waypointData, setWaypointData] = useState<WaypointDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (!waypointData) {
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
              <div className="w-5 h-5 bg-white rounded-full border border-gray-300" />
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
                width={16}
                height={16}
              />
            </div>
          </div>

          {/* 장소 목록 */}
          <div className="flex-1 flex flex-col">
            {waypointData.waypointInfoResponse.map((item) => (
              <div key={item.itemId} className="w-full px-6 py-3 bg-white flex items-center gap-2">
                {/* 체크박스 */}
                <div className="w-5 h-5 bg-white rounded-full border border-gray-300" />
                
                {/* 장소 정보 컨테이너 */}
                <div className="flex-1 flex items-start">
                  {/* 장소 이미지들 */}
                  <img 
                    src={item.imageUrl || '/images/placeholder.png'} 
                    alt={item.name}
                    width={75}
                    height={75}
                    className="rounded-lg border border-gray-200"
                  />
                  <div className="w-[13.04px] h-[13.04px] rounded-lg" />
                  
                  {/* 장소 텍스트 정보 */}
                  <div className="flex-1 flex flex-col gap-4">
                    {/* 장소명 */}
                    <div className="flex flex-col">
                      <div className="text-gray-700 text-base font-pretendard font-normal leading-[22.4px]">
                        {item.name}
                      </div>
                    </div>
                    
                    {/* 메모 (조건부 렌더링) */}
                    {item.memo && (
                      <div className="flex items-center">
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
      <div className="absolute bottom-20 left-5 right-5 flex gap-3">
        <button className="flex-1 py-4 bg-gray-100 rounded-lg shadow-[2px_4px_8px_rgba(0,0,0,0.08)] flex items-center justify-center">
          <span className="text-gray-700 text-sm font-pretendard font-normal leading-[19.6px]">뒤로가기</span>
        </button>
        <button className="flex-1 py-4 bg-brand-500 rounded-lg shadow-[2px_4px_8px_rgba(0,0,0,0.08)] flex items-center justify-center">
          <span className="text-white text-sm font-pretendard font-semibold leading-[19.6px]">장소 추가하기</span>
        </button>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
