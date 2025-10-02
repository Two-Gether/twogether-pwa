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
  const res = await fetch(`${API_BASE_URL}/v1/member/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  await fetch(`${API_BASE_URL}/v1/member/logout`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function refreshTokenApi(): Promise<{ accessToken: string }> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/v1/member/token/refresh`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

// 새로운 카카오 로그인 API들
export async function startKakaoLogin(returnUrl: string = '/'): Promise<void> {
  // GET /oauth/kakao/start 호출하여 카카오 인증 페이지로 리다이렉트
  // 서버에서 카카오 인증 완료 후 ${FRONT_URL}/auth/finish?otc=<OTC>&returnUrl=<returnUrl>로 리다이렉트
  window.location.href = `${API_BASE_URL}/oauth/kakao/start?returnUrl=${encodeURIComponent(returnUrl)}`;
}

export async function exchangeOtcApi(otc: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}/oauth/otc/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ otc }),
    credentials: 'include',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}


