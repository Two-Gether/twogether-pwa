import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, GetUserProfileRequest, UpdateUserProfileRequest, UserProfile } from '../../services/user';

// 사용자 프로필 조회 훅
export const useUserProfile = (userId: string) => {
    return useQuery({
        queryKey: ['user', 'profile', userId],
        queryFn: () => userService.getUserProfile({ userId }),
        enabled: !!userId, // userId가 있을 때만 쿼리 실행
        staleTime: 5 * 60 * 1000, // 5분
    });
};

// 현재 사용자 프로필 조회 훅
export const useCurrentUserProfile = () => {
    return useQuery({
        queryKey: ['user', 'profile', 'me'],
        queryFn: () => userService.getCurrentUserProfile(),
        staleTime: 5 * 60 * 1000, // 5분
    });
};

// 사용자 프로필 업데이트 훅
export const useUpdateUserProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UpdateUserProfileRequest) => userService.updateUserProfile(data),
        onSuccess: (updatedUser: UserProfile) => {
            // 업데이트된 사용자 정보로 캐시 갱신
            queryClient.setQueryData(['user', 'profile', 'me'], updatedUser);
            queryClient.setQueryData(['user', 'profile', updatedUser.id], updatedUser);

            // 사용자 목록 캐시도 무효화하여 최신 정보로 갱신
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: (error) => {
            console.error('프로필 업데이트 실패:', error);
        },
    });
};

// 사용자 검색 훅
export const useSearchUsers = (searchTerm: string) => {
    return useQuery({
        queryKey: ['users', 'search', searchTerm],
        queryFn: () => userService.searchUsers({ searchTerm }),
        enabled: !!searchTerm && searchTerm.length >= 2, // 2글자 이상일 때만 검색
        staleTime: 2 * 60 * 1000, // 2분
    });
}; 