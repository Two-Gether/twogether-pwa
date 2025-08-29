import { useAuthStore } from './useAuth';
import { useRouter } from 'next/navigation';

export const useKakaoAuth = () => {
  const { login } = useAuthStore();
  const router = useRouter();

  const kakaoLogin = async () => {
    try {
      // 카카오 SDK 초기화 (실제 구현에서는 카카오 SDK 필요)
      if (typeof window !== 'undefined' && window.Kakao) {
        const response = await window.Kakao.Auth.login({
          success: async (authObj: any) => {
            // 카카오 토큰으로 서버에 로그인 요청
            const serverResponse = await fetch('/api/auth/kakao', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                accessToken: authObj.access_token,
              }),
            });

            if (serverResponse.ok) {
              const data = await serverResponse.json();
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
                router.push('/matching');
              } else {
                router.push('/main');
              }
              
              return data;
            } else {
              throw new Error('카카오 로그인 실패');
            }
          },
          fail: (err) => {
            throw new Error('카카오 로그인 실패: ' + err);
          },
        });
        return response;
      } else {
        throw new Error('카카오 SDK가 로드되지 않았습니다.');
      }
    } catch (error) {
      throw error;
    }
  };

  return { kakaoLogin };
};
