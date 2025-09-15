import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!apiBaseUrl) {
      return NextResponse.json({ error: 'API base URL is not configured' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header is required' }, { status: 401 });
    }

    const backendResponse = await fetch(`${apiBaseUrl}/v1/member/me`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
    });

    const text = await backendResponse.text();
    const contentType = backendResponse.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    const payload = isJson ? (text ? JSON.parse(text) : {}) : { message: text };
    const nextResponse = NextResponse.json(payload, { status: backendResponse.status });

    const setCookie = backendResponse.headers.get('set-cookie');
    if (setCookie) {
      nextResponse.headers.set('set-cookie', setCookie);
    }

    return nextResponse;
  } catch (error) {
    console.error('회원 탈퇴 API 에러:', error);
    return NextResponse.json({ error: '회원 탈퇴 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!apiBaseUrl) {
      return NextResponse.json({ error: 'API base URL is not configured' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header is required' }, { status: 401 });
    }

    const backendResponse = await fetch(`${apiBaseUrl}/v1/member/me`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
      },
    });

    const text = await backendResponse.text();
    const contentType = backendResponse.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    const payload = isJson ? (text ? JSON.parse(text) : {}) : { message: text };
    const nextResponse = NextResponse.json(payload, { status: backendResponse.status });

    const setCookie = backendResponse.headers.get('set-cookie');
    if (setCookie) {
      nextResponse.headers.set('set-cookie', setCookie);
    }

    return nextResponse;
  } catch (error) {
    console.error('회원 탈퇴 API 에러:', error);
    return NextResponse.json({ error: '회원 탈퇴 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
