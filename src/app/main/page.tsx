"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../shared/hooks/useAuth';
import Footer from '../../shared/components/Footer';

export default function MainPage() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // 파트너 ID가 null인 경우 매칭 페이지로 리다이렉트
    if (user && user.partnerId === null) {
      router.push('/matching');
    }
  }, [isAuthenticated, user, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

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
    <div className="min-h-screen pb-16">
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-gray-700">메인 페이지</h1>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                로그아웃
              </button>
            </div>
            
            <div className="bg-sub-100 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">사용자 정보</h2>
              <div className="space-y-2">
                <p><strong>닉네임:</strong> {user?.nickname}</p>
                <p><strong>회원 ID:</strong> {user?.memberId}</p>
                <p><strong>파트너 ID:</strong> {user?.partnerId || '없음'}</p>
                <p><strong>파트너 닉네임:</strong> {user?.partnerNickname || '없음'}</p>
                <p><strong>토큰:</strong> <span className="text-xs break-all text-gray-700">{accessToken?.substring(0, 50)}...</span></p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">기능 메뉴</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                캘린더
              </button>
              <button className="p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                지도
              </button>
              <button className="p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                프로필
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
