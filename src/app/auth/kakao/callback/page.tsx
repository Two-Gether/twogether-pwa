"use client";

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function KakaoCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      // 에러 발생 시 부모 창에 에러 메시지 전송
      window.opener?.postMessage(
        { type: 'KAKAO_AUTH_ERROR', error },
        window.location.origin
      );
    } else if (code) {
      // 성공 시 부모 창에 code 전송
      window.opener?.postMessage(
        { type: 'KAKAO_AUTH_SUCCESS', code },
        window.location.origin
      );
    }

    // 창 닫기
    window.close();
  }, [searchParams]);

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
