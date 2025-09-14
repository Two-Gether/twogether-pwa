"use client";

import Header from '@/components/ui/Header';
import Footer from '@/components/Footer';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/hooks/auth/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface UserInfo {
  memberId: number;
  email: string;
  name: string;
  myNickname: string | null;
  profileImageUrl: string | null;
  gender: string;
  ageRange: string | null;
  phoneNumber: string | null;
  loginPlatform: string;
  partnerId: number | null;
  partnerName: string | null;
  partnerNickname: string | null;
  relationshipStartDate: string | null;
}

export default function UserInfoPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchUserInfo();
  }, [isAuthenticated, router]);

  const fetchUserInfo = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/member/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('사용자 정보 조회에 실패했습니다.');
      }

      const data = await response.json();
      console.log('사용자 정보:', data);
      setUserInfo(data);
    } catch (error) {
      console.error('사용자 정보 조회 에러:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatValue = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return '미입력';
    if (typeof value === 'string' && value.trim() === '') return '미입력';
    return value.toString();
  };

  const getGenderText = (gender: string) => {
    switch (gender.toLowerCase()) {
      case 'male': return '남자';
      case 'female': return '여자';
      case 'unknown': return '미입력';
      default: return gender;
    }
  };

  const getLoginPlatformText = (platform: string) => {
    switch (platform) {
      case 'LOCAL': return '일반 로그인';
      case 'KAKAO': return '카카오 로그인';
      case 'GOOGLE': return '구글 로그인';
      default: return platform;
    }
  };

  const handleDeleteAccount = () => {
    // TODO: 회원 탈퇴 API 호출
    console.log('회원 탈퇴 처리');
    setShowDeleteModal(false);
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-white flex flex-col">
        <Header title="로그인 정보" showBackButton={true} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-4"></div>
            <p className="text-gray-500">정보를 불러오는 중...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-white flex flex-col">
      <Header title="로그인 정보" showBackButton={true} />
      
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-6 py-4">
           {/* 로그인 정보 섹션 */}
           <div className="mb-6">
            <h3 className="text-lg text-gray-700 font-pretendard font-semibold mb-4">로그인 정보</h3>
            <div className="bg-white rounded-lg border border-gray-300">
              <div className="py-3 px-4 border-b border-gray-100 flex justify-between items-center">
                <span className="text-sm text-gray-600 font-pretendard">로그인 방식</span>
                <span className="text-sm text-gray-800 font-pretendard">{getLoginPlatformText(userInfo?.loginPlatform || 'LOCAL')}</span>
              </div>
            </div>
          </div>

          {/* 기본 정보 섹션 */}
          <div className="mb-6">
            <h3 className="text-lg text-gray-700 font-pretendard font-semibold mb-4">기본 정보</h3>
            <div className="bg-white rounded-lg border border-gray-300">
              <div className="py-3 px-4 border-b border-gray-300 flex justify-between items-center">
                <span className="text-sm text-gray-600 font-pretendard">이메일</span>
                <span className="text-sm text-gray-800 font-pretendard">{formatValue(userInfo?.email)}</span>
              </div>
              <div className="py-3 px-4 border-b border-gray-300 flex justify-between items-center">
                <span className="text-sm text-gray-600 font-pretendard">이름</span>
                <span className="text-sm text-gray-800 font-pretendard">{formatValue(userInfo?.name)}</span>
              </div>
              <div className="py-3 px-4 border-b border-gray-300 flex justify-between items-center">
                <span className="text-sm text-gray-600 font-pretendard">닉네임</span>
                <span className="text-sm text-gray-800 font-pretendard">{formatValue(userInfo?.myNickname)}</span>
              </div>
              <div className="py-3 px-4 border-b border-gray-300 flex justify-between items-center">
                <span className="text-sm text-gray-600 font-pretendard">성별</span>
                <span className="text-sm text-gray-800 font-pretendard">{getGenderText(userInfo?.gender || 'unknown')}</span>
              </div>
              <div className="py-3 px-4 border-b border-gray-300 flex justify-between items-center">
                <span className="text-sm text-gray-600 font-pretendard">연령대</span>
                <span className="text-sm text-gray-800 font-pretendard">{formatValue(userInfo?.ageRange)}</span>
              </div>
              <div className="py-3 px-4 flex justify-between items-center">
                <span className="text-sm text-gray-600 font-pretendard">전화번호</span>
                <span className="text-sm text-gray-800 font-pretendard">{formatValue(userInfo?.phoneNumber)}</span>
              </div>
            </div>
          </div>

          {/* 회원 탈퇴 버튼 */}
          <div className="mt-12">
            <Button
              kind="functional"
              styleType="fill"
              tone="gray"
              fullWidth
              onClick={() => setShowDeleteModal(true)}
            >
              회원 탈퇴
            </Button>
          </div>
        </div>
      </div>
      
      <Footer />

      {/* 회원 탈퇴 모달 */}
      {showDeleteModal && (
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
                  회원 탈퇴를 진행하시겠어요?
                </div>
                <div className="text-center text-gray-500 text-sm font-pretendard font-normal leading-5">
                  탈퇴 시 모든 개인 정보와 서비스 이용 기록이<br/>
                  삭제되며, 복구할 수 없습니다.
                </div>
              </div>
              <div className="w-full flex items-center gap-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="w-24 py-4 bg-gray-200 rounded-lg flex justify-center items-center"
                >
                  <span className="text-center text-gray-700 text-sm font-pretendard font-normal leading-5">
                    닫기
                  </span>
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 py-4 bg-brand-500 rounded-lg flex justify-center items-center"
                >
                  <span className="text-center text-white text-sm font-pretendard font-semibold leading-5">
                    회원 탈퇴
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
