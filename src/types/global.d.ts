interface KakaoAuthObj {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_token_expires_in: number;
  scope: string;
  token_type: string;
}

interface KakaoAuth {
  login: (options: {
    success: (authObj: KakaoAuthObj) => void;
    fail: (err: unknown) => void;
  }) => void;
  logout: (callback: () => void) => void;
}

interface KakaoSDK {
  Auth: KakaoAuth;
  init: (appKey: string) => void;
}

declare global {
  interface Window {
    Kakao: KakaoSDK;
  }
}

export {};
