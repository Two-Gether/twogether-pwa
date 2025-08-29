"use client";

import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Footer() {
  const router = useRouter();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex justify-around items-center">
        <button
          onClick={() => router.push('/main')}
          className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-brand-500"
        >
          <Image 
            src="/images/navigation/home.svg" 
            alt="Home" 
            width={24} 
            height={24} 
            className="mb-1"
          />
          <span className="text-xs">홈</span>
        </button>
        <button
          onClick={() => router.push('/calendar')}
          className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-brand-500"
        >
          <Image 
            src="/images/navigation/calendar.svg" 
            alt="Calendar" 
            width={24} 
            height={24} 
            className="mb-1"
          />
          <span className="text-xs">캘린더</span>
        </button>
        
        <button
          onClick={() => router.push('/map')}
          className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-brand-500"
        >
          <Image 
            src="/images/navigation/map.svg" 
            alt="Map" 
            width={24} 
            height={24} 
            className="mb-1"
          />
          <span className="text-xs">지도</span>
        </button>
        
        <button
          onClick={() => router.push('/profile')}
          className="flex flex-col items-center py-2 px-3 text-gray-600 hover:text-brand-500"
        >
          <Image 
            src="/images/navigation/my.svg" 
            alt="Profile" 
            width={24} 
            height={24} 
            className="mb-1"
          />
          <span className="text-xs">프로필</span>
        </button>
      </div>
    </div>
  );
}
