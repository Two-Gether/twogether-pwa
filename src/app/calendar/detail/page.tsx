"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/ui/Header';
import Image from 'next/image';
import Input from '@/components/ui/Input';
import { WaypointItem } from '@/types/waypoint';
import { getPlaceImageUrl } from '@/utils/googlePlacesApi';
import { apiWithAuth } from '@/hooks/auth/useAuth';

interface DiaryDetailItem {
  title: string;
  startDate: string;
  endDate: string;
  memo?: string | null;
  mainStickerUrl?: string | null;
  waypointId?: number | null;
}

export default function CalendarDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date'); // YYYY-MM-DD
  const startParam = searchParams.get('start');
  const endParam = searchParams.get('end');

  const [isLoading, setIsLoading] = useState(false);
  const [detail, setDetail] = useState<DiaryDetailItem | null>(null);
  const [isLoadingWaypointItems, setIsLoadingWaypointItems] = useState(false);
  const [selectedWaypointItems, setSelectedWaypointItems] = useState<WaypointItem[]>([]);
  const [itemImageUrls, setItemImageUrls] = useState<Record<number, string>>({});

  // 헤더 날짜 포맷
  const headerTitle = useMemo(() => {
    if (!dateParam) return '';
    const d = new Date(dateParam);
    if (isNaN(d.getTime())) return '';
    const yy = String(d.getFullYear()).slice(-2);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const week = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
    return `${yy}년 ${m}월 ${day}일 (${week})`;
  }, [dateParam]);

  // 안전한 로컬 Date 변환
  const toLocalDate = (dateStr: string) => {
    const [y, m, d] = (dateStr || '').split('-').map((v) => parseInt(v, 10));
    return new Date(y, (m || 1) - 1, d || 1);
  };

  useEffect(() => {
    const run = async () => {
      if (!dateParam) {
        router.replace('/calendar');
        return;
      }
      try {
        setIsLoading(true);

        const target = toLocalDate(dateParam);
        const monthStart = new Date(target.getFullYear(), target.getMonth(), 1);
        const monthEnd = new Date(target.getFullYear(), target.getMonth() + 1, 0);
        const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        // 한 달 범위로 가져와서 프론트에서 포함 여부 판단
        const res = await apiWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL}/diary?startDate=${fmt(monthStart)}&endDate=${fmt(monthEnd)}`, {
          method: 'GET',
        });
        if (res.status === 404) {
          setDetail(null);
          return;
        }
        if (!res.ok) throw new Error('일정 조회 실패');
        const data = await res.json();
        const list: DiaryDetailItem[] = Array.isArray(data.diaryMonthOverviewResponses) ? data.diaryMonthOverviewResponses : [];

        const contains = (item: DiaryDetailItem) => {
          const s = toLocalDate(item.startDate);
          const e = toLocalDate(item.endDate);
          const d0 = new Date(target.getFullYear(), target.getMonth(), target.getDate());
          return d0 >= new Date(s.getFullYear(), s.getMonth(), s.getDate()) && d0 <= new Date(e.getFullYear(), e.getMonth(), e.getDate());
        };

        let candidates = list.filter(contains);

        if (startParam || endParam) {
          const startQ = startParam || dateParam;
          const endQ = endParam || dateParam;
          const exact = candidates.find((d) => d.startDate === startQ && d.endDate === endQ);
          if (exact) candidates = [exact];
        }

        setDetail(candidates[0] ?? null);
      } catch (e) {
        console.error(e);
        setDetail(null);
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [dateParam, startParam, endParam, router]);

  // 상세 정보 결정 후 웨이포인트 아이템 가져오기
  useEffect(() => {
    const fetchWaypointItems = async (waypointId: number) => {
      try {
        setIsLoadingWaypointItems(true);
        const response = await apiWithAuth(`/api/waypoint/${waypointId}`, {
          method: 'GET',
        });
        if (!response.ok) return;
        const data = await response.json();
        const items: WaypointItem[] = data.waypointInfoResponse || [];
        setSelectedWaypointItems(items);

        // 구글 이미지 URL 가져오기 (최소 지연)
        if (items.length > 0) {
          const imagePromises = items.map(async (item) => {
            try {
              const imageUrl = await getPlaceImageUrl(item.name);
              return { itemId: item.itemId, imageUrl };
            } catch {
              return { itemId: item.itemId, imageUrl: '' };
            }
          });
          const results = await Promise.all(imagePromises);
          const map: Record<number, string> = {};
          results.forEach(({ itemId, imageUrl }) => {
            map[itemId] = imageUrl || '/images/illust/cats/backgroundCat.png';
          });
          setItemImageUrls(map);
        }
      } finally {
        setIsLoadingWaypointItems(false);
      }
    };

    if (detail?.waypointId) {
      fetchWaypointItems(detail.waypointId);
    } else {
      setSelectedWaypointItems([]);
    }
  }, [detail?.waypointId]);

  return (
    <div className="w-full min-h-screen relative bg-white overflow-hidden">
      {/* Header */}
      <Header title={headerTitle || '일정 상세'} showBackButton={true} />

      <div className="flex-1 px-6 py-6 mb-24">
        {isLoading ? (
          <div className="py-10 text-center text-gray-500">불러오는 중...</div>
        ) : !detail ? (
          <div className="py-10 text-center text-gray-500">해당 날짜의 일정이 없습니다.</div>
        ) : (
          <div className="flex flex-col gap-10">
            {/* 제목 */}
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-1">
                <span className="text-gray-700 text-base font-pretendard font-semibold leading-[19.2px]">제목</span>
              </div>
              <Input
                type="text"
                variant="disabled"
                value={detail.title || '-'}
                readOnly
              />
            </div>

            {/* 기간 */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-1">
                <span className="text-gray-700 text-base font-pretendard font-semibold leading-[19.2px]">기간</span>
                <span className="text-brand-500 text-base font-pretendard font-semibold leading-[19.2px]">*</span>
              </div>

              <div className="flex items-center gap-7">
                <span className="w-7 text-gray-700 text-sm">시작</span>
                <div className="flex-1">
                  <Input
                    type="text"
                    variant="disabled"
                    value={new Date(detail.startDate).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' }).replace(/\./g, '/').replace(/\s/g, '')}
                    readOnly
                  />
                </div>
              </div>

              <div className="flex items-center gap-7">
                <span className="w-7 text-gray-700 text-sm">종료</span>
                <div className="flex-1">
                  <Input
                    type="text"
                    variant="disabled"
                    value={new Date(detail.endDate).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' }).replace(/\./g, '/').replace(/\s/g, '')}
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* 대표 스티커 */}
            <div className="flex flex-col gap-3">
              <span className="text-gray-700 text-base font-pretendard font-semibold leading-[19.2px]">대표 스티커</span>
              <div style={{width: '100px', height: '100px', background: '#F9F9F9', borderRadius: 8, border: '1px #EEEEEE solid'}} />
            </div>

            {/* 일정 */}
            <div className="flex flex-col gap-3">
              <span className="text-gray-700 text-base font-pretendard font-semibold leading-[19.2px]">일정</span>
            </div>

            {/* 메모 */}
            <div className="flex flex-col gap-3">
              <span className="text-gray-700 text-base font-pretendard font-semibold leading-[19.2px]">메모</span>
              <Input
                type="text"
                variant="textareaDisabled"
                value={detail.memo || '메모가 없습니다.'}
                readOnly
                rows={4}
              />
            </div>

            {/* 일정(웨이포인트) */}
            <div className="flex flex-col gap-3">
              <span className="text-gray-700 text-base font-pretendard font-semibold leading-[19.2px]">일정</span>
              {isLoadingWaypointItems ? (
                <div className="py-2 text-gray-500 text-sm">장소를 불러오는 중...</div>
              ) : selectedWaypointItems.length > 0 ? (
                <div className="flex flex-col">
                  {selectedWaypointItems.map((item) => (
                    <div key={item.itemId} className="py-3 flex items-start gap-3 border-b border-gray-200 last:border-b-0">
                      {/* 이미지 */}
                      {itemImageUrls[item.itemId] ? (
                        <div className="w-[75px] h-[75px] rounded-lg border border-gray-200 overflow-hidden flex-shrink-0">
                          <Image src={itemImageUrls[item.itemId]} alt={item.name} width={75} height={75} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-[75px] h-[75px] bg-gray-200 rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-500 text-xs">이미지</span>
                        </div>
                      )}
                      {/* 텍스트 */}
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="text-gray-700 text-base font-pretendard font-normal leading-[22.4px]">{item.name}</div>
                        <div className="w-full text-[#767676] text-xs font-pretendard font-normal break-words">{item.address}</div>
                        {item.memo && (
                          <div className="flex items-center mt-2">
                            <span className="text-gray-500 text-sm font-pretendard">메모</span>
                            <span className="text-gray-500 text-sm font-pretendard mx-1">ㅣ</span>
                            <span className="text-gray-700 text-sm font-pretendard">{item.memo}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-2 text-gray-500 text-sm">등록된 장소가 없습니다.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="absolute bottom-5 left-5 right-5 flex gap-3">
        <button 
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-4 bg-gray-100 rounded-lg flex items-center justify-center"
        >
          <span className="text-gray-700 text-sm font-pretendard">삭제하기</span>
        </button>
        <button 
          type="button"
          onClick={() => router.push('/calendar/create')}
          className="flex-1 py-4 bg-brand-500 rounded-lg flex items-center justify-center"
        >
          <span className="text-white text-sm font-pretendard font-semibold">일정 수정하기</span>
        </button>
      </div>
    </div>
  );
}


