import { useRouter } from 'next/navigation';
import { startKakaoLogin } from '@/api/auth';

export const useKakaoAuth = () => {
  const router = useRouter();

  const kakaoLogin = async (returnUrl?: string) => {
    try {
      // 새로운 카카오 로그인 플로우: 서버의 /oauth/kakao/start로 리다이렉트
      await startKakaoLogin(returnUrl || '/');
    } catch (error) {
      console.error('카카오 로그인 시작 실패:', error);
      if (error instanceof Error) {
        throw new Error(`${error.message}`);
      }
      throw new Error('카카오 로그인에 실패했습니다.');
    }
  };

  return { kakaoLogin };
};
