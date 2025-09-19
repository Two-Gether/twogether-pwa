"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Script from 'next/script';
import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import TokenRefreshOverlay from '@/components/TokenRefreshOverlay';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const queryClient = new QueryClient();

  // 카카오맵 스크립트 동적 로딩
  useEffect(() => {
    // 안전영역 JS 보정 변수 설정 (투명/불투명 네비바 및 키보드 대응)
    const computeSafeBottom = (): number => {
      const vv = window.visualViewport;
      if (vv) {
        const bottomOverlap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
        return Math.round(bottomOverlap);
      }
      const fallbackInset = Math.max(0, document.documentElement.clientHeight - window.innerHeight);
      return Math.round(fallbackInset);
    };

    const setSafeBottomVar = () => {
      const inset = computeSafeBottom();
      document.documentElement.style.setProperty('--safe-bottom', `${inset}px`);
    };

    setSafeBottomVar();
    const onResize = () => setSafeBottomVar();
    window.visualViewport?.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('scroll', onResize);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    // Capacitor Keyboard 플러그인이 있을 때만 리스너 등록 (의존성 없이 동작)
    type KeyboardListener = { remove: () => void };
    type KeyboardPlugin = { addListener: (event: 'keyboardWillShow' | 'keyboardWillHide', cb: () => void) => KeyboardListener };
    type WindowWithCapacitor = Window & { Capacitor?: { Plugins?: { Keyboard?: KeyboardPlugin } } };
    const maybeKeyboard: KeyboardPlugin | undefined = (typeof window !== 'undefined'
      ? (window as WindowWithCapacitor).Capacitor?.Plugins?.Keyboard
      : undefined);
    const subShow: KeyboardListener = maybeKeyboard?.addListener
      ? maybeKeyboard.addListener('keyboardWillShow', setSafeBottomVar)
      : { remove: () => {} };
    const subHide: KeyboardListener = maybeKeyboard?.addListener
      ? maybeKeyboard.addListener('keyboardWillHide', setSafeBottomVar)
      : { remove: () => {} };

    const loadKakaoMap = () => {
      if (typeof window !== 'undefined' && !window.kakao) {
        // 카카오맵 SDK 로드 (autoload=false로 설정)
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_JS_KEY}&autoload=false`;
        script.async = true;
        script.onload = () => {
          // SDK 로드 후 maps 라이브러리 로드
          if (window.kakao && window.kakao.maps) {
            window.kakao.maps.load(() => {

              // services 라이브러리 로드
              const servicesScript = document.createElement('script');
              servicesScript.type = 'text/javascript';
              servicesScript.src = '//t1.daumcdn.net/mapjsapi/js/libs/services/1.0.2/services.js';
              servicesScript.async = true;
              document.head.appendChild(servicesScript);
            });
          }
        };
        script.onerror = () => {
          console.error('카카오맵 SDK 로드 실패');
        };
        document.head.appendChild(script);
      }
    };

    loadKakaoMap();

    // Android 하드웨어 뒤로가기 처리
    let removeBack: (() => void) | undefined;
    (async () => {
      try {
        if (Capacitor?.getPlatform?.() === 'android') {
          const { App } = await import('@capacitor/app');
          const sub = await App.addListener('backButton', () => {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              App.exitApp();
            }
          });
          removeBack = () => sub.remove();
        }
      } catch {
        // noop
      }
    })();

    return () => {
      window.visualViewport?.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('scroll', onResize);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      subShow.remove();
      subHide.remove();
      if (removeBack) removeBack();
    };
  }, []);

  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#FF6B6B" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Twogether" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          src="https://developers.kakao.com/sdk/js/kakao.js"
          onLoad={() => {
            if (typeof window !== 'undefined' && window.Kakao) {
              window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY as string);
            }
          }}
        />
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}&libraries=places`}
          strategy="afterInteractive"
        />
        <QueryClientProvider client={queryClient}>
          <div className="mobile-app-container pb-safe-footer">
            {children}
          </div>
          <TokenRefreshOverlay />
        </QueryClientProvider>
      </body>
    </html>
  );
};

export default RootLayout;
