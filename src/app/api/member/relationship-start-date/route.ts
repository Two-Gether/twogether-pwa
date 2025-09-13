import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!apiBaseUrl) {
      return NextResponse.json({ error: 'API base URL is not configured' }, { status: 500 });
    }

    const body = await request.text();
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header is required' }, { status: 401 });
    }

    const backendResponse = await fetch(`${apiBaseUrl}/v1/member/me/relationship-start-date`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
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
  } catch (error) {
    console.error('날짜 업데이트 API 에러:', error);
    return NextResponse.json({ error: '날짜 업데이트 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
