import NextAuth from "next-auth";
import Kakao from "next-auth/providers/kakao";
import { useAuthStore } from "@/hooks/auth/useAuth";

const authConfig = {
  providers: [
    Kakao({
      clientId: process.env.AUTH_KAKAO_ID!,
      clientSecret: process.env.AUTH_KAKAO_SECRET!,
    }),
  ],
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// useAuthStore에서 토큰을 가져오는 함수
export const getAuthToken = (): string | null => {
  try {
    const { accessToken } = useAuthStore.getState();
    return accessToken;
  } catch (error) {
    console.error('토큰을 가져오는데 실패했습니다:', error);
    return null;
  }
};
