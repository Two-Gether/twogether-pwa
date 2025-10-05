"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { exchangeOTC } from '@/api/auth';
import { useAuthStore } from '@/hooks/auth/useAuth';

export default function OAuthFinishPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleOTCExchange = async () => {
      try {
        // URL 파라미터에서 OTC와 return URL 추출
        const otc = searchParams.get('otc');
        const returnUrl = searchParams.get('return') || '/main';

        console.log('카카오 로그인 OTC 받음:', otc);
        console.log('Return URL:', returnUrl);

        // OTC가 없으면 에러 처리
        if (!otc) {
          throw new Error('카카오 로그인에 실패하였습니다.');
        }

        // OTC 교환 API 호출
        const response = await exchangeOTC(otc);
        console.log('OTC 교환 성공:', response);

        // Auth store에 토큰 및 사용자 정보 저장
        login({
          user: {
            memberId: response.memberId,
            nickname: response.myNickname || '',
            partnerId: response.partnerId,
            partnerNickname: response.partnerNickname,
            relationshipStartDate: response.relationshipStartDate,
          },
          accessToken: response.accessToken,
        });

        setStatus('success');

        // 잠시 후 리다이렉트
        setTimeout(() => {
          // return 파라미터의 경로만 추출 (도메인 제거)
          const path = returnUrl.startsWith('http') 
            ? new URL(returnUrl).pathname 
            : returnUrl;
          
          console.log('리다이렉트:', path);
          router.push(path);
        }, 1500);

      } catch (error) {
        console.error('카카오 로그인 완료 처리 중 오류:', error);
        setErrorMessage(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
        setStatus('error');
      }
    };

    handleOTCExchange();
  }, [searchParams, login, router]);

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            로그인 실패
          </h2>
          <p className="text-gray-600 mb-6">
            {errorMessage}
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-brand-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-brand-600 transition-colors"
          >
            로그인 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg p-8 max-w-md w-full text-center shadow-lg">
        {/* 로딩 애니메이션 */}
        <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          카카오 로그인 성공!
        </h2>
        <p className="text-gray-600 mb-4">
          회원 정보를 받아오는 중입니다...
        </p>
        
        {status === 'success' && (
          <div className="flex items-center justify-center text-green-600 mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">완료!</span>
          </div>
        )}
        
        <div className="text-sm text-gray-500">
          잠시만 기다려주세요
        </div>
      </div>
    </div>
  );
}
