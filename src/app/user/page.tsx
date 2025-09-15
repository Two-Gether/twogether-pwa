"use client";

import Header from '@/components/ui/Header';
import Footer from '@/components/Footer';
import { useAuthStore } from '@/hooks/auth/useAuth';
import { useRouter } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';
import Image from 'next/image';
import { getRelationshipDaysText } from '@/utils/calculateDays';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Dropdown from '@/components/ui/Dropdown';
import Notification from '@/components/ui/Notification';

export default function MyPage() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState('8');
  const [selectedDay, setSelectedDay] = useState('1');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);

  const handleLogout = useCallback(async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/member/logout`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`,
        },
      });
    } catch {
    } finally {
      logout();
      router.replace('/login');
    }
  }, [logout, router]);


  const handleItemClick = useCallback((title: string) => {
    setModalTitle(title);
    setInputValue('');
    setShowModal(true);
  }, []);

  const showToastMessage = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 1500);
  }, []);

  const refreshUserInfo = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/member/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('사용자 정보 조회에 실패했습니다.');
      }

      const userData = await response.json();
      // Auth store 업데이트 (서버 응답의 myNickname을 nickname으로 매핑)
      const { updateUser } = useAuthStore.getState();
      updateUser({
        memberId: userData.memberId,
        nickname: userData.myNickname, // 서버 응답의 myNickname을 nickname으로 매핑
        partnerId: userData.partnerId,
        partnerNickname: userData.partnerNickname,
        relationshipStartDate: userData.relationshipStartDate,
      });
    } catch {}
  }, []);

  const handleUnlinkPartner = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/member/me/partner`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('연인 연동 해제에 실패했습니다.');
      }

      // 모달 닫고 토스트 노출 후 로그아웃/이동
      setShowUnlinkModal(false);
      showToastMessage('연인 연동이 해제되었습니다.', 'success');
      setTimeout(() => {
        logout();
        router.replace('/login');
      }, 1500);
    } catch (error) {
      console.error('연인 연동 해제 에러:', error);
      showToastMessage('연인 연동 해제에 실패했습니다. 다시 시도해주세요.', 'error');
    }
  }, [logout, router, showToastMessage]);

  // 수동 새로고침 시에만 사용자 정보 새로고침
  useEffect(() => {
    const handleBeforeUnload = () => {
      // 페이지를 떠날 때만 새로고침
      if (isAuthenticated) {
        refreshUserInfo();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isAuthenticated, refreshUserInfo]);

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
    if (modalTitle === '우리가 만난 날짜') {
      const formattedDate = `${selectedYear}-${selectedMonth.padStart(2, '0')}-${selectedDay.padStart(2, '0')}`;
      try {
        setIsLoading(true);
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/member/relationship-start-date`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${useAuthStore.getState().accessToken}`,
          },
          body: JSON.stringify({ date: formattedDate }),
        });

        if (!response.ok) {
          throw new Error('날짜 업데이트에 실패했습니다.');
        }
        // 사용자 정보 새로고침
        await refreshUserInfo();
        
        setShowModal(false);
      } catch {
        alert('날짜 업데이트에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setIsLoading(false);
      }
    } else if (modalTitle === '상대방 별명 지어주기') {

      if (!inputValue.trim()) {
        showToastMessage('별명을 입력해주세요.', 'error');
        return;
      }
      
      try {
        setIsLoading(true);
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/member/partner/nickname`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${useAuthStore.getState().accessToken}`,
          },
          body: JSON.stringify({ nickname: inputValue.trim() }),
        });

        if (!response.ok) {
          throw new Error('별명 변경에 실패했습니다.');
        }

        // 사용자 정보 새로고침
        await refreshUserInfo();
        setShowModal(false);
        showToastMessage('애칭이 성공적으로 변경되었습니다.');
      } catch {
        showToastMessage('별명 변경에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // 다른 모달의 경우 기존 로직
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setShowModal(false);
      }, 1000);
    }
  }, [modalTitle, selectedYear, selectedMonth, selectedDay, inputValue, showToastMessage, refreshUserInfo]);

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
              {user?.nickname || '닉네임'}
            </span>
            <Image 
              src="/images/common/like.svg"
              alt="like"
              width={16}
              height={16}
            />
            <span className="text-xl text-gray-700 font-pretendard font-semibold">
              {user?.partnerNickname || '닉네임'}
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
                <span className="text-sm text-gray-500 font-pretendard">
                  {user?.relationshipStartDate || '미입력'}
                </span>
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
                <span className="text-sm text-gray-500 font-pretendard">
                  {user?.partnerNickname || '미입력'}
                </span>
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
            <div 
              className="py-3 border-b border-gray-300 flex justify-between items-center cursor-pointer"
              onClick={() => router.push('/user/info')}
            >
              <span className="text-sm text-gray-700 font-pretendard">로그인 정보</span>
              <Image 
                src="/images/common/arrowTop.svg"
                alt="arrow"
                width={12}
                height={12}
                className="transform rotate-90"
              />
            </div>
            <div 
              className="py-3 border-b border-gray-300 flex justify-between items-center cursor-pointer"
              onClick={() => setShowLogoutModal(true)}
            >
              <span className="text-sm text-gray-700 font-pretendard">로그아웃</span>
              <Image 
                src="/images/common/arrowTop.svg"
                alt="arrow"
                width={12}
                height={12}
                className="transform rotate-90"
              />
            </div>
            <div 
              className="py-3 flex justify-between items-center cursor-pointer"
              onClick={() => setShowUnlinkModal(true)}
            >
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

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 left-0 right-0 z-50 p-4">
          <Notification
            type={toastType}
            onClose={() => setShowToast(false)}
          >
            {toastMessage}
          </Notification>
        </div>
      )}

      {/* 로그아웃 확인 모달 */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-5">
          <div 
            className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-lg"
            style={{
              boxShadow: '2px 4px 8px rgba(0, 0, 0, 0.08)'
            }}
          >
            <div className="flex flex-col items-center gap-8">
              <div className="w-full flex flex-col items-center gap-4">
                <div className="text-center text-gray-800 text-xl font-pretendard font-semibold leading-6">
                  로그아웃을 하시겠어요?
                </div>
                <div className="text-center text-gray-500 text-sm font-pretendard font-normal leading-5">
                  현재 기기에서 로그아웃됩니다.
                </div>
              </div>
              <div className="w-full flex items-center gap-4">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="w-24 py-4 bg-gray-200 rounded-lg flex justify-center items-center"
                >
                  <span className="text-center text-gray-700 text-sm font-pretendard font-normal leading-5">
                    닫기
                  </span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-4 bg-brand-500 rounded-lg flex justify-center items-center"
                >
                  <span className="text-center text-white text-sm font-pretendard font-semibold leading-5">
                    로그아웃
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 연인 연동 해제 모달 */}
      {showUnlinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-5">
          <div 
            className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-lg"
            style={{
              boxShadow: '2px 4px 8px rgba(0, 0, 0, 0.08)'
            }}
          >
            <div className="flex flex-col items-center gap-8">
              <div className="w-full flex flex-col items-center gap-4">
                <div className="text-center text-gray-800 text-xl font-pretendard font-semibold leading-6">
                  연인 연동을 해제 하시겠어요?
                </div>
                <div className="text-center text-gray-500 text-sm font-pretendard font-normal leading-5">
                  해제하면 서로의 일정과 기록을<br/>
                  더 이상 공유되지 않습니다.
                </div>
              </div>
              <div className="w-full flex items-center gap-4">
                <button
                  onClick={() => setShowUnlinkModal(false)}
                  className="w-24 py-4 bg-gray-200 rounded-lg flex justify-center items-center"
                >
                  <span className="text-center text-gray-700 text-sm font-pretendard font-normal leading-5">
                    닫기
                  </span>
                </button>
                <button
                  onClick={handleUnlinkPartner}
                  className="flex-1 py-4 bg-brand-500 rounded-lg flex justify-center items-center"
                >
                  <span className="text-center text-white text-sm font-pretendard font-semibold leading-5">
                    연동 해제
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
