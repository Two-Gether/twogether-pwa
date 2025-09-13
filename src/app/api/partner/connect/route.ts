import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증 토큰이 필요합니다.' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.replace('Bearer ', '');
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const body = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: '파트너 코드가 필요합니다.' },
        { status: 400 }
      );
    }

    // 실제 서버에 파트너 연결 요청
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/member/partner/connect?code=${code}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // 서버 응답 상세 로그
    console.log('서버 응답 상태:', response.status);
    console.log('서버 응답 OK:', response.ok);

    const responseData = await response.json().catch(() => ({}));
    console.log('서버 응답 데이터:', responseData);

    // HTTP 상태 코드가 400 이상이거나 응답에 에러가 있으면 실패로 처리
    if (!response.ok || response.status >= 400 || responseData.status === 400) {
      console.error('실제 서버 응답 에러:', response.status, responseData);
      
      let errorMessage = '연인 연동에 실패했어요.';
      if (responseData.message) {
        errorMessage = responseData.message;
      } else if (response.status === 400) {
        errorMessage = '파트너 코드가 유효하지 않습니다.';
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('파트너 연결 에러:', error);
    return NextResponse.json(
      { error: '연인 연동 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
