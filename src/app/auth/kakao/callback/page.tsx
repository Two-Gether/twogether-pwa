"use client";

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/auth/useAuth';

function KakaoCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuthStore();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    const handleKakaoCallback = async () => {
      if (error) {
        console.error('카카오 로그인 에러:', error);
        alert('카카오 로그인에 실패했습니다.');
        router.push('/login');
        return;
      }

      if (code) {
        try {
          // 카카오에서 받은 code로 서버에 토큰 요청
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/member/oauth/kakao`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
          });

          if (!response.ok) {
            throw new Error(`서버 인증 실패: ${response.status}`);
          }

          const userData = await response.json();

          // 로그인 상태 업데이트
          login({
            user: {
              memberId: userData.memberId,
              nickname: userData.myNickname,
              partnerId: userData.partnerId,
              partnerNickname: userData.partnerNickname,
              relationshipStartDate: userData.relationshipStartDate,
            },
            accessToken: userData.accessToken,
          });
          
          // 파트너 ID에 따라 페이지 이동
          if (userData.partnerId === null) {
            router.push('/connect');
          } else {
            router.push('/main');
          }
        } catch (error) {
          console.error('카카오 로그인 처리 에러:', error);
          alert('로그인 처리 중 오류가 발생했습니다.');
          router.push('/login');
        }
      } else {
        // code가 없으면 로그인 페이지로
        router.push('/login');
      }
    };

    handleKakaoCallback();
  }, [searchParams, router, login]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">카카오 로그인 처리 중...</h2>
        <p className="text-gray-600">잠시만 기다려주세요.</p>
      </div>
    </div>
  );
}

export default function KakaoCallback() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <KakaoCallbackContent />
    </Suspense>
  );
}
