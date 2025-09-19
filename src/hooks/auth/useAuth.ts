import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  memberId: number;
  nickname: string;
  partnerId: number | null;
  partnerNickname: string | null;
  relationshipStartDate: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isRefreshing: boolean;
  login: (userData: { user: User; accessToken: string }) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  setRefreshing: (refreshing: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isRefreshing: false,
      
      login: (userData) => set({
        user: userData.user,
        accessToken: userData.accessToken,
        isAuthenticated: true,
        isRefreshing: false,
      }),
      
      logout: () => set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isRefreshing: false,
      }),
      
      updateUser: (user) => set((state) => ({
        ...state,
        user,
      })),
      
      setRefreshing: (refreshing) => set({ isRefreshing: refreshing }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

// 토큰 갱신 함수
export const refreshToken = async (): Promise<boolean> => {
  const { setRefreshing, login, logout } = useAuthStore.getState();
  
  try {
    setRefreshing(true);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/member/token/refresh`, {
      method: 'POST',
      credentials: 'include', // 쿠키 포함
    });

    if (response.status === 401) {
      // 갱신 실패 - 로그아웃 처리
      logout();
      alert('유저 정보 확인 실패.. 다시 로그인해주세요!');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return false;
    }

    if (!response.ok) {
      throw new Error(`토큰 갱신 실패: ${response.status}`);
    }

    const data = await response.json();
    
    // 새로운 토큰으로 로그인 상태 업데이트
    login({
      user: {
        memberId: data.memberId,
        nickname: data.myNickname,
        partnerId: data.partnerId,
        partnerNickname: data.partnerNickname,
        relationshipStartDate: data.relationshipStartDate,
      },
      accessToken: data.accessToken,
    });

    return true;
  } catch (error) {
    console.error('토큰 갱신 에러:', error);
    logout();
    alert('유저 정보 확인 실패.. 다시 로그인해주세요!');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return false;
  } finally {
    setRefreshing(false);
  }
};

// API 요청에 토큰을 자동으로 포함하고 401 시 토큰 갱신하는 함수
export const apiWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const { accessToken } = useAuthStore.getState();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    ...options.headers,
  };

  let response = await fetch(url, {
    ...options,
    headers,
  });

  // 401 에러 시 토큰 갱신 시도
  if (response.status === 401 && accessToken) {
    const refreshSuccess = await refreshToken();
    
    if (refreshSuccess) {
      // 갱신 성공 시 원래 요청 재시도
      const { accessToken: newToken } = useAuthStore.getState();
      const retryHeaders = {
        ...headers,
        Authorization: `Bearer ${newToken}`,
      };
      
      response = await fetch(url, {
        ...options,
        headers: retryHeaders,
      });
    }
  }

  return response;
};
