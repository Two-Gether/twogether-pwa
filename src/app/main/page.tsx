"use client";

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore, apiWithAuth } from '@/hooks/auth/useAuth';
import MainHeader from '../../components/MainHeader';
import Footer from '../../components/Footer';
import RecommendationCard, { Recommendation } from '../../components/RecommendationCard';
import Notification from '@/components/ui/Notification';
import ScheduleCard from '@/components/ui/ScheduleCard';
import { getCurrentMonthRange, formatDateToKorean, getScheduleStatus } from '@/utils/dateUtils';
import { DiaryMonthOverviewResponse } from '@/types/diary';
import Image from 'next/image';

function MainPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const [relationshipDays, setRelationshipDays] = useState(0);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [schedules, setSchedules] = useState<DiaryMonthOverviewResponse[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // 주소에서 괄호 부분 제거하는 함수
  const removeParentheses = (address: string): string => {
    return address.replace(/\s*\([^)]*\)/g, '').trim();
  };
  const { accessToken } = useAuthStore();
  
  // 일정 데이터 가져오기
  const fetchSchedules = useCallback(async () => {
    if (!isAuthenticated) return;
    
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
        throw new Error('일정 데이터를 가져오는데 실패했습니다.');
      }

      const data = await response.json();
      setSchedules(data.diaryMonthOverviewResponses || []);
    } catch (error) {
      console.error('일정 데이터 로딩 에러:', error);
      setSchedules([]);
    } finally {
      setIsLoadingSchedules(false);
    }
  }, [isAuthenticated, accessToken]);

  const refreshUserInfo = useCallback(async () => {
    try {
      const response = await apiWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL}/member/me`, {
        method: 'GET',
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
    } catch (error) {
      console.error('Main 페이지 사용자 정보 새로고침 에러:', error);
    }
  }, []);

  // 추천 데이터 불러오기
  const fetchRecommendations = useCallback(async () => {
    try {
      setIsLoadingRecommendations(true);
      const { getRecommendations } = await import('@/api/tour');
      const data = await getRecommendations();
      
      if (data.success) {
        setRecommendations(data.data);
      } else {
        console.error('추천 데이터 로딩 실패:', data.error);
      }
    } catch (error) {
      console.error('추천 데이터 로딩 중 오류:', error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  }, []);

  // 앱 종료 처리 함수
  const handleExitApp = useCallback(() => {
    setShowExitModal(false);
    // PWA의 경우 뒤로 가기로 앱 종료 처리
    if (window.history.length <= 1) {
      window.close();
    } else {
      // history를 모두 비우고 현재 페이지 유지
      window.history.pushState(null, '', '/main');
    }
  }, []);

  // 뒤로 가기 방어 로직
  useEffect(() => {
    if (!isAuthenticated) return;

    // 현재 페이지를 history에 추가하여 뒤로 가기 시 로그인 페이지로 가지 않도록 처리
    const handlePopState = (e: PopStateEvent) => {
      // 뒤로 가기를 막고 현재 페이지 유지
      e.preventDefault();
      
      // 모달 표시
      setShowExitModal(true);
      // 현재 페이지 유지
      window.history.pushState(null, '', '/main');
    };

    // 페이지 진입 시 history state 설정
    window.history.pushState(null, '', '/main');
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // 파트너 연결 성공 Toast 표시
    const successParam = searchParams.get('success');
    if (successParam === 'partner_connected') {
      setShowSuccessToast(true);
      
      // 1.5초 후 Toast 숨기기
      setTimeout(() => {
        setShowSuccessToast(false);
      }, 1500);
      
      // URL에서 파라미터 제거
      router.replace('/main');
    }

    // 추천 데이터 불러오기
    fetchRecommendations();
    
    // 일정 데이터 불러오기
    fetchSchedules();
    
    // 파트너 상태 재검증 및 리다이렉트
    if (user) {
      if (user.partnerId === null) {
        router.push('/connect');
        return;
      }
    }
  }, [isAuthenticated, user, router, searchParams, fetchRecommendations, fetchSchedules]);

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

  // 로딩 상태를 추가하여 하이드레이션 불일치 방지
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  // 관계 시작일 계산
  useEffect(() => {
    if (user?.relationshipStartDate) {
      const startDate = new Date(user.relationshipStartDate);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setRelationshipDays(diffDays);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">로딩 중...</h2>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">인증 확인 중...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col relative">
      <MainHeader />
      <div className="px-5 pt-6 flex-1 pb-24">{/* pb-24로 Footer 공간 확보 */}
        {/* Relationship Status Card */}
        {user?.relationshipStartDate ? (
          <div className="mb-6 p-5 bg-gray-200 rounded-lg border border-gray-300 relative">
            {/* Cat Image - positioned on top of the card */}
            <div className="absolute left-0 top-10 z-10">
              <Image 
                src="/images/illust/cats/coupleCats.png"
                alt="Couple Cats"
                width={139}
                height={125}
                className="transform scale-x-[-1]"
              />
            </div>
            <div className="text-right">
              <div className="text-base text-gray-700 font-pretendard font-normal">
                우리가 함께한 지
              </div>
              <div className="flex justify-end items-center gap-1 mb-6">
                <span className="text-xl text-brand-500 font-pretendard font-semibold leading-6">
                  {relationshipDays}일
                </span>
                <span className="text-xl text-gray-700 font-pretendard font-semibold leading-6">
                  이 지났어요!
                </span>
              </div>
              <div 
                className="flex justify-end items-center gap-1 cursor-pointer"
                onClick={() => router.push('/calendar')}
                aria-label="캘린더로 이동"
              >
                <span className="text-sm text-gray-500 font-pretendard font-normal leading-[19.60px]">
                  우리의 발자국 살펴보기
                </span>
                  <Image 
                    src="/images/common/arrowTop.svg"
                    alt="arrow"
                    width={8}
                    height={8}
                    className="transform rotate-90"
                  />
              </div>
            </div>
        </div>
        ) : (
          <div className="mb-6 p-5 bg-gray-200 rounded-lg border border-gray-300 relative">
            {/* Cat Image - positioned on top of the card */}
            <div className="absolute left-0 top-5 z-10">
              <Image 
                src="/images/illust/cats/sadCat.png"
                alt="Sad Cat"
                width={139}
                height={125}
                className="transform scale-x-[-1]"
              />
        </div>
            <div className="text-right">
              <div className="text-base text-gray-700 font-pretendard font-normal leading-[22.40px]">
                서로 함께한 시간 알고있나요?
              </div>
              <div className="flex justify-end items-center">
                <button 
                  onClick={() => router.push('/user')}
                  className="text-xl text-brand-500 font-pretendard font-semibold underline leading-6 hover:no-underline"
                >
                  연인 정보 입력
                </button>
              </div>
            </div>
            
            {/* 말풍선 */}
            <div className="absolute -bottom-12 right-0">
              <div className="relative">
                {/* 말풍선 본체 */}
                <div className="px-3 py-2 bg-brand-500 rounded-lg">
                  <div className="text-right text-white text-xs font-pretendard font-semibold leading-[16.80px]">
                    입력 후에도 보이지 않는다면 새로고침!
                  </div>
                </div>
                {/* 말풍선 꼬리 (위쪽 화살표) */}
                <div className="absolute -top-1 right-4">
                  <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-brand-500"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 mt-24">
          <h2 className="text-xl text-gray-700 font-pretendard font-semibold leading-6 mb-4">
            다가오는 데이트 일정
          </h2>
          <div className="space-y-3">
            {isLoadingSchedules ? (
              <div className="p-4 bg-gray-100 rounded-lg border border-gray-300 text-center">
                <span className="text-gray-500">일정을 불러오는 중...</span>
              </div>
            ) : (() => {
              const upcomingSchedules = schedules
                .map((schedule) => {
                  const status = getScheduleStatus(schedule.startDate, schedule.endDate);
                  return { ...schedule, status };
                })
                .filter((schedule) => schedule.status.status !== 'past') // 지난 일정 제외
                .sort((a, b) => {
                  // 진행중인 일정을 먼저 표시
                  if (a.status.status === 'ongoing' && b.status.status !== 'ongoing') return -1;
                  if (a.status.status !== 'ongoing' && b.status.status === 'ongoing') return 1;
                  // 그 다음 daysLeft 오름차순 정렬 (가까운 일정이 먼저)
                  return a.status.daysLeft - b.status.daysLeft;
                })
                .slice(0, 3); // 최대 3개만 표시
              
              return upcomingSchedules.length > 0 ? (
                upcomingSchedules.map((schedule, index) => (
                  <ScheduleCard
                    key={index}
                    title={schedule.title}
                    dateRange={`${formatDateToKorean(schedule.startDate)} ~ ${formatDateToKorean(schedule.endDate)}`}
                    daysLeft={schedule.status.daysLeft}
                    displayText={schedule.status.displayText}
                    onClick={() => {
                      // 캘린더 페이지로 이동
                      router.push('/calendar');
                    }}
                  />
                ))
              ) : (
                <div 
                  className="p-4 bg-gray-100 rounded-lg border border-gray-300 text-left cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => router.push('/calendar')}
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="text-gray-500 text-left">다가오는 일정이 없어요!</span>
                    <Image 
                      src="/images/common/arrowTop.svg"
                      alt="arrow"
                      width={12}
                      height={12}
                      className="transform rotate-90"
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Today's Recommendations */}
        <div className="mb-6 mt-16">
          <h2 className="text-xl text-gray-700 font-pretendard font-semibold leading-6 mb-4">
            오늘의 추천 장소/행사
          </h2>
          {isLoadingRecommendations ? (
            <div className="flex gap-3 overflow-x-auto w-full pb-2">
              {[...Array(3)].map((_, index) => (
                <div 
                  key={index}
                  className="w-[230px] h-[314px] bg-gray-200 rounded-lg flex-shrink-0 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto w-full pb-2" style={{ scrollBehavior: 'smooth' }}>
              {recommendations.map((recommendation) => (
                <RecommendationCard
                  key={recommendation.id}
                  recommendation={recommendation}
                  onClick={(rec) => {
                    if (rec.fullAddress) {
                      const cleanAddress = removeParentheses(rec.fullAddress);
                      router.push(`/map?search=${encodeURIComponent(cleanAddress)}`);
                    } else if (rec.mapx && rec.mapy) {
                      router.push(`/map?lat=${rec.mapy}&lng=${rec.mapx}`);
                    } else {
                      router.push(`/map?search=${encodeURIComponent(rec.title)}`);
                    }
                  }}
                />
              ))}
              {recommendations.length === 0 && (
                <div className="w-full h-[314px] flex items-center justify-center text-gray-500">
                  추천 항목이 없습니다.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Upload Button */}
      <div className="absolute bottom-20 right-4 z-10">
        <button 
          className="w-12 h-12 bg-brand-500 rounded-full flex justify-center items-center shadow-lg hover:bg-brand-600 transition-colors"
          onClick={() => router.push('/highlight')}
        >
          <Image 
            src="/images/common/upload.svg" 
            alt="Upload" 
            width={24}
            height={24}
          />
        </button>
      </div>
      
      <style jsx>{`
        .overflow-x-auto::-webkit-scrollbar {
          height: 4px; /* 스크롤바 높이 */
        }
        .overflow-x-auto::-webkit-scrollbar-track {
          background: #f1f1f1; /* 스크롤바 트랙 색상 */
          border-radius: 2px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb {
          background: #c1c1c1; /* 스크롤바 색상 */
          border-radius: 2px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8; /* 스크롤바 호버 색상 */
        }
      `}</style>

      {/* 성공 Toast - 헤더를 덮도록 z-index 높게 설정 */}
      {showSuccessToast && (
        <div className="fixed top-4 left-0 right-0 z-50 p-4">
          <Notification
            type="success"
            onClose={() => setShowSuccessToast(false)}
          >
            연인 연동에 성공했어요!
          </Notification>
        </div>
      )}

      {/* 앱 종료 확인 모달 */}
      {showExitModal && (
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
                  앱을 종료하시겠어요?
                </div>
                <div className="text-center text-gray-500 text-sm font-pretendard font-normal leading-5">
                  종료하면 앱이 닫힙니다.
                </div>
              </div>
              <div className="w-full flex items-center gap-4">
                <button
                  onClick={() => setShowExitModal(false)}
                  className="w-24 py-4 bg-gray-200 rounded-lg flex justify-center items-center"
                >
                  <span className="text-center text-gray-700 text-sm font-pretendard font-normal leading-5">
                    닫기
                  </span>
                </button>
                <button
                  onClick={handleExitApp}
                  className="flex-1 py-4 bg-brand-500 rounded-lg flex justify-center items-center"
                >
                  <span className="text-center text-white text-sm font-pretendard font-semibold leading-5">
                    종료
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
}

export default function MainPage() {
  return (
    <Suspense fallback={null}>
      <MainPageContent />
    </Suspense>
  );
}
