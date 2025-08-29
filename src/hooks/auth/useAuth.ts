import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService, LoginRequest, RegisterRequest, SocialLoginRequest, LoginResponse } from '../../services/auth/auth';

// 로그인 훅
export const useLogin = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (credentials: LoginRequest) => authService.login(credentials),
        onSuccess: (data: LoginResponse) => {
            queryClient.setQueryData(['user'], data.user);
        },
    });
};

// 회원가입 훅
export const useRegister = () => {
    return useMutation({
        mutationFn: (credentials: RegisterRequest) => authService.register(credentials)
    });
};

// 소셜 로그인 훅
export const useSocialLogin = () => {
    return useMutation({
        mutationFn: (credentials: SocialLoginRequest) => authService.socialLogin(credentials)
    });
};
