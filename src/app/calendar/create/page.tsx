"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/ui/Header';
import Input from '@/components/ui/Input';
import DatePicker from '@/components/ui/DatePicker';
import Button from '@/components/ui/Button';

export default function CreateEventPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    memo: ''
  });
  const [inputStates, setInputStates] = useState({
    title: 'placeholder' as 'placeholder' | 'focus'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInputFocus = (field: string) => {
    setInputStates(prev => ({
      ...prev,
      [field]: 'focus'
    }));
  };

  const handleInputBlur = (field: string) => {
    setInputStates(prev => ({
      ...prev,
      [field]: 'placeholder'
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // TODO: 일정 생성 API 호출
      console.log('일정 생성:', formData);
      
      // 성공 시 캘린더로 돌아가기
      router.push('/calendar');
    } catch (error) {
      console.error('일정 생성 에러:', error);
      alert('일정 생성에 실패했습니다.');
    }
  };

  const handleCancel = () => {
    router.push('/calendar');
  };

  return (
    <div className="w-full min-h-screen relative bg-white overflow-hidden">
      {/* Header */}
      <Header title="일정 생성" showBackButton={true} />

      {/* Form */}
      <div className="flex-1 px-6 py-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-10">
          {/* 제목 */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-1">
              <span className="text-gray-700 text-base font-pretendard font-semibold leading-[19.2px]">제목</span>
              <span className="text-brand-500 text-base font-pretendard font-semibold leading-[19.2px]">*</span>
            </div>
            <Input
              type="text"
              variant={inputStates.title}
              placeholder="일정 제목을 입력하세요"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              onFocus={() => handleInputFocus('title')}
              onBlur={() => handleInputBlur('title')}
              required
            />
          </div>

          {/* 기간 */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-1">
              <span className="text-gray-700 text-base font-pretendard font-semibold leading-[19.2px]">기간</span>
              <span className="text-brand-500 text-base font-pretendard font-semibold leading-[19.2px]">*</span>
            </div>
            
            {/* 시작일 */}
            <div className="flex items-center gap-7">
              <span className="w-7 text-gray-700 text-sm font-pretendard font-normal leading-[19.6px]">시작</span>
              <DatePicker
                value={formData.startDate}
                onChange={(date) => handleInputChange('startDate', date)}
                placeholder="날짜를 선택하세요"
                required
              />
            </div>

            {/* 종료일 */}
            <div className="flex items-center gap-7">
              <span className="w-7 text-gray-700 text-sm font-pretendard font-normal leading-[19.6px]">종료</span>
              <DatePicker
                value={formData.endDate}
                onChange={(date) => handleInputChange('endDate', date)}
                placeholder="날짜를 선택하세요"
                required
              />
            </div>
          </div>

          {/* 스티커 추가 */}

          {/* 웨이포인트 불러오기 */}
          <div className="flex flex-col gap-4">
            <span className="text-gray-700 text-base font-pretendard font-semibold leading-[19.2px]">일정</span>
            <Button
              kind="functional"
              tone="gray"
              fullWidth
              onClick={() => {
                // 웨이포인트 불러오기 로직
                console.log('웨이포인트 불러오기');
              }}
            >
              웨이포인트 불러오기
            </Button>
          </div>

          {/* 메모 */}
          <div className="flex flex-col gap-4">
          <span className="text-gray-700 text-base font-pretendard font-semibold leading-[19.2px]">메모</span>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 text-sm font-pretendard font-normal leading-[19.6px] resize-none focus:outline-none focus:border-brand-500 placeholder:text-gray-500"
              placeholder="자유롭게 메모를 입력하세요"
              value={formData.memo}
              onChange={(e) => handleInputChange('memo', e.target.value)}
              rows={4}
            />
          </div>
        </form>
      </div>

      {/* 하단 버튼들 */}
      <div className="absolute bottom-5 left-5 right-5 flex gap-3">
        <button 
          type="button"
          onClick={handleCancel}
          className="flex-1 py-4 bg-gray-100 rounded-lg shadow-[2px_4px_8px_rgba(0,0,0,0.08)] flex items-center justify-center"
        >
          <span className="text-gray-700 text-sm font-pretendard font-normal leading-[19.6px]">취소</span>
        </button>
        <button 
          type="submit"
          onClick={handleSubmit}
          className="flex-1 py-4 bg-brand-500 rounded-lg shadow-[2px_4px_8px_rgba(0,0,0,0.08)] flex items-center justify-center"
        >
          <span className="text-white text-sm font-pretendard font-semibold leading-[19.6px]">생성하기</span>
        </button>
      </div>
    </div>
  );
}
