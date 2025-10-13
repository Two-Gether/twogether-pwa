import { getAuthToken } from '@/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  memberId: number;
  myNickname: string | null;
  partnerId: number | null;
  partnerNickname: string | null;
  relationshipStartDate: string | null;
  accessToken: string;
}

export async function loginApi(payload: LoginRequest): Promise<LoginResponse> {
  console.log('API_BASE_URL:', API_BASE_URL);
  console.log('Login payload:', payload);
  
  const res = await fetch(`${API_BASE_URL}/member/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // refresh token 쿠키 저장을 위해 필수
    body: JSON.stringify(payload),
  });
  
  console.log('Response status:', res.status);
  console.log('Response headers:', res.headers);
  
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('Login error response:', text);
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function logoutApi(): Promise<void> {
  const token = getAuthToken();
  await fetch(`${API_BASE_URL}/member/logout`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
}

export async function refreshTokenApi(): Promise<{ accessToken: string }> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/member/token/refresh`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include', // refresh token 쿠키 전송을 위해 필수
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

// 카카오 로그인 응답 인터페이스
export interface KakaoLoginResponse {
  accessToken: string;
  memberId: number;
  name: string;
  myNickname: string | null;
  partnerId: number | null;
  partnerName: string | null;
  partnerNickname: string | null;
  relationshipStartDate: string | null;
}

// 카카오 로그인 - 인증 URL 받기
export async function getKakaoAuthUrl(): Promise<string> {
  console.log('카카오 인증 URL 요청...');
  
  const res = await fetch(`${API_BASE_URL}/member/oauth/kakao/start`, {
    method: 'GET',
    credentials: 'include',
  });
  
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('카카오 URL 요청 실패:', text);
    throw new Error(text || `HTTP ${res.status}`);
  }
  
  // 카카오 인증 URL 문자열 반환
  const kakaoAuthUrl = await res.text();
  console.log('카카오 인증 URL 받음:', kakaoAuthUrl);
  
  return kakaoAuthUrl;
}

// 카카오 로그인 완료 후 사용자 정보 가져오기 (폴링)
export async function checkKakaoLoginStatus(): Promise<KakaoLoginResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/member/oauth/kakao/status`, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (res.ok) {
      const userData: KakaoLoginResponse = await res.json();
      return userData;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}



