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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('실제 서버 응답 에러:', response.status, errorData);
      
      let errorMessage = '연인 연동에 실패했어요.';
      if (response.status === 400) {
        errorMessage = '잘못된 코드입니다.';
      } else if (errorData.message) {
        console.log(errorData.message);
      }
      
      return NextResponse.json(
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('파트너 연결 에러:', error);
    return NextResponse.json(
      { error: '연인 연동 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
