// 사용자 관련 API 서비스

import { apiGet, apiPut, apiDelete } from './api';

// 타입 정의
export interface UserProfile {
    id: string;
    email: string;
    name: string;
    phone?: string;
    profileImage?: string;
    birthDate?: string;
    gender?: 'male' | 'female' | 'other';
    createdAt: string;
    updatedAt: string;
}

export interface UpdateUserProfileRequest {
    name?: string;
    phone?: string;
    profileImage?: string;
    birthDate?: string;
    gender?: 'male' | 'female' | 'other';
}

export interface GetUserProfileRequest {
    userId: string;
}

export interface SearchUsersRequest {
    searchTerm: string;
}

export interface UserSettings {
    notifications: {
        push: boolean;
        email: boolean;
        sms: boolean;
    };
    privacy: {
        profileVisibility: 'public' | 'private' | 'friends';
        locationSharing: boolean;
    };
    theme: 'light' | 'dark' | 'auto';
    language: 'ko' | 'en';
}

// userService 객체로 모든 메서드를 묶어서 내보냄
export const userService = {
    // 특정 사용자 프로필 조회
    getUserProfile: async (request: GetUserProfileRequest): Promise<UserProfile> => {
        return apiGet<UserProfile>(`/user/profile/${request.userId}`);
    },

    // 현재 사용자 프로필 조회
    getCurrentUserProfile: async (): Promise<UserProfile> => {
        return apiGet<UserProfile>('/user/profile');
    },

    // 사용자 프로필 업데이트
    updateUserProfile: async (profileData: UpdateUserProfileRequest): Promise<UserProfile> => {
        return apiPut<UserProfile>('/user/profile', profileData);
    },

    // 사용자 검색
    searchUsers: async (request: SearchUsersRequest): Promise<UserProfile[]> => {
        return apiGet<UserProfile[]>(`/users/search?q=${encodeURIComponent(request.searchTerm)}`);
    },

    // 계정 삭제
    deleteAccount: async (): Promise<void> => {
        return apiDelete<void>('/user/account');
    },

    // 사용자 설정 조회
    getUserSettings: async (): Promise<UserSettings> => {
        return apiGet<UserSettings>('/user/settings');
    },

    // 사용자 설정 업데이트
    updateUserSettings: async (settings: Partial<UserSettings>): Promise<UserSettings> => {
        return apiPut<UserSettings>('/user/settings', settings);
    },
}; 