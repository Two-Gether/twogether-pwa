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

    // 실제 서버에 파트너 코드 요청
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/member/partner/code`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('실제 서버 응답 에러:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('에러 내용:', errorText);
      return NextResponse.json(
        { error: `파트너 코드 조회 실패: ${response.status}` },
        { status: response.status }
      );
    }

    const code = await response.text();
    console.log('받은 파트너 코드:', code);
    return new NextResponse(code, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('파트너 코드 조회 에러:', error);
    return NextResponse.json(
      { error: '파트너 코드 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
