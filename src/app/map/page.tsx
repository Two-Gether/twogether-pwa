"use client";

import { useEffect, useState, useRef } from 'react';
import Footer from '@/shared/components/Footer';

declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void;
        LatLng: new (lat: number, lng: number) => unknown;
        Map: new (container: HTMLElement, options: unknown) => unknown;
        Marker: new (options: unknown) => unknown;
      };
    };
  }
}

const MapScreen = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<unknown>(null);
  const [currentPosition, setCurrentPosition] = useState<{lat: number, lng: number} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 위치 정보 가져오기
  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve(position);
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5분 캐시
        }
      );
    });
  };

  // 카카오맵 초기화
  const initKakaoMap = (lat: number, lng: number) => {
    console.log('Initializing Kakao Map with:', { lat, lng });
    console.log('Map ref:', mapRef.current);
    console.log('Kakao object:', window.kakao);
    
    if (!mapRef.current) {
      console.error('Map container not found');
      return;
    }
    
    if (!window.kakao) {
      console.error('Kakao object not available');
      return;
    }

    const options = {
      center: new window.kakao.maps.LatLng(lat, lng),
      level: 3
    };
    
    console.log('Creating Kakao Map with options:', options);
    const kakaoMap = new window.kakao.maps.Map(mapRef.current, options);
    setMap(kakaoMap);
    
    // 현재 위치 마커 추가
    const marker = new window.kakao.maps.Marker({
      position: new window.kakao.maps.LatLng(lat, lng)
    }) as { setMap: (map: unknown) => void };
    
    marker.setMap(kakaoMap);
    console.log('Kakao Map initialized successfully');
  };

  // 카카오맵 스크립트 로드
  const loadKakaoMapScript = () => {
    return new Promise<void>((resolve, reject) => {
      if (window.kakao) {
        console.log('Kakao script already loaded');
        resolve();
        return;
      }

      console.log('Loading Kakao Map script...');
      const script = document.createElement('script');
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_JS_KEY}&autoload=false`;
      script.async = true;
      
      script.onload = () => {
        console.log('Kakao script loaded, initializing maps...');
        window.kakao.maps.load(() => {
          console.log('Kakao maps initialized');
          resolve();
        });
      };
      
      script.onerror = () => {
        console.error('Failed to load Kakao Map script');
        reject(new Error('Failed to load Kakao Map script'));
      };
      
      document.head.appendChild(script);
    });
  };

  useEffect(() => {
    const initializeMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 카카오맵 스크립트 로드
        await loadKakaoMapScript();
        
        // 위치 정보 가져오기
        const position = await getCurrentLocation();
        const { latitude, longitude } = position.coords;
        
        setCurrentPosition({ lat: latitude, lng: longitude });
        
        // 카카오맵 초기화
        initKakaoMap(latitude, longitude);
        
      } catch (err) {
        console.error('Map initialization error:', err);
        setError(err instanceof Error ? err.message : '지도를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeMap();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 relative">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">지도를 불러오는 중...</h2>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 relative">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2 text-red-600">오류가 발생했습니다</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-brand-500 text-white rounded-lg"
            >
              다시 시도
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 relative">
      <div className="w-full h-[calc(100vh-80px)]">
        <div ref={mapRef} className="w-full h-full" />
      </div>
      
      <Footer />
    </div>
  );
};

export default MapScreen;
