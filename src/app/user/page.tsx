"use client";

import Header from '@/components/ui/Header';
import Footer from '@/components/Footer';
import { useAuthStore } from '@/hooks/auth/useAuth';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import Image from 'next/image';
import { getRelationshipDaysText } from '@/utils/calculateDays';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Dropdown from '@/components/ui/Dropdown';

export default function MyPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState('8');
  const [selectedDay, setSelectedDay] = useState('1');

  const handleLogout = useCallback(() => {
    logout();
    router.replace('/login');
  }, [logout, router]);

  const handleItemClick = useCallback((title: string) => {
    setModalTitle(title);
    setInputValue('');
    setShowModal(true);
  }, []);

  // 연도 옵션 생성 (이번 연도 기준 전 15년)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 16 }, (_, i) => {
    const year = currentYear - 15 + i;
    return { value: year.toString(), label: `${year}년` };
  });

  // 월 옵션 생성 (1-12)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return { value: month.toString(), label: `${month}월` };
  });

  // 일 옵션 생성 (1-31)
  const dayOptions = Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    return { value: day.toString(), label: `${day}일` };
  });

  const handleSubmit = useCallback(async () => {
    setIsLoading(true);
    // TODO: API 호출 로직 추가
    setTimeout(() => {
      setIsLoading(false);
      setShowModal(false);
    }, 1000);
  }, []);

  return (
    <div className="w-full h-screen bg-white flex flex-col">
      <Header title="마이페이지" showBackButton={false} />

      <main className="flex-1 px-5 pt-6">
        {/* 프로필 이미지 */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 p-2 bg-gray-100 rounded-lg flex items-center justify-center">
            <Image 
              src="/images/illust/cats/sadCat.png" 
              alt="프로필" 
              width={96}
              height={96}
              className="w-full h-full object-cover rounded"
            />
          </div>
        </div>

        {/* 상태 배지 */}
        <div className="flex justify-center mb-2">
          <div className="px-2 py-auto bg-brand-500 rounded">
            <span className="text-xs text-white font-pretendard font-semibold">
              {user?.relationshipStartDate 
                ? getRelationshipDaysText(user.relationshipStartDate)
                : '연인 정보를 입력해주세요'
              }
            </span>
          </div>
        </div>

        {/* 닉네임과 상태 배지 */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-1">
            <span className="text-xl text-gray-700 font-pretendard font-semibold">
              {user?.nickname || '본명'}
            </span>
            <Image 
              src="/images/common/like.svg"
              alt="like"
              width={16}
              height={16}
            />
            <span className="text-xl text-gray-700 font-pretendard font-semibold">
              {user?.partnerNickname || '본명'}
            </span>
          </div>
        </div>

        {/* 연인 정보 섹션 */}
        <div className="mb-8">
          <h3 className="text-xl text-gray-700 font-pretendard font-semibold mb-3">연인 정보</h3>
          <div className="bg-white rounded-lg border-b border-gray-300">
            <div 
              className="py-3 border-b border-gray-300 flex justify-between items-center cursor-pointer"
              onClick={() => handleItemClick('우리가 만난 날짜')}
            >
              <span className="text-sm text-gray-700 font-pretendard">우리가 만난 날짜</span>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-500 font-pretendard">미입력</span>
                <Image 
                  src="/images/common/arrowTop.svg"
                  alt="arrow"
                  width={12}
                  height={12}
                  className="transform rotate-90"
                />
              </div>
            </div>
            <div 
              className="py-3 flex justify-between items-center cursor-pointer"
              onClick={() => handleItemClick('상대방 별명 지어주기')}
            >
              <span className="text-sm text-gray-700 font-pretendard">상대방 별명 지어주기</span>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-500 font-pretendard">미입력</span>
                <Image 
                  src="/images/common/arrowTop.svg"
                  alt="arrow"
                  width={12}
                  height={12}
                  className="transform rotate-90"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 계정 정보 섹션 */}
        <div className="mb-8">
          <h3 className="text-xl text-gray-700 font-pretendard font-semibold mb-3">계정 정보</h3>
          <div className="bg-white rounded-lg border-b border-gray-300">
            <div className="py-3 border-b border-gray-300 flex justify-between items-center">
              <span className="text-sm text-gray-700 font-pretendard">로그인 정보</span>
              <Image 
                src="/images/common/arrowTop.svg"
                alt="arrow"
                width={12}
                height={12}
                className="transform rotate-90"
              />
            </div>
            <div className="py-3 border-b border-gray-300 flex justify-between items-center">
              <span className="text-sm text-gray-700 font-pretendard">로그아웃</span>
              <Image 
                src="/images/common/arrowTop.svg"
                alt="arrow"
                width={12}
                height={12}
                className="transform rotate-90"
              />
            </div>
            <div className="py-3 flex justify-between items-center">
              <span className="text-sm text-brand-500 font-pretendard">연인 연동 해제</span>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* 하단 모달 */}
      {showModal && (
        <div 
          className="fixed inset-0 flex items-end justify-center z-50 bg-black bg-opacity-20"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-t-lg w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold font-pretendard">
                {modalTitle === '우리가 만난 날짜' ? '만남을 시작한 날짜를 선택하세요' : modalTitle}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 text-xl"
              >
                ×
              </button>
            </div>
            
            {modalTitle === '우리가 만난 날짜' ? (
              <>
                <div className="flex gap-2 mb-6 relative">
                  <div className="basis-1/2">
                      <Dropdown
                        options={yearOptions}
                        value={selectedYear}
                        onChange={(value) => setSelectedYear(value)}
                        placeholder="년도"
                        openUpward={true}
                        className="relative"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div className="flex gap-2 basis-1/2">
                      <div className="basis-1/2">
                        <Dropdown
                          options={monthOptions}
                          value={selectedMonth}
                          onChange={(value) => setSelectedMonth(value)}
                          placeholder="월"
                          openUpward={true}
                          className="relative"
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div className="basis-1/2">
                        <Dropdown
                          options={dayOptions}
                          value={selectedDay}
                          onChange={(value) => setSelectedDay(value)}
                          placeholder="일"
                          openUpward={true}
                          className="relative"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                </div>
                <Button
                  kind="functional"
                  styleType="fill"
                  tone="brand"
                  fullWidth
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? '저장 중...' : '등록하기'}
                </Button>
              </>
            ) : (
              <>
                <Input 
                  type="text"
                  variant="placeholder"
                  placeholder="별명을 입력하세요"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  style={{ marginBottom: '20px' }}
                />
                <Button
                  kind="functional"
                  styleType="fill"
                  tone="brand"
                  fullWidth
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? '저장 중...' : '저장하기'}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
