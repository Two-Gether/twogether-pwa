"use client";

import { useState, useMemo, useRef, useEffect, type ReactNode } from 'react';
import Footer from '@/components/Footer';
import Header from '@/components/ui/Header';
import PlusIcon from '@/components/icons/PlusIcon';

const CalendarScreen = () => {
    const [selectedDate, setSelectedDate] = useState<number | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const touchStartYRef = useRef<number | null>(null);
    
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
    
    // 기간 이벤트 예시 (날짜에 색칠, 텍스트는 아래 줄)
    type EventColor = 'text-brand-500'|'text-brand-200'|'text-sub-200';
    type CalEvent = { id:string; title:string; start:Date; end:Date;};
    const events: CalEvent[] = useMemo(()=>{
        const y=currentYear, m=currentMonth;
        return [
            { id:'e1', title:'여행 제목은 이곳에...', start:new Date(y,m,8), end:new Date(y,m,12)},
            { id:'e2', title:'춘천 당일치기', start:new Date(y,m,24), end:new Date(y,m,26) },
            { id:'e3', title:'여행을 길게 다녀오지만 사실 1박 2일', start:new Date(y,m,3), end:new Date(y,m,4)},
        ];
    },[currentMonth,currentYear]);
    
    // 날짜별 색상 결정 함수
    const getDateColor = (day: number) => {
        if (isCurrentMonth && day === today) {
            return 'brand';
        }
        return 'default';
    };

    // 해당 날짜가 포함된 이벤트 반환 (없으면 null)
    const getEventForDay = (date: Date): CalEvent | null => {
        const d0 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        for (const ev of events) {
            const s0 = new Date(ev.start.getFullYear(), ev.start.getMonth(), ev.start.getDate());
            const e0 = new Date(ev.end.getFullYear(), ev.end.getMonth(), ev.end.getDate());
            if (d0 >= s0 && d0 <= e0) return ev;
        }
        return null;
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
        <div className="w-full min-h-screen relative bg-white overflow-hidden">
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
                className="w-full px-5 overflow-hidden relative"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onWheel={handleWheel}
            >
                {/* 7x6 그리드 구조 */}
                <div className="relative grid grid-cols-7 gap-0 [&>*:nth-child(n+8)]:border-t [&>*:nth-child(n+8)]:border-gray-300">
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
                        
                        if (day === today) {
                            // 특별한 이벤트가 있거나 오늘 날짜
                            
                            return (
                                <div 
                                    key={`day-${day}`} 
                                    className={`relative h-[120px] py-2 flex flex-col justify-between items-center cursor-pointer transition-colors ${
                                        isSelected ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'
                                    }`}
                                    onClick={() => setSelectedDate(isSelected ? null : day)}
                                >
                                    <div className="flex flex-col gap-1 items-center w-full">
                                        <div className="w-full flex justify-center">
                                            {(() => {
                                                const ev = getEventForDay(new Date(currentYear,currentMonth,day));
                                                const c = ev ? getDerivedEventColor(ev) : null;
                                                const pillColor = c ? (c==='text-brand-500'?'bg-brand-500':c==='text-sub-200'?'bg-sub-200':c==='text-brand-200'?'bg-brand-200':'') : '';
                                                return (
                                                    <div className={`w-full flex justify-center ${pillColor}`}>
                                                        <div className={`text-center text-sm font-pretendard font-normal leading-[19.6px] ${
                                                c === 'text-brand-500' ? 'text-white' :
                                                dateColor === 'brand' ? 'text-brand-500' : 
                                                isSelected ? 'text-blue-800 font-semibold' : 'text-gray-800'
                                            }`}>
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
                                    className={`relative h-[120px] py-2 flex justify-center items-start cursor-pointer transition-colors ${
                                        isSelected ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'
                                    }`}
                                    onClick={() => setSelectedDate(isSelected ? null : day)}
                                >
                                    {(() => {
                                        const ev = getEventForDay(new Date(currentYear,currentMonth,day));
                                        const c = ev ? getDerivedEventColor(ev) : null;
                                        const pillColor = c ? (c==='text-brand-500'?'bg-brand-500':c==='text-sub-200'?'bg-sub-200':c==='text-brand-200'?'bg-brand-200':'') : '';
                                        return (
                                            <div className={`w-full flex justify-center ${pillColor}`}>
                                                <div className={`text-center text-sm font-pretendard font-normal leading-[19.6px] ${
                                        c === 'text-brand-500' ? 'text-white' :
                                        isSelected ? 'text-blue-600 font-semibold' : 'text-gray-800'
                                    }`}>
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
                    {events.map(ev => {
                        const start = ev.start.getDate();
                        const end = ev.end.getDate();
                        const segments: ReactNode[] = [];
                        let cursor = start;
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
                            segments.push(
                                <div key={`txt-${ev.id}-${week}-${col}`} style={{ gridColumn: `${col} / ${endCol + 1}`, gridRow: week }} className={`mt-7 h-5 flex items-center ${shouldCenter ? 'justify-center' : 'justify-start'} px-1 overflow-hidden w-full max-w-full`}>
                                    <span className="text-xs text-gray-800 font-pretendard font-semibold whitespace-nowrap overflow-hidden text-ellipsis px-1">{ev.title}</span>
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
              <div className="w-12 h-12 bg-brand-500 rounded-full flex justify-center items-center shadow-lg">
                <PlusIcon className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default CalendarScreen;
