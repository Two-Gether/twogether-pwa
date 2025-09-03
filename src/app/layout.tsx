"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Script from 'next/script';
import { useEffect } from 'react';

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
        <QueryClientProvider client={queryClient}>
          <div className="mobile-app-container">
            {children}
          </div>
        </QueryClientProvider>
      </body>
    </html>
  );
};

export default RootLayout;
