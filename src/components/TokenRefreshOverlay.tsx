"use client";

import { useAuthStore } from '@/hooks/auth/useAuth';

export default function TokenRefreshOverlay() {
  const { isRefreshing } = useAuthStore();

  if (!isRefreshing) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm mx-4 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              앱 상태 초기화 중...
            </h3>
            <p className="text-sm text-gray-600">
              잠시만 기다려주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
