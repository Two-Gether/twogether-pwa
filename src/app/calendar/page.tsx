"use client";

import { useState, useMemo, useRef, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';
import Header from '@/components/ui/Header';
import PlusIcon from '@/components/icons/PlusIcon';
import { apiWithAuth } from '@/hooks/auth/useAuth';
import Image from 'next/image';

// 일정 데이터 타입 정의
interface DiarySchedule {
  title: string;
  startDate: string;
  endDate: string;
  mainStickerUrl?: string;
}

const CalendarScreen = () => {
    const router = useRouter();
    const [selectedDate, setSelectedDate] = useState<number | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const touchStartYRef = useRef<number | null>(null);
    
    // 일정 데이터 상태
    const [schedules, setSchedules] = useState<DiarySchedule[]>([]);
    const [, setIsLoadingSchedules] = useState(false);
    
    // 모달 상태
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [modalDate, setModalDate] = useState<Date | null>(null);
    const [modalSchedules, setModalSchedules] = useState<DiarySchedule[]>([]);
    
    // 현재 월의 첫째날과 마지막날 계산
    const getCurrentMonthRange = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0); // 다음 달의 0일 = 이번 달의 마지막 날
        
        // 로컬 시간대 기준으로 날짜 문자열 생성
        const formatDate = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        
        return {
            startDate: formatDate(startDate),
            endDate: formatDate(endDate)
        };
    };
    
    // 일정 데이터 불러오기
    const fetchSchedules = async () => {
        try {
            setIsLoadingSchedules(true);
            const { startDate, endDate } = getCurrentMonthRange();
            
            const response = await apiWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL}/diary?startDate=${startDate}&endDate=${endDate}`, {
                method: 'GET',
            });

            if (!response.ok) {
                if (response.status === 404) {
                    // 404는 일정이 없다는 의미로 처리
                    setSchedules([]);
                    return;
                }
                throw new Error('일정 데이터를 불러오는데 실패했습니다.');
            }

            const data = await response.json();
            setSchedules(data.diaryMonthOverviewResponses || []);
        } catch (error) {
            console.error('일정 데이터 로딩 에러:', error);
            setSchedules([]);
        } finally {
            setIsLoadingSchedules(false);
        }
    };
    
    // 현재 날짜 정보
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const currentMonthName = currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
    
    // 현재 달의 첫 번째 날과 마지막 날
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    // 월 ~ 일 머리글에 맞추기 위해 월요일을 0으로 보정
    const firstDayOfWeek = (firstDay.getDay() + 6) % 7;
    
    // 달력에 표시할 날짜들 생성
    const calendarDays = useMemo(() => {
        const days = [];
        
        // 이전 달의 빈 날짜들 (첫 번째 날 이전)
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push(null);
        }
        
        // 현재 달의 날짜들
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }
        
        return days;
    }, [firstDayOfWeek, daysInMonth]);
    
    // 월이 변경될 때마다 일정 불러오기
    useEffect(() => {
        fetchSchedules();
    }, [currentDate]);
    
    // 오늘 날짜
    const today = new Date().getDate();
    const isCurrentMonth = currentDate.getMonth() === new Date().getMonth() && 
                          currentDate.getFullYear() === new Date().getFullYear();
    
    // 월 변경 함수들
    const goToPreviousMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };
    
    const goToNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    // 스와이프/스크롤로 월 변경 (상하 제스처)
    const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
        touchStartYRef.current = e.touches[0].clientY;
    };

    const handleTouchEnd: React.TouchEventHandler<HTMLDivElement> = (e) => {
        const startY = touchStartYRef.current;
        const endY = e.changedTouches[0].clientY;
        if (startY == null) return;
        const diffY = endY - startY; // 양수: 아래로 스와이프, 음수: 위로 스와이프
        const THRESHOLD = 50; // 픽셀 임계값
        if (Math.abs(diffY) >= THRESHOLD) {
            if (diffY > 0) {
                // 아래로 스와이프 → 이전 달
                goToPreviousMonth();
            } else {
                // 위로 스와이프 → 다음 달
                goToNextMonth();
            }
        }
        touchStartYRef.current = null;
    };

    const handleWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
        const THRESHOLD = 20;
        if (Math.abs(e.deltaY) < THRESHOLD) return;
        if (e.deltaY > 0) {
            // 아래로 스크롤 → 다음 달
            goToNextMonth();
        } else {
            // 위로 스크롤 → 이전 달
            goToPreviousMonth();
        }
    };

    // 최초 진입 시 오늘 날짜 기준으로 표시/선택
    useEffect(() => {
        const now = new Date();
        setCurrentDate(now);
        setSelectedDate(now.getDate());
    }, []);
    
    // 문자열(YYYY-MM-DD)을 로컬 날짜로 안전 변환 (TZ 보정)
    const toLocalDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-').map((v) => parseInt(v, 10));
        return new Date(y, (m || 1) - 1, d || 1);
    };

    // 실제 일정 데이터를 이벤트 형태로 변환
    type EventColor = 'text-brand-500'|'text-brand-200'|'text-sub-200';
    type CalEvent = { id:string; title:string; start:Date; end:Date;};
    const events: CalEvent[] = useMemo(()=>{
        return schedules.map((schedule, index) => ({
            id: `schedule-${index}`,
            title: schedule.title,
            start: toLocalDate(schedule.startDate),
            end: toLocalDate(schedule.endDate)
        }));
    },[schedules]);

  // 날짜 키 유틸
  const dateKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  };

  // 하루 최대 3개까지만 캘린더에 표시 (나머지는 모달에서)
  const monthStart = new Date(currentYear, currentMonth, 1);
  const monthEnd = new Date(currentYear, currentMonth + 1, 0);
  const eventsSorted = useMemo(() => [...events].sort((a, b) => b.start.getTime() - a.start.getTime()), [events]);
  const topEventsByDay = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const ev of eventsSorted) {
      const start = new Date(Math.max(ev.start.getTime(), monthStart.getTime()));
      const end = new Date(Math.min(ev.end.getTime(), monthEnd.getTime()));
      const cur = new Date(start);
      while (cur <= end) {
        const key = dateKey(cur);
        if (!map[key]) map[key] = new Set();
        if (map[key].size < 3) {
          map[key].add(ev.id);
        }
        cur.setDate(cur.getDate() + 1);
      }
    }
    return map;
  }, [eventsSorted, currentYear, currentMonth]);
    
    // 날짜별 색상 결정 함수
    const getDateColor = (day: number) => {
        if (isCurrentMonth && day === today) {
            return 'brand';
        }
        return 'default';
    };

    // 해당 날짜가 포함된 이벤트 반환 (없으면 null)
    const getEventForDay = (date: Date): CalEvent | null => {
        const target = dateKey(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
        for (const ev of events) {
            const s0 = new Date(ev.start.getFullYear(), ev.start.getMonth(), ev.start.getDate());
            const e0 = new Date(ev.end.getFullYear(), ev.end.getMonth(), ev.end.getDate());
            const cur = new Date(s0);
            while (cur <= e0) {
                if (dateKey(cur) === target) return ev;
                cur.setDate(cur.getDate() + 1);
            }
        }
        return null;
    };

    // 해당 날짜의 모든 일정 반환
    const getSchedulesForDay = (date: Date): DiarySchedule[] => {
        const targetKey = dateKey(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
        return schedules.filter(schedule => {
            const s = toLocalDate(schedule.startDate);
            const e = toLocalDate(schedule.endDate);
            const cur = new Date(s.getFullYear(), s.getMonth(), s.getDate());
            while (cur <= e) {
                if (dateKey(cur) === targetKey) return true;
                cur.setDate(cur.getDate() + 1);
            }
            return false;
        });
    };

    // 날짜 클릭 핸들러
  const handleDateClick = (day: number) => {
        const clickedDate = new Date(currentYear, currentMonth, day);
        const daySchedules = getSchedulesForDay(clickedDate);
    
    if (daySchedules.length === 1) {
      // 일정이 하나면 상세로 이동 (날짜 파라미터 전달)
      const y = clickedDate.getFullYear();
      const m = String(clickedDate.getMonth() + 1).padStart(2, '0');
      const da = String(clickedDate.getDate()).padStart(2, '0');
      const q = `${y}-${m}-${da}`;
      router.push(`/calendar/detail?date=${q}`);
      return;
    }
    if (daySchedules.length >= 2) {
      // 2개 이상이면 모달 표시 (전체 노출)
      setModalDate(clickedDate);
      setModalSchedules(daySchedules);
      setShowScheduleModal(true);
      return;
    }
    // 일정이 없으면 동작 없음
    };

    const getDerivedEventColor = (ev: CalEvent): EventColor => {
        const now = new Date();
        const n0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const s0 = new Date(ev.start.getFullYear(), ev.start.getMonth(), ev.start.getDate());
        const e0 = new Date(ev.end.getFullYear(), ev.end.getMonth(), ev.end.getDate());
        if (n0 >= s0 && n0 <= e0) return 'text-brand-500';
        if (n0 > e0) return 'text-sub-200';
        return 'text-brand-200';
    };
    return (
        <div className="w-full min-h-screen flex flex-col relative bg-white overflow-hidden">
            {/* Header */}
            <Header title="발자국 일기" showBackButton={true} />

            {/* Calendar Header */}
            <div className="w-full overflow-hidden border-b border-gray-300 flex flex-col mt-4">
                <div className="w-full px-5 py-4 bg-white overflow-hidden flex justify-center items-center">
                    <div className="text-gray-800 text-base font-pretendard font-semibold leading-[19.2px]">
                        {currentMonthName}
                    </div>
                </div>
                <div className="w-full px-5 flex">
                    {['월', '화', '수', '목', '금', '토', '일'].map((day, index) => (
                        <div key={index} className="flex-1 py-2 bg-white flex justify-center items-center">
                            <div className="text-gray-800 text-[10px] font-normal leading-[14px]">
                                {day}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Calendar Grid */}
            <div 
                className="w-full px-5 overflow-hidden relative flex-1"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onWheel={handleWheel}
            >
                {/* 7x6 그리드 구조 */}
                <div className="relative grid grid-cols-7 gap-0 mt-[-1px]
                  [&>*:nth-child(-n+7)]:border-t-0 
                  [&>*:nth-child(n+8)]:border-t 
                  [&>*:nth-child(n+8)]:border-gray-300">
                    {calendarDays.map((day, index) => {
                        if (day === null) {
                            // 빈 날짜 (이전 달의 날짜)
                            return (
                                <div key={`blank-${index}`} className={`h-[120px] flex justify-center items-start`}>
                                    <div className="text-center text-gray-300 text-sm font-pretendard font-normal leading-[19.6px]">
                                        {/* 빈 공간 */}
                                    </div>
                                </div>
                            );
                        }
                        
                        const isSelected = selectedDate === day;
                        const dateColor = getDateColor(day);
                        // Day 셀 내부에서는 숫자만, 바는 주차 오버레이에서 처리
                        
                        if (isCurrentMonth && day === today) {
                            // 특별한 이벤트가 있거나 오늘 날짜
                            
                            return (
                                <div 
                                    key={`day-${day}`} 
                                    className={`relative h-[120px] py-2 flex flex-col justify-between items-center cursor-pointer transition-colors bg-white hover:bg-gray-50`}
                                    onClick={() => handleDateClick(day)}
                                >
                                    <div className="flex flex-col gap-1 items-center w-full">
                                        <div className="w-full flex justify-center">
                                            {(() => {
                                                const ev = getEventForDay(new Date(currentYear,currentMonth,day));
                                                const c = ev ? getDerivedEventColor(ev) : null;
                                                return (
                                                    <div className={`w-full flex justify-center`}>
                                                        <div className="w-7 min-w-7 bg-brand-500 rounded text-white text-center text-sm font-pretendard font-normal leading-[19.6px]">
                                                            {day}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            );
                        } else {
                            // 일반 날짜
                            return (
                                <div 
                                    key={`day-${day}`} 
                                    className={`relative h-[120px] py-2 flex justify-center items-start cursor-pointer transition-colors bg-white hover:bg-gray-50`}
                                    onClick={() => handleDateClick(day)}
                                >
                                    {(() => {
                                        const ev = getEventForDay(new Date(currentYear,currentMonth,day));
                                        const c = ev ? getDerivedEventColor(ev) : null;
                                        return (
                                            <div className={`w-full flex justify-center`}>
                                                <div className={`text-center text-sm font-pretendard font-normal leading-[19.6px] text-gray-800`}>
                                                    {day}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            );
                        }
                    })}
                    {/* 주차 단위 텍스트 오버레이 (가운데 정렬, 오버플로우 방지) - 그리드 내부에 절대 배치 */}
                    <div className="pointer-events-none absolute inset-0 overflow-hidden grid grid-cols-7 auto-rows-[120px] pt-2">
                    {events.map((ev, eventIndex) => {
                        const start = ev.start.getDate();
                        const end = ev.end.getDate();
                        const segments: ReactNode[] = [];
                        let cursor = start;
                        
                        // 각 일정마다 다른 세로 위치
                        const topOffset = 28 + (eventIndex * 26);
                        
                        while (cursor <= end) {
                          const linear = firstDayOfWeek + cursor - 1; // 0-based 전체 인덱스
                            const week = Math.floor(linear / 7) + 1; // 1-based grid row
                            const col = (linear % 7) + 1; // 1-based grid col
                            const maxSpan = 7 - col + 1; // 남은 컬럼 수
                            const remain = end - cursor + 1; // 남은 일수
                            const span = Math.min(maxSpan, remain);
                            const endCol = col + span - 1;
                            // 텍스트 병합 영역 (여유 있으면 가운데, 아니면 왼쪽 정렬로 잘림)
                            const shouldCenter = span >= 3; // 3칸 이상이면 가운데 정렬
                            const derived = getDerivedEventColor(ev);
                            const isPast = derived === 'text-sub-200';
                            const bgColor = isPast ? 'bg-sub-100' : 'bg-brand-100';
                            const borderColor = isPast ? 'border-sub-200' : 'border-brand-200';
                            const textColor = 'text-gray-800';
                          // 하루 최대 3개 제한: 이 날에 포함되는 상위 3개 안에 들지 않으면 렌더링 스킵
                          const dayDate = new Date(currentYear, currentMonth, cursor);
                          const topSet = topEventsByDay[dateKey(dayDate)];
                          const renderThis = topSet ? topSet.has(ev.id) : true;
                            if (renderThis) segments.push(
                                <div key={`txt-${ev.id}-${week}-${col}`} style={{ gridColumn: `${col} / ${endCol + 1}`, gridRow: week, marginTop: `${topOffset}px` }} className={`h-[22px] flex items-center ${shouldCenter ? 'justify-center' : 'justify-start'} px-1 overflow-hidden w-full max-w-full ${bgColor} rounded border ${borderColor}` }>
                                    <span className={`text-xs ${textColor} font-pretendard font-medium whitespace-nowrap overflow-hidden text-ellipsis px-1`}>{ev.title}</span>
                                </div>
                            );
                            cursor += span;
                        }
                        return segments;
                    })}
                    </div>
                </div>
            </div>

            {/* Upload Button */}
            <div className="absolute bottom-20 right-4 z-10">
              <button 
                onClick={() => router.push('/calendar/create')}
                className="w-12 h-12 bg-brand-500 rounded-full flex justify-center items-center shadow-lg hover:bg-brand-600 transition-colors"
              >
                <PlusIcon className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* 일정 모달 */}
            {showScheduleModal && modalDate && (
                <div 
                    className="absolute inset-0 flex items-center justify-center z-50 bg-black bg-opacity-20"
                    onClick={() => setShowScheduleModal(false)}
                >
                    <div 
                        className="bg-white rounded-2xl w-full max-w-sm mx-5 p-5 shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 모달 헤더 */}
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-xl font-semibold text-gray-800 font-pretendard">
                                {modalDate.getFullYear()}년 {modalDate.getMonth() + 1}월 {modalDate.getDate()}일 ({['일', '월', '화', '수', '목', '금', '토'][modalDate.getDay()]})
                            </h3>
                            <button
                                onClick={() => setShowScheduleModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <Image 
                                    src="/images/common/close.svg" 
                                    alt="닫기" 
                                    width={20} 
                                    height={20} 
                                />
                            </button>
                        </div>
                        
                        {/* 일정 목록 */}
                        <div className="flex flex-col gap-2 mb-5">
                            {modalSchedules.map((schedule, index) => (
                                <div 
                                  key={index} 
                                  className="w-full p-4 bg-gray-50 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-gray-100"
                                  onClick={() => {
                                    const y = modalDate.getFullYear();
                                    const m = String(modalDate.getMonth() + 1).padStart(2, '0');
                                    const da = String(modalDate.getDate()).padStart(2, '0');
                                    const q = `${y}-${m}-${da}`;
                                    setShowScheduleModal(false);
                                    router.push(`/calendar/detail?date=${q}&start=${encodeURIComponent(schedule.startDate)}&end=${encodeURIComponent(schedule.endDate)}`);
                                  }}
                                >
                                    {/* 일정 아이콘 */}
                                    <div className="w-9 h-9 bg-brand-200 rounded-full flex items-center justify-center">
                                        <div className="w-6 h-6 bg-brand-500 rounded-full"></div>
                                    </div>
                                    
                                    {/* 일정 정보 */}
                                    <div className="flex-1">
                                        <div className="text-sm font-semibold text-gray-800 font-pretendard">
                                            {schedule.title}
                                        </div>
                                        <div className="text-xs text-gray-500 font-pretendard">
                                            {new Date(schedule.startDate).toLocaleDateString('ko-KR', { 
                                                month: 'long', 
                                                day: 'numeric', 
                                                weekday: 'short' 
                                            })} ~ {new Date(schedule.endDate).toLocaleDateString('ko-KR', { 
                                                month: 'long', 
                                                day: 'numeric', 
                                                weekday: 'short' 
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* 일정 추가 버튼 */}
                        <button
                            onClick={() => {
                                setShowScheduleModal(false);
                                router.push('/calendar/create');
                            }}
                            className="w-full py-4 bg-white border border-brand-500 text-brand-500 rounded-lg font-pretendard text-sm hover:bg-brand-50 transition-colors"
                        >
                            일정 추가하기
                        </button>
                    </div>
                </div>
            )}

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default CalendarScreen;
