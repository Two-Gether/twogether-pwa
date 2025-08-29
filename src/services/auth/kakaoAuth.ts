export const kakaoAuthService = {
    // 카카오 로그인 실행
    login: async () => {
        try {
            // 카카오 SDK를 통해 액세스 토큰을 받아옴
            const accessToken = await getKakaoAccessToken();

            // 서버에 액세스 토큰을 전송하여 사용자 정보를 받아옴
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/member/oauth/kakao`, {
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
                } catch (e) {

                    const errorText = await response.text();
                    errorMessage += `: ${errorText}`;
                }
                
                throw new Error(errorMessage);
            }

            const userData = await response.json();
            return userData;
        } catch (error) {
            console.error('카카오 로그인 에러:', error);
            if (error instanceof Error) {
                throw new Error(`${error.message}`);
            }
            throw new Error('카카오 로그인에 실패했습니다.');
        }
    },
};

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