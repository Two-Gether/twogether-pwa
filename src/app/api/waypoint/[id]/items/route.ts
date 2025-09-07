import { NextRequest, NextResponse } from 'next/server';

// 웨이포인트에 아이템 추가 (POST)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증 토큰이 필요합니다.' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.replace('Bearer ', '');
    const { id: waypointId } = await params;
    const body = await request.json();
    
    console.log('웨이포인트 아이템 추가 요청 받음:');
    console.log('waypointId:', waypointId);
    console.log('요청 body:', JSON.stringify(body, null, 2));

    // 실제 서버에 웨이포인트 아이템 추가 요청
    console.log('실제 서버로 전송할 데이터:', JSON.stringify(body, null, 2));
    console.log('서버 URL:', `${process.env.NEXT_PUBLIC_API_BASE_URL}/waypoint/${waypointId}/items`);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/waypoint/${waypointId}/items`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('웨이포인트 아이템 추가 실패:', response.status, errorText);
      return NextResponse.json(
        { error: `웨이포인트 아이템 추가 실패: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('웨이포인트 아이템 추가 에러:', error);
    return NextResponse.json(
      { error: '웨이포인트 아이템 추가 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
