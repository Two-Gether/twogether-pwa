"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  required?: boolean;
}

const DatePicker: React.FC<DatePickerProps> = ({ 
  value, 
  onChange, 
  placeholder = "날짜를 선택하세요",
  required = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 달력 데이터 생성
  const getCalendarData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
      
      days.push({
        date,
        isCurrentMonth,
        isToday,
        isSelected
      });
    }
    
    return days;
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    onChange(date.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return placeholder;
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short'
    });
  };

  const calendarData = getCalendarData();

  return (
    <div className="relative flex-1" ref={dropdownRef}>
      {/* Input Display */}
      <div 
        className="w-full h-[52px] px-4 bg-white rounded-lg border border-gray-300 flex items-center justify-between hover:border-gray-300 transition-colors cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-gray-700 text-sm font-pretendard font-normal leading-[19.6px]">
          {formatDisplayDate(value)}
        </span>
        <Image 
          src="/images/common/calendar.svg"
          alt="calendar"
          width={20}
          height={20}
        />
      </div>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-lg border border-gray-200 p-4 z-50 min-w-[320px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            <h3 className="text-gray-800 font-pretendard font-semibold text-base">
              {currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
            </h3>
            
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
              <div key={day} className="text-center text-xs font-pretendard font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarData.map((day, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleDateSelect(day.date)}
                className={`
                  w-10 h-10 rounded-lg text-sm font-pretendard transition-colors
                  ${!day.isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                  ${day.isToday ? 'bg-brand-100 text-brand-500 font-semibold' : ''}
                  ${day.isSelected ? 'bg-brand-500 text-white font-semibold' : ''}
                  ${!day.isSelected && !day.isToday && day.isCurrentMonth ? 'hover:bg-gray-100' : ''}
                `}
              >
                {day.date.getDate()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
