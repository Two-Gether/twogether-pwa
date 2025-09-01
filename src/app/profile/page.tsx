"use client";

import Header from '@/components/ui/Header';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/hooks/auth/useAuth';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export default function MyPage() {
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  const handleLogout = useCallback(() => {
    logout();
    router.replace('/login');
  }, [logout, router]);

  return (
    <div className="w-full h-screen bg-white flex flex-col">
      <Header title="마이" showBackButton={false} />

      <main className="flex-1 px-5 pt-6 flex items-center justify-center">
        <div className="w-full max-w-md">
          <Button
            kind="functional"
            styleType="fill"
            tone="brand"
            fullWidth
            onClick={handleLogout}
          >
            로그아웃
          </Button>
        </div>
      </main>
    </div>
  );
}
