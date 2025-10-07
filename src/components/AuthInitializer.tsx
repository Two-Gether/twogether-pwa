"use client";

import { useEffect, useRef } from 'react';
import { useAuthStore, refreshToken } from '@/hooks/auth/useAuth';
import { usePathname } from 'next/navigation';

/**
 * 앱 초기화 시 저장된 토큰을 확인하고 자동으로 갱신하는 컴포넌트
 * - 로그인이 필요없는 페이지에서는 동작하지 않음
 * - 토큰이 저장되어 있으면 자동으로 갱신 시도
 */
export default function AuthInitializer() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const pathname = usePathname();
  const hasInitialized = useRef(false);

  // 로그인이 필요없는 페이지 목록
  const publicPaths = ['/login', '/signup', '/oauth'];

  useEffect(() => {
    // 이미 초기화했거나, 공개 페이지이거나, 토큰이 없으면 스킵
    const isPublicPath = publicPaths.some(path => pathname?.startsWith(path));
    
    if (hasInitialized.current || isPublicPath || !accessToken) {
      return;
    }

    // 토큰이 있고, 인증된 상태라면 자동으로 토큰 갱신 시도
    if (accessToken && isAuthenticated) {
      hasInitialized.current = true;
      
      // 비동기로 토큰 갱신 시도
      refreshToken().catch((error) => {
        console.error('자동 토큰 갱신 실패:', error);
      });
    }
  }, [accessToken, isAuthenticated, pathname]);

  return null; // UI를 렌더링하지 않음
}

