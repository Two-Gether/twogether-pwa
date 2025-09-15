import { NextRequest, NextResponse } from 'next/server';

// 일정 목록 조회 (GET) - POST로 처리하되 action으로 구분
export async function GET(request: NextRequest) {
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate와 endDate 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }

    // 실제 서버에 일정 조회 요청
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/diary?startDate=${startDate}&endDate=${endDate}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log('일정을 찾을 수 없습니다:', { startDate, endDate });
        return NextResponse.json([]);
      }
      throw new Error(`일정 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    console.log('받은 일정 데이터:', data);
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('일정 조회 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 일정 생성 (POST)
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
    const body = await request.json();
    
    console.log('일정 생성 요청:', body);
    
    // 실제 서버에 일정 생성 요청
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/diary`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('일정 생성 실패:', response.status, errorText);
      return NextResponse.json(
        { error: '일정 생성에 실패했습니다.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('일정 생성 성공:', data);
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('일정 생성 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
