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
  const res = await fetch(`${API_BASE_URL}/member/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // refresh token 쿠키 저장을 위해 필수
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    const text = await res.text().catch(() => '');
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
  
  const res = await fetch(`${API_BASE_URL}/member/oauth/kakao/start`, {
    method: 'GET',
    credentials: 'include',
  });
  
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  // 카카오 인증 URL 문자열 반환
  return res.text();
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

// 비밀번호 재설정 - 인증 코드 메일 발송
export async function forgotPasswordApi(email: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/member/password/forgot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
}

// 비밀번호 재설정 - 인증 코드 검증 후 resetTicket 발급
export async function verifyPasswordResetCodeApi(email: string, code: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/member/password/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, code }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  const data: { resetTicket?: string } = await res.json();
  if (!data.resetTicket) {
    throw new Error('resetTicket missing in response');
  }
  return data.resetTicket;
}

// 비밀번호 재설정 - resetTicket과 새 비밀번호로 최종 변경
export async function resetPasswordApi(email: string, resetTicket: string, newPassword: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/member/password/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, resetTicket, newPassword }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
}
