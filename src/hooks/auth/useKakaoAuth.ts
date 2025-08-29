import { useMutation } from '@tanstack/react-query';
import { kakaoAuthService } from '../../services/auth/kakaoAuth';

// 카카오 로그인 훅
export const useKakaoLogin = () => {
    return useMutation({
        mutationFn: () => kakaoAuthService.login()
    });
};
