import { NextRequest, NextResponse } from 'next/server';

// 웨이포인트 목록 조회 (GET)
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

    // fetch 요청 설정 객체 생성
    const fetchOptions = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    // 실제 서버에 웨이포인트 목록 요청
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/waypoint`, fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('웨이포인트 조회 실패:', response.status, errorText);
      return NextResponse.json(
        { error: `웨이포인트 조회 실패: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('웨이포인트 조회 에러:', error);
    return NextResponse.json(
      { error: '웨이포인트 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 웨이포인트 생성 (POST)
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

    // fetch 요청 설정 객체 생성
    const fetchOptions = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    };

    // 실제 서버에 웨이포인트 생성 요청
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/waypoint`, fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('웨이포인트 생성 실패:', response.status, errorText);
      return NextResponse.json(
        { error: `웨이포인트 생성 실패: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('웨이포인트 생성 에러:', error);
    return NextResponse.json(
      { error: '웨이포인트 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}