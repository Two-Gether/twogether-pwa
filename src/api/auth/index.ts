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


