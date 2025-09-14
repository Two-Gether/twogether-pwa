import { NextRequest, NextResponse } from 'next/server';

// 하이라이트 조회 (GET)
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
    const address = searchParams.get('address');
    
    if (!address) {
      return NextResponse.json(
        { error: 'address 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }
    
    console.log('하이라이트 조회 요청:', { address });
    
    // 실제 서버에 하이라이트 조회 요청
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/place?address=${encodeURIComponent(address)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log('하이라이트를 찾을 수 없습니다:', address);
      return NextResponse.json([]);
    }

    const data = await response.json();
    console.log('받은 하이라이트 데이터:', data);
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('하이라이트 조회 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 하이라이트 등록 (POST)
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
    const formData = await request.formData();
    
    // multipart/form-data에서 데이터 추출
    const metaString = formData.get('meta') as string;
    const imageFile = formData.get('image') as File;
    
    if (!metaString || !imageFile) {
      return NextResponse.json(
        { error: 'meta 또는 image가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 실제 서버에 하이라이트 등록 요청
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/place`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('서버 에러 응답:', errorText);
      return NextResponse.json(
        { error: '하이라이트 등록에 실패했습니다.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('하이라이트 등록 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
