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

// 카카오 로그인 API
export async function startKakaoLogin(returnUrl: string = '/main'): Promise<void> {
  // 서버에서 카카오 인증 완료 후 ${FRONT_URL}/oauth/finish?otc=<OTC>&return=<returnUrl>로 리다이렉트
  const loginUrl = `${API_BASE_URL}/member/oauth/kakao/start?returnUrl=${encodeURIComponent(returnUrl)}`;
  console.log('Starting Kakao login with URL:', loginUrl);
  console.log('API_BASE_URL:', API_BASE_URL);
  window.location.href = loginUrl;
}

export interface OTCExchangeRequest {
  otc: string;
}

export interface OTCExchangeResponse {
  accessToken: string;
  memberId: number;
  name: string;
  myNickname: string | null;
  partnerId: number | null;
  partnerName: string | null;
  partnerNickname: string | null;
  relationshipStartDate: string | null;
}

export async function exchangeOTC(otc: string): Promise<OTCExchangeResponse> {
  console.log('Exchanging OTC:', otc);
  
  const res = await fetch(`${API_BASE_URL}/oauth/otc/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ otc }),
  });
  
  console.log('OTC exchange response status:', res.status);
  
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('OTC exchange error response:', text);
    throw new Error(text || `HTTP ${res.status}`);
  }
  
  // 쿠키는 브라우저가 Set-Cookie 헤더를 통해 자동으로 저장 (credentials: 'include' 필요)
  return res.json();
}



