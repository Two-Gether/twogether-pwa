import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  memberId: number;
  nickname: string;
  partnerId: number | null;
  partnerNickname: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (userData: { user: User; accessToken: string }) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      
      login: (userData) => set({
        user: userData.user,
        accessToken: userData.accessToken,
        isAuthenticated: true,
      }),
      
      logout: () => set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
      }),
      
      updateUser: (user) => set((state) => ({
        ...state,
        user,
      })),
    }),
    {
      name: 'auth-storage', // localStorage 키 이름
      partialize: (state) => ({ 
        user: state.user, 
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

// API 요청에 토큰을 자동으로 포함하는 함수
export const apiWithAuth = async (url: string, options: RequestInit = {}) => {
  const { accessToken } = useAuthStore.getState();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
};
