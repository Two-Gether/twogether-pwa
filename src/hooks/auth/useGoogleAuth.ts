import { useAuthStore } from './useAuth';
import { useRouter } from 'next/navigation';
import { signIn } from '@/auth';

export const useGoogleAuth = () => {
  const { login } = useAuthStore();
  const router = useRouter();

  const googleLogin = async () => {
    try {
      // 구글 로그인 구현 (실제로는 Google OAuth SDK 사용)
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        login({
          user: {
            memberId: data.memberId,
            nickname: data.nickname,
            partnerId: data.partnerId,
            partnerNickname: data.partnerNickname,
          },
          accessToken: data.accessToken,
        });
        
        // 파트너 ID나 파트너 닉네임이 null이면 매칭 페이지로
        if (data.partnerId === null || data.partnerNickname === null) {
          router.push('/connect');
        } else {
          router.push('/main');
        }
        
        return data;
      } else {
        throw new Error('구글 로그인 실패');
      }
    } catch (error) {
      throw error;
    }
  };

  return { googleLogin };
};
