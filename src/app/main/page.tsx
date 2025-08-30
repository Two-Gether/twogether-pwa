"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../shared/hooks/useAuth';
import Header from '../../shared/components/Header';
import Footer from '../../shared/components/Footer';
import Image from 'next/image';

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

  // 로딩 상태를 추가하여 하이드레이션 불일치 방지
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

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
    <div className="min-h-screen bg-gray-100 pb-16">
      <Header />
      
      <div className="px-6 py-6">
        {/* Main Content */}
        <div className="mb-8">
          <p className="text-base text-gray-700 mb-2 font-gowun">
            우리가 함께한 지<br />
            <span className="text-2xl text-brand-500 font-gowun font-bold">350일</span>
            <span className="text-2xl text-gray-700 font-gowun font-bold">이 지났어요!</span>
          </p>
        </div>

        <div className="flex justify-end mb-16">
          <div className="relative">
            <div className="ml-10 z-10">
              <Image 
                src="/images/illust/cats/main_cat.svg" 
                alt="Main Cat" 
                width={250} 
                height={150}
              />
            </div>
            <div className="mt-[-13px] z-0">
              <Image 
                src="/images/illust/cats/main_shadow.svg" 
                alt="Main Shadow" 
                width={300} 
                height={15}
              />
            </div>
          </div>
        </div>

        {/* Recommendation Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-4 font-gowun">
            대충 놀만한 것 추천 리스트
          </h2>

          {/* Recommendation Item */}
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-brand-500 rounded-full mr-3 flex justify-center items-center">
              <span className="text-white font-bold text-lg font-gowun">H</span>
            </div>
            <div className="flex-1">
              <p className="text-gray-700 font-medium font-gowun">
                추천 활동
              </p>
              <p className="text-gray-500 text-sm font-gowun">
                함께 즐길 수 있는 활동
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Upload Button - positioned behind footer with z-index */}
      <div className="absolute bottom-20 right-4 z-10">
        <div className="w-12 h-12 bg-brand-500 rounded-full flex justify-center items-center shadow-lg">
          <Image 
            src="/images/common/upload.svg" 
            alt="Upload" 
            className="w-6 h-6"
            width={24}
            height={24}
          />
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
