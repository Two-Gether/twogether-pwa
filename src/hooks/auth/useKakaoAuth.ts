import { useAuthStore } from './useAuth';
import { useRouter } from 'next/navigation';

// 카카오 SDK를 통해 액세스 토큰을 받아오는 함수
const getKakaoAccessToken = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.Kakao) {
      window.Kakao.Auth.login({
        success: (authObj) => {
          resolve(authObj.access_token);
        },
        fail: (err) => {
          console.error('카카오 로그인 실패:', err);
          reject(new Error('카카오 로그인에 실패했습니다.'));
        },
      });
    } else {
      reject(new Error('카카오 SDK가 로드되지 않았습니다.'));
    }
  });
};

export const useKakaoAuth = () => {
  const { login } = useAuthStore();
  const router = useRouter();

  const kakaoLogin = async () => {
    try {
      // 카카오 SDK를 통해 액세스 토큰을 받아옴
      const accessToken = await getKakaoAccessToken();
      // 서버에 액세스 토큰을 전송하여 사용자 정보를 받아옴
      const response = await fetch(`/api/auth/kakao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken }),
      });

      if (!response.ok) {
        let errorMessage = `서버 인증에 실패했습니다. (${response.status})`;

        try {
          const errorData = await response.json();

          if (errorData.message) {
            errorMessage += `: ${errorData.message}`;
          } else if (errorData.error) {
            errorMessage += `: ${errorData.error}`;
          } else if (typeof errorData === 'string') {
            errorMessage += `: ${errorData}`;
          }
        } catch {
          const errorText = await response.text();
          errorMessage += `: ${errorText}`;
        }
        
        throw new Error(errorMessage);
      }

      const userData = await response.json();

      // 로그인 상태 업데이트 (카카오 로그인은 myNickname과 partnerNickname 사용)
      login({
        user: {
          memberId: userData.memberId,
          nickname: userData.myNickname, // 카카오 로그인은 myNickname 사용
          partnerId: userData.partnerId,
          partnerNickname: userData.partnerNickname, // 카카오 로그인은 partnerNickname 사용
          relationshipStartDate: userData.relationshipStartDate,
        },
        accessToken: userData.accessToken,
      });
      
      // 파트너 ID가 null이면 매칭 페이지로 (partnerNickname 조건 제거)
      if (userData.partnerId === null) {
        router.push('/connect');
      } else {
        router.push('/main');
      }
      
      return userData;
    } catch (error) {
      console.error('카카오 로그인 에러:', error);
      if (error instanceof Error) {
        throw new Error(`${error.message}`);
      }
      throw new Error('카카오 로그인에 실패했습니다.');
    }
  };

  return { kakaoLogin };
};
