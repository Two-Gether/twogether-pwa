"use client";

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/ui/Header';
import Button from '@/components/ui/Button';
import Image from 'next/image';
import Input from '@/components/ui/Input';
import DatePicker from '@/components/ui/DatePicker';
import Notification from '@/components/ui/Notification';
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
  stickerListResponse?: {
    stickerResponses: Array<{
      id: number;
      imageUrl: string;
      main: boolean;
    }>;
  };
  waypointItemTop3ListResponse?: {
    items: Array<{
      id: number;
      name: string;
      address: string;
      imageUrl?: string;
      memo?: string;
      itemOrder: number;
    }>;
  };
}

function CalendarDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');
  const diaryIdParam = searchParams.get('diaryId');
  const startParam = searchParams.get('start');
  const endParam = searchParams.get('end');

  const [isLoading, setIsLoading] = useState(false);
  const [detail, setDetail] = useState<DiaryDetailItem | null>(null);
  const [isLoadingWaypointItems, setIsLoadingWaypointItems] = useState(false);
  const [selectedWaypointItems, setSelectedWaypointItems] = useState<WaypointItem[]>([]);
  const [itemImageUrls, setItemImageUrls] = useState<Record<number, string>>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<{ title: string; startDate: string; endDate: string; memo: string }>({
    title: '',
    startDate: '',
    endDate: '',
    memo: '',
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 1500);
  };

  // 삭제 핸들러
  const handleDelete = async () => {
    try {
      const id = diaryIdParam;
      if (!id) return;
      const res = await apiWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL}/diary/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`삭제 실패 (${res.status}) ${body}`);
      }
      showToast('success', '일정을 삭제했어요.');
      setTimeout(() => router.replace('/calendar'), 1200);
    } catch (e) {
      console.error('일정 삭제 실패:', e);
      showToast('error', '일정 삭제에 실패했습니다.');
    }
  };

  // 수정 완료 → PATCH
  const handlePatch = async () => {
    try {
      const id = diaryIdParam;
      if (!id) return;
      // 빈 문자열은 null로, undefined는 제외하여 전송 (nullable 안전)
      const rawPayload = {
        title: editForm.title,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        memo: editForm.memo,
      } as Record<string, string | null | undefined>;

      const payload: Record<string, unknown> = {};
      Object.entries(rawPayload).forEach(([k, v]) => {
        if (v === undefined) return;
        if (typeof v === 'string') {
          const vv = v.trim();
          // 서버가 null 허용 시 빈 값은 null, 아니면 제외하고 싶으면 여기를 변경
          payload[k] = vv === '' ? null : vv;
        } else {
          payload[k] = v;
        }
      });

      // 디버그용: 최종 PATCH 페이로드 확인
      console.log('[DIARY PATCH PAYLOAD]', payload);
      const res = await apiWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL}/diary/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('[DIARY PATCH ERROR]', res.status, text);
        throw new Error(`수정 실패 (${res.status}) ${text}`);
      }
      const updated = await res.json().catch(() => null);
      if (updated) setDetail(updated as DiaryDetailItem);
      else setDetail((prev) => (prev ? { ...prev, ...payload } : prev));
      setIsEditing(false);
      showToast('success', '일정을 수정했어요.');
    } catch (e) {
      console.error('일정 수정 실패:', e);
      showToast('error', '일정 수정에 실패했습니다.');
    }
  };

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
      // diaryId로 단건 상세 조회 우선
      if (diaryIdParam) {
        try {
          setIsLoading(true);
          const res = await apiWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL}/diary/${diaryIdParam}`, {
            method: 'GET',
          });
          if (!res.ok) throw new Error('일정 상세 조회 실패');
          const data = await res.json();
          setDetail(data as DiaryDetailItem);
          setEditForm({
            title: (data.title || '') as string,
            startDate: (data.startDate || '') as string,
            endDate: (data.endDate || '') as string,
            memo: (data.memo || '') as string,
          });
          return;
        } catch (e) {
          console.error(e);
          setDetail(null);
          return;
        } finally {
          setIsLoading(false);
        }
      }

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

        const selectedDetail = candidates[0] ?? null;

        setDetail(selectedDetail);
        if (selectedDetail) {
          setEditForm({
            title: selectedDetail.title || '',
            startDate: selectedDetail.startDate || '',
            endDate: selectedDetail.endDate || '',
            memo: selectedDetail.memo || '',
          });
        }
      } catch (e) {
        console.error(e);
        setDetail(null);
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [dateParam, startParam, endParam, diaryIdParam, router]);

  // 상세 정보 결정 후: 응답 내 waypointItemTop3ListResponse 사용
  useEffect(() => {
    const itemsFromDetail = detail?.waypointItemTop3ListResponse?.items || [];
    if (!detail) {
      setSelectedWaypointItems([]);
      setItemImageUrls({});
      return;
    }
    
    setIsLoadingWaypointItems(true);
    
    // 목록 매핑 (WaypointItem 타입에 맞춤)
    const mapped: WaypointItem[] = itemsFromDetail.map((it) => ({
      itemId: it.id,
      name: it.name,
      imageUrl: it.imageUrl || '',
      address: it.address,
      memo: it.memo || '',
      order: it.itemOrder,
    }));
    setSelectedWaypointItems(mapped);
    
    // 이미지 매핑(응답 imageUrl 우선, 없으면 구글 플레이스 보조)
    const doImages = async () => {
      const entries = await Promise.all(
        mapped.map(async (m) => {
          if (m.imageUrl) {
            return [m.itemId, m.imageUrl] as const;
          }
          try {
            const url = await getPlaceImageUrl(m.name);
            return [m.itemId, url || '/images/illust/cats/backgroundCat.png'] as const;
          } catch {
            return [m.itemId, '/images/illust/cats/backgroundCat.png'] as const;
          }
        })
      );
      const map: Record<number, string> = {};
      entries.forEach(([id, url]) => (map[id] = url));
      setItemImageUrls(map);
      setIsLoadingWaypointItems(false);
    };
    void doImages();
  }, [detail]);

  return (
    <div className="w-full min-h-screen relative bg-white overflow-hidden">
      {toast && (
        <div className="fixed top-4 left-0 right-0 z-50 p-4">
          <Notification type={toast.type} onClose={() => setToast(null)}>
            {toast.message}
          </Notification>
        </div>
      )}
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
                variant={isEditing ? 'placeholder' : 'disabled'}
                value={isEditing ? editForm.title : (detail.title || '-')}
                readOnly={!isEditing}
                onChange={(e) => isEditing && setEditForm((f) => ({ ...f, title: e.target.value }))}
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
                  {isEditing ? (
                    <DatePicker value={editForm.startDate} onChange={(v) => setEditForm(f => ({ ...f, startDate: v }))} />
                  ) : (
                    <Input
                      type="text"
                      variant="disabled"
                      value={new Date(detail.startDate)
                        .toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' })
                        .replace(/\.\s*/g, '/')
                        .replace(/\/\s*\(/, ' (')}
                      readOnly
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-7">
                <span className="w-7 text-gray-700 text-sm">종료</span>
                <div className="flex-1">
                  {isEditing ? (
                    <DatePicker value={editForm.endDate} onChange={(v) => setEditForm(f => ({ ...f, endDate: v }))} />
                  ) : (
                    <Input
                      type="text"
                      variant="disabled"
                      value={new Date(detail.endDate)
                        .toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' })
                        .replace(/\.\s*/g, '/')
                        .replace(/\/\s*\(/, ' (')}
                      readOnly
                    />
                  )}
                </div>
              </div>
            </div>

            {/* 대표 스티커 */}
            <div className="flex flex-col gap-3">
              <span className="text-gray-700 text-base font-pretendard font-semibold leading-[19.2px]">대표 스티커</span>
              <div style={{width: '100px', height: '100px', background: '#F9F9F9', borderRadius: 8, border: '1px #EEEEEE solid'}} />
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

            {/* 메모 */}
            <div className="flex flex-col gap-3">
              <span className="text-gray-700 text-base font-pretendard font-semibold leading-[19.2px]">메모</span>
              <Input
                type="text"
                variant={isEditing ? 'textarea' : 'textareaDisabled'}
                value={isEditing ? editForm.memo : (detail.memo || '메모가 없습니다.')}
                readOnly={!isEditing}
                rows={4}
                onChange={(e) => isEditing && setEditForm((f) => ({ ...f, memo: e.target.value }))}
              />
            </div>
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      {isEditing ? (
        <div className="absolute bottom-5 left-5 right-5">
          <Button kind="functional" styleType="fill" tone="brand" fullWidth onClick={handlePatch}>
            수정 완료
          </Button>
        </div>
      ) : (
        <div className="absolute bottom-5 left-5 right-5 grid grid-cols-[132px,1fr] gap-3 items-stretch">
          <Button kind="functional" styleType="outline" tone="gray" fullWidth onClick={() => setShowDeleteModal(true)}>
            삭제하기
          </Button>
          <Button kind="functional" styleType="fill" tone="brand" fullWidth onClick={() => setIsEditing(true)}>
            일정 수정하기
          </Button>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-5">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-lg" style={{ boxShadow: '2px 4px 8px rgba(0, 0, 0, 0.08)' }}>
            <div className="flex flex-col items-center gap-8">
              <div className="w-full flex flex-col items-center gap-4">
                <div className="text-center text-gray-800 text-xl font-pretendard font-semibold leading-6">
                  일정을 삭제하시겠어요?
                </div>
                <div className="text-center text-gray-500 text-sm font-pretendard font-normal leading-5">
                  삭제하면 복구할 수 없습니다.
                </div>
              </div>
              <div className="w-full flex items-center gap-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="w-24 py-4 bg-gray-200 rounded-lg flex justify-center items-center"
                >
                  <span className="text-center text-gray-700 text-sm font-pretendard font-normal leading-5">닫기</span>
                </button>
                <button
                  onClick={() => { setShowDeleteModal(false); void handleDelete(); }}
                  className="flex-1 py-4 bg-brand-500 rounded-lg flex justify-center items-center"
                >
                  <span className="text-center text-white text-sm font-pretendard font-semibold leading-5">삭제</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CalendarDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">로딩중...</div>}>
      <CalendarDetailContent />
    </Suspense>
  );
}


