import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!apiBaseUrl) {
      return NextResponse.json({ error: 'API base URL is not configured' }, { status: 500 });
    }

    const body = await request.text();

    const backendResponse = await fetch(`${apiBaseUrl}/v1/member/oauth/kakao`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body,
    });

    const text = await backendResponse.text();
    const contentType = backendResponse.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    const payload = isJson ? (text ? JSON.parse(text) : {}) : { message: text };
    const response = NextResponse.json(payload, { status: backendResponse.status });

    const setCookie = backendResponse.headers.get('set-cookie');
    if (setCookie) {
      response.headers.set('set-cookie', setCookie);
    }

    return response;
  } catch {
    return NextResponse.json({ error: '카카오 로그인 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
