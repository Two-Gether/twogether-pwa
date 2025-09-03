'use client';
import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { Input, SearchBar, LocationItem, Toast, Tag, Dropdown } from '@/components/ui';
import { ArrowRight, Search, User, MapPin } from 'lucide-react';

export default function Demo() {
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('success');

  const selectOptions = [
    { value: 'option1', label: '옵션 1' },
    { value: 'option2', label: '옵션 2' },
    { value: 'option3', label: '옵션 3' },
  ];

  const locationData = [
    {
      title: '강남역',
      address: '서울특별시 강남구 강남대로 396',
    },
    {
      title: '홍대입구역',
      address: '서울특별시 마포구 양화로 160',
    },
  ];

  const handleShowToast = (type: 'success' | 'error' | 'warning' | 'info') => {
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="space-y-6 p-6 max-w-mobile">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">UI 컴포넌트 테스트</h1>

      {/* Button Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700">Button 컴포넌트</h2>
        
        {/* Functional - Fill */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Functional - Fill</h3>
          <Button kind="functional" styleType="fill" tone="brand" fullWidth>
            브랜드 버튼
          </Button>
          <Button kind="functional" styleType="fill" tone="gray" fullWidth>
            그레이 버튼
          </Button>
          <Button kind="functional" styleType="fill" tone="sub" fullWidth>
            서브 버튼
          </Button>
        </div>

        {/* Functional - Outline */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Functional - Outline</h3>
          <Button kind="functional" styleType="outline" tone="brand" fullWidth>
            브랜드 아웃라인
          </Button>
          <Button kind="functional" styleType="outline" tone="gray" fullWidth>
            그레이 아웃라인
          </Button>
          <Button kind="functional" styleType="outline" tone="sub" fullWidth>
            서브 아웃라인
          </Button>
        </div>

        {/* Functional with icon */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">아이콘이 있는 버튼</h3>
          <Button
            kind="functional"
            styleType="fill"
            tone="brand"
            icon={<ArrowRight size={16} />}
            iconPosition="right"
            fullWidth
          >
            다음
          </Button>
        </div>

        {/* Auth Buttons */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">인증 버튼</h3>
          <div className="flex gap-3 flex-wrap">
            <Button kind="auth" state="default">인증코드 받기</Button>
            <Button kind="auth" state="loading">인증 중</Button>
            <Button kind="auth" state="active">인증코드 받기</Button>
            <Button kind="auth" state="success">인증 완료</Button>
          </div>
        </div>
      </section>

      {/* Input Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700">Input 컴포넌트</h2>
        
        {/* Text Input */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Text Input</h3>
          <Input type="text" variant="placeholder" placeholder="Placeholder" />
          <Input type="text" variant="disabled" value="Disabled" />
          <Input type="text" variant="default" value="Default" />
          <Input type="text" variant="textarea" placeholder="Textarea" rows={4} />
          <Input type="text" variant="focus" value="Focus" />
        </div>

        {/* Icon Input */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Icon Input (돋보기 고정)</h3>
          <Input type="icon" variant="placeholder" placeholder="Placeholder" />
          <Input type="icon" variant="default" value="Default" />
          <Input type="icon" variant="disabled" value="Disabled" />
          <Input type="icon" variant="focus" value="Focus" />
        </div>
      </section>

      {/* Tag Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700">Tag 컴포넌트</h2>
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Review Tag</h3>
          <div className="flex gap-3 flex-wrap">
            <Tag type="review" variant="default">맛있어요</Tag>
            <Tag type="review" variant="selected">맛있어요</Tag>
          </div>
        </div>
      </section>

      {/* Dropdown Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700">Dropdown 컴포넌트</h2>
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Selector</h3>
        </div>
      </section>

      {/* SearchBar Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700">SearchBar 컴포넌트</h2>
        <div className="space-y-4">
          <SearchBar 
            placeholder="장소를 검색하세요"
            onSearch={(value) => console.log('검색:', value)}
          />
          <SearchBar 
            variant="error"
            placeholder="에러가 있는 검색바"
            helperText="검색어를 입력해주세요"
          />
        </div>
      </section>

      {/* LocationItem Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700">LocationItem 컴포넌트</h2>
        <div className="space-y-0 overflow-hidden">
          <LocationItem
            title="한국공학대학교 공학관 A동"
            address="경기 시흥시 산기대학로 237 한국공학대학교 공학관 A동"
            onClick={() => console.log('선택된 위치: 한국공학대학교 공학관 A동')}
          />
          <LocationItem
            title="강남역"
            address="서울특별시 강남구 강남대로 396"
            onClick={() => console.log('선택된 위치: 강남역')}
          />
        </div>
      </section>

      {/* Notification Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700">Notification 컴포넌트</h2>
        
        {/* Toast Bar */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Toast Bar</h3>
          <Toast type="default">성공</Toast>
          <Toast type="success">성공</Toast>
          <Toast type="error">에러</Toast>
          <Toast type="warning">주의</Toast>
          <Toast type="info">정보</Toast>
        </div>

        {/* Snack Bar - Close */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Snack Bar - Close</h3>
          <Toast type="default" variant="close" onClose={() => console.log('닫기')}>성공</Toast>
          <Toast type="success" variant="close" onClose={() => console.log('닫기')}>성공</Toast>
          <Toast type="error" variant="close" onClose={() => console.log('닫기')}>에러</Toast>
          <Toast type="warning" variant="close" onClose={() => console.log('닫기')}>주의</Toast>
          <Toast type="info" variant="close" onClose={() => console.log('닫기')}>정보</Toast>
        </div>

        {/* Snack Bar - Text */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Snack Bar - Text</h3>
          <Toast type="default" variant="text" actionText="액션 텍스트" onAction={() => console.log('액션')}>성공</Toast>
          <Toast type="success" variant="text" actionText="액션 텍스트" onAction={() => console.log('액션')}>성공</Toast>
          <Toast type="error" variant="text" actionText="액션 텍스트" onAction={() => console.log('액션')}>에러</Toast>
          <Toast type="warning" variant="text" actionText="액션 텍스트" onAction={() => console.log('액션')}>주의</Toast>
          <Toast type="info" variant="text" actionText="액션 텍스트" onAction={() => console.log('액션')}>정보</Toast>
        </div>
      </section>
    </div>
  );
}
