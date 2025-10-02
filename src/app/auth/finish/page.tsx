"use client";

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/auth/useAuth';
import { exchangeOtcApi } from '@/api/auth';

function AuthFinishContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuthStore();

  useEffect(() => {
    const handleAuthFinish = async () => {
      const otc = searchParams.get('otc');
      const returnUrl = searchParams.get('returnUrl') || '/';

      if (!otc) {
        console.error('otc가 없습니다.');
        alert('로그인 처리 중 오류가 발생했습니다.');
        router.push('/login');
        return;
      }

      try {
        // otc를 사용하여 토큰 교환
        const userData = await exchangeOtcApi(otc);
        
        // 로그인 상태 업데이트
        login({
          user: {
            memberId: userData.memberId,
            nickname: userData.myNickname ?? "",
            partnerId: userData.partnerId,
            partnerNickname: userData.partnerNickname ?? "",
            relationshipStartDate: userData.relationshipStartDate,
          },
          accessToken: userData.accessToken,
        });
        
        // returnUrl이 있으면 해당 경로로, 없으면 파트너 상태에 따라 이동
        if (returnUrl && returnUrl !== '/') {
          router.replace(returnUrl);
        } else {
          router.replace(userData.partnerId === null ? '/connect' : '/main');
        }
      } catch (e) {
        console.error('otc 교환 실패:', e);
        alert('로그인 처리 중 오류가 발생했습니다.');
        router.replace('/login');
      }
    };

    handleAuthFinish();
  }, [searchParams, router, login]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">로그인 처리 중...</h2>
        <p className="text-gray-600">잠시만 기다려주세요.</p>
      </div>
    </div>
  );
}

export default function AuthFinish() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthFinishContent />
    </Suspense>
  );
}
