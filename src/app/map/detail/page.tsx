"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/ui/Header';
import { PlaceSearchResult } from '@/types/map';
import { getPlaceImageUrl } from '@/utils/googlePlacesApi';

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
  const [placeDetail, setPlaceDetail] = useState<PlaceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [kakaoApiResponse, setKakaoApiResponse] = useState<PlaceSearchResult | null>(null);
  const [placeImageUrl, setPlaceImageUrl] = useState<string>('');

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
          console.error('❌ 카카오맵 서비스가 로드되지 않았습니다.');
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
                console.log('일치하는 장소 찾음:', placeData);
                console.log('  - 전체 객체:', JSON.stringify(placeData, null, 2));

                setKakaoApiResponse(placeData);
                resolve(placeData);
              } else {
                const firstPlace = result[0] as PlaceSearchResult;
                setKakaoApiResponse(firstPlace);
                resolve(firstPlace);
              }
            } else {
              console.error('카카오맵 API 검색 실패:', status);
              reject(new Error(`API 검색 실패: ${status}`));
            }
          });
        });
      } catch (error) {
        console.error('카카오맵 API 호출 중 오류:', error);
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
        fetchPlaceDetailFromKakao(placeId).catch(error => {
          console.error('카카오맵 API 호출 실패:', error);
        });
      } else {
        console.log('카카오맵 서비스 로딩 대기 중...');
        const checkKakaoServices = () => {
          if (window.kakao && window.kakao.maps.services) {
            fetchPlaceDetailFromKakao(placeId).catch(error => {
              console.error('카카오맵 API 호출 실패:', error);
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
        }).catch(error => {
          console.error('구글 플레이스 이미지 가져오기 실패:', error);
        });
      }
    } else {
      console.log('필수 정보가 없습니다. placeId 또는 placeName이 누락됨');
    }
    setIsLoading(false);
  }, [searchParams]);

  // 카카오맵 열기 함수
  const handleKakaoMapOpen = (placeUrl: string) => {
    window.open(placeUrl, '_blank');
  };

  // 웨이포인트 저장 핸들러
  const handleSaveWaypoint = () => {
    // 웨이포인트 지정 기능은 메인 맵 페이지에서 처리
    alert('웨이포인트 지정은 메인 맵에서 가능합니다.');
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
            {/* <div className="px-2 py-1 bg-[#F9F9F9] rounded text-[#333333] text-sm font-normal flex items-center gap-1">
              <span>32명이 재방문 의사를 표했어요</span>
              <div className="w-3 h-3">
                <div className="w-full h-full border border-[#333333] rounded-sm" />
              </div>
            </div> */}
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

          {/* 하단 여백 - 남은 공간 채우기 */}
          <div className="flex-1 bg-gray-100" />
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 4px;
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
    </div>
  );
}

export default function DetailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DetailPageContent />
    </Suspense>
  );
}
