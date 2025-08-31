"use client";

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/ui/Header';

interface PlaceDetail {
  place_name: string;
  address_name: string;
  road_address_name: string;
  phone: string;
  place_url: string;
  category_name: string;
  isOpen?: boolean;
}

// 카카오맵 API 응답 타입
interface KakaoMapApiResponse {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string;
  phone: string;
  place_url: string;
  category_name: string;
  category_group_code: string;
  category_group_name: string;
  distance: string;
  x: string;
  y: string;
  [key: string]: unknown; // 추가 속성들을 위한 인덱스 시그니처
}

export default function DetailPage() {
  const searchParams = useSearchParams();
  const [placeDetail, setPlaceDetail] = useState<PlaceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [kakaoApiResponse, setKakaoApiResponse] = useState<KakaoMapApiResponse | null>(null);

  useEffect(() => {
    const placeId = searchParams.get('id');
    const placeName = searchParams.get('name');
    const address = searchParams.get('address');
    const phone = searchParams.get('phone');
    const placeUrl = searchParams.get('placeUrl');
    const category = searchParams.get('category');
    const x = searchParams.get('x');
    const y = searchParams.get('y');

    console.log('🔍 Detail 페이지 - 실제 받아온 장소 정보:');
    console.log('📍 placeId:', placeId);
    console.log('📍 placeName:', placeName);
    console.log('📍 address:', address);
    console.log('📍 phone:', phone);
    console.log('📍 placeUrl:', placeUrl);
    console.log('📍 category:', category);
    console.log('📍 x (경도):', x);
    console.log('📍 y (위도):', y);
    console.log('📍 전체 searchParams:', Object.fromEntries(searchParams.entries()));

    // 카카오맵 API로 장소 상세 정보 가져오기
    const fetchPlaceDetailFromKakao = async (placeId: string) => {
      try {
        console.log('🔍 카카오맵 API 호출 시작 - placeId:', placeId);
        
        // 카카오맵 API 키워드 검색으로 장소 정보 가져오기
        if (!window.kakao || !window.kakao.maps.services) {
          console.error('❌ 카카오맵 서비스가 로드되지 않았습니다.');
          return;
        }

        return new Promise<KakaoMapApiResponse>((resolve, reject) => {
          const places = new window.kakao.maps.services.Places();
          
          // placeId로 장소 검색 (실제로는 place_name으로 검색)
          const placeName = searchParams.get('name');
          if (!placeName) {
            reject(new Error('장소명이 없습니다.'));
            return;
          }

          places.keywordSearch(placeName, (result: unknown[], status: string) => {
            console.log('🗺️ 카카오맵 API 응답:');
            console.log('📍 status:', status);
            console.log('📍 result:', result);
            
            if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
              // placeId와 일치하는 결과 찾기
              const matchedPlace = result.find(place => (place as KakaoMapApiResponse).id === placeId);
              if (matchedPlace) {
                const placeData = matchedPlace as KakaoMapApiResponse;
                console.log('✅ 일치하는 장소 찾음:', placeData);
                console.log('📍 전체 API 응답 데이터 (상세):');
                console.log('  - id:', placeData.id);
                console.log('  - place_name:', placeData.place_name);
                console.log('  - address_name:', placeData.address_name);
                console.log('  - road_address_name:', placeData.road_address_name);
                console.log('  - phone:', placeData.phone);
                console.log('  - place_url:', placeData.place_url);
                console.log('  - category_name:', placeData.category_name);
                console.log('  - category_group_code:', placeData.category_group_code);
                console.log('  - category_group_name:', placeData.category_group_name);
                console.log('  - distance:', placeData.distance);
                console.log('  - x (경도):', placeData.x);
                console.log('  - y (위도):', placeData.y);
                console.log('  - 모든 속성:', Object.keys(placeData));
                console.log('  - 전체 객체:', JSON.stringify(placeData, null, 2));
                
                setKakaoApiResponse(placeData);
                resolve(placeData);
              } else {
                const firstPlace = result[0] as KakaoMapApiResponse;
                console.log('⚠️ placeId와 일치하는 장소를 찾을 수 없음. 첫 번째 결과 사용:', firstPlace);
                console.log('📍 첫 번째 결과 상세 데이터:');
                console.log('  - id:', firstPlace.id);
                console.log('  - place_name:', firstPlace.place_name);
                console.log('  - phone:', firstPlace.phone);
                console.log('  - place_url:', firstPlace.place_url);
                console.log('  - 전체 객체:', JSON.stringify(firstPlace, null, 2));
                
                setKakaoApiResponse(firstPlace);
                resolve(firstPlace);
              }
            } else {
              console.error('❌ 카카오맵 API 검색 실패:', status);
              reject(new Error(`API 검색 실패: ${status}`));
            }
          });
        });
      } catch (error) {
        console.error('❌ 카카오맵 API 호출 중 오류:', error);
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
        isOpen: Math.random() > 0.5 // 임시로 랜덤하게 영업 상태 설정
      };
      
      console.log('✅ 실제 설정된 placeDetail:', placeDetailData);
      setPlaceDetail(placeDetailData);

      // 카카오맵 API로 상세 정보 가져오기
      if (window.kakao && window.kakao.maps.services) {
        fetchPlaceDetailFromKakao(placeId).catch(error => {
          console.error('❌ 카카오맵 API 호출 실패:', error);
        });
      } else {
        console.log('⏳ 카카오맵 서비스 로딩 대기 중...');
        const checkKakaoServices = () => {
          if (window.kakao && window.kakao.maps.services) {
            fetchPlaceDetailFromKakao(placeId).catch(error => {
              console.error('❌ 카카오맵 API 호출 실패:', error);
            });
          } else {
            setTimeout(checkKakaoServices, 100);
          }
        };
        checkKakaoServices();
      }
    } else {
      console.log('❌ 필수 정보가 없습니다. placeId 또는 placeName이 누락됨');
    }
    setIsLoading(false);
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="w-full h-full bg-white">
        <Header title="장소 상세" />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (!placeDetail) {
    return (
      <div className="w-full h-full bg-white">
        <Header title="장소 상세" />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">장소 정보를 찾을 수 없습니다.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white relative overflow-hidden">
      {/* Header */}
      <Header title="지도" />
      
      {/* 장소 이미지 영역 */}
      <div className="w-full h-[200px] bg-[#F9F9F9] flex items-center justify-center">
        <div className="w-24 h-24 bg-gray-300 rounded-lg flex items-center justify-center">
          <span className="text-gray-500 text-sm">이미지</span>
        </div>
      </div>

      {/* 장소 정보 */}
      <div className="px-5 pt-6">
        {/* 영업 상태 및 재방문 정보 */}
        <div className="flex items-center gap-3 mb-4">
          {placeDetail.isOpen !== undefined && (
            <div className="px-2 py-1 bg-[#F4FBF4] rounded text-[#539C58] text-sm font-normal">
              {placeDetail.isOpen ? '영업중' : '영업종료'}
            </div>
          )}
          <div className="px-2 py-1 bg-[#F9F9F9] rounded text-[#333333] text-sm font-normal flex items-center gap-1">
            <span>32명이 재방문 의사를 표했어요</span>
            <div className="w-3 h-3">
              <div className="w-full h-full border border-[#333333] rounded-sm" />
            </div>
          </div>
        </div>

        {/* 장소명 */}
        <h1 className="text-[#333333] text-2xl font-semibold leading-[28.8px] mb-2">
          {placeDetail.place_name}
        </h1>

        {/* 주소 */}
        <p className="text-[#767676] text-sm font-normal leading-[19.6px] mb-6">
          {placeDetail.road_address_name || placeDetail.address_name}
        </p>

        {/* 전화번호 */}
        {placeDetail.phone && (
          <p className="text-[#333333] text-sm font-normal leading-[19.6px] mb-6">
            📞 {placeDetail.phone}
          </p>
        )}

        {/* 웨이포인트 지정 버튼 */}
        <div className="flex items-center gap-4 mb-8">
          <button className="flex-1 py-4 bg-white border border-[#CCCCCC] rounded-lg text-[#333333] text-sm font-normal">
            웨이포인트 지정
          </button>
          <div className="w-13 h-13 bg-[#F9F9F9] rounded-lg flex items-center justify-center">
            <div className="w-4 h-4">
              <div className="w-full h-full border border-[#333333] rounded-sm" />
            </div>
          </div>
        </div>

        {/* 하이라이트 섹션 */}
        <h2 className="text-[#333333] text-xl font-semibold leading-6 mb-4">
          하이라이트
        </h2>

        {/* 하이라이트 이미지들 */}
        <div className="flex gap-4 overflow-x-auto scroll-hidden pb-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="w-[123px] h-[164px] relative flex-shrink-0">
              <div className="w-full h-full bg-gray-300 rounded-lg" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70 rounded-lg" />
              <div className="absolute inset-3 flex flex-col justify-between">
                <div className="text-white text-xs font-normal leading-[16.8px]">
                  {item + 5}시간 전
                </div>
                <div className="text-white text-sm font-normal leading-[19.6px]">
                  한 줄 소개를 표시하면 됩니다.
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
