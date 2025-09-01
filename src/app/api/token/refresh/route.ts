import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!apiBaseUrl) {
      return NextResponse.json({ error: 'API base URL is not configured' }, { status: 500 });
    }

    const cookieHeader = request.headers.get('cookie') || '';

    const backendResponse = await fetch(`${apiBaseUrl}/v1/member/token/refresh`, {
      method: 'POST',
      headers: {
        // 백엔드가 쿠키로 RefreshToken 검증하므로 클라이언트 쿠키를 그대로 전달
        cookie: cookieHeader,
        'content-type': 'application/json',
      },
      // 보통 본문은 필요 없지만, 호환성 위해 빈 본문 유지
      body: undefined,
    });

    const text = await backendResponse.text();
    const contentType = backendResponse.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    // 응답 본문 구성
    const payload = isJson ? JSON.parse(text || '{}') : { message: text };
    const response = NextResponse.json(payload, { status: backendResponse.status });

    // Set-Cookie 전달 (재발급된 토큰 쿠키가 있다면)
    const setCookie = backendResponse.headers.get('set-cookie');
    if (setCookie) {
      response.headers.set('set-cookie', setCookie);
    }

    return response;
  } catch (error) {
    return NextResponse.json({ error: '토큰 재발급 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
