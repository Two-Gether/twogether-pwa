"use client";

import { useRouter, usePathname } from 'next/navigation';
import { HomeIcon, MapIcon, WaypointIcon, CalendarIcon, ProfileIcon } from './icons';

export default function Footer() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/main') {
      return pathname === '/main' || pathname === '/';
    }
    return pathname === path;
  };

  const getIconClass = (path: string) => `mb-1 ${isActive(path) ? 'text-brand-500' : 'text-gray-500'}`;

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white px-4 py-2" style={{ borderTop: '1px #EEEEEE solid' }}>
      <div className="flex justify-around items-center">
        <button
          onClick={() => router.push('/main')}
          className={`flex flex-col items-center py-2 px-3 transition-colors ${
            isActive('/main') ? 'text-brand-500' : 'text-gray-600 hover:text-brand-500'
          }`}
        >
          <HomeIcon 
            width={24} 
            height={24} 
            className={getIconClass('/main')}
          />
        </button>
        
        <button
          onClick={() => router.push('/map')}
          className={`flex flex-col items-center py-2 px-3 transition-colors ${
            isActive('/map') ? 'text-brand-500' : 'text-gray-600 hover:text-brand-500'
          }`}
        >
          <MapIcon 
            width={24} 
            height={24} 
            className={getIconClass('/map')}
          />
        </button>
        
        <button
          onClick={() => router.push('/waypoint')}
          className={`flex flex-col items-center py-2 px-3 transition-colors ${
            isActive('/waypoint') ? 'text-brand-500' : 'text-gray-600 hover:text-brand-500'
          }`}
        >
          <WaypointIcon 
            width={24} 
            height={24} 
            className={getIconClass('/waypoint')}
          />
        </button>
        
        <button
          onClick={() => router.push('/calendar')}
          className={`flex flex-col items-center py-2 px-3 transition-colors ${
            isActive('/calendar') ? 'text-brand-500' : 'text-gray-600 hover:text-brand-500'
          }`}
        >
          <CalendarIcon 
            width={24} 
            height={24} 
            className={getIconClass('/calendar')}
          />
        </button>
        
        <button
          onClick={() => router.push('/profile')}
          className={`flex flex-col items-center py-2 px-3 transition-colors ${
            isActive('/profile') ? 'text-brand-500' : 'text-gray-600 hover:text-brand-500'
          }`}
        >
          <ProfileIcon 
            width={24} 
            height={24} 
            className={getIconClass('/profile')}
          />
        </button>
      </div>
    </div>
  );
}
