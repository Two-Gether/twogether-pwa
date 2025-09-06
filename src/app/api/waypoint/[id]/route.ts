import { NextRequest, NextResponse } from 'next/server';

// 웨이포인트 상세 조회 (GET)
export async function GET(
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

    // 실제 서버에 웨이포인트 상세 조회 요청
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/waypoint/${waypointId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('웨이포인트 상세 조회 실패:', response.status, errorText);
      return NextResponse.json(
        { error: `웨이포인트 상세 조회 실패: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('웨이포인트 상세 조회 에러:', error);
    return NextResponse.json(
      { error: '웨이포인트 상세 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 웨이포인트 삭제 (DELETE)
export async function DELETE(
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

    // 실제 서버에 웨이포인트 삭제 요청
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/waypoint/${waypointId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('웨이포인트 삭제 실패:', response.status, errorText);
      return NextResponse.json(
        { error: `웨이포인트 삭제 실패: ${response.status}` },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('웨이포인트 삭제 에러:', error);
    return NextResponse.json(
      { error: '웨이포인트 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
