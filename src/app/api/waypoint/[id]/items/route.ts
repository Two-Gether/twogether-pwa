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

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/waypoint/${waypointId}/items`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `웨이포인트 아이템 추가 실패: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: '웨이포인트 아이템 추가 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 웨이포인트에서 아이템 삭제 (DELETE)
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
    const body = await request.json();

    // 요청 본문에서 waypointItemIds 배열 추출
    const { waypointItemIds } = body;
    
    if (!waypointItemIds || !Array.isArray(waypointItemIds)) {
      return NextResponse.json(
        { error: 'waypointItemIds 배열이 필요합니다.' },
        { status: 400 }
      );
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/waypoint/${waypointId}/items`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ waypointItemIds }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('웨이포인트 아이템 삭제 실패:', response.status, errorText);
      return NextResponse.json(
        { error: `웨이포인트 아이템 삭제 실패: ${response.status}` },
        { status: response.status }
      );
    }

    // 응답이 비어있을 수 있으므로 안전하게 처리
    const responseText = await response.text();
    let data;
    
    if (responseText.trim()) {
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON 파싱 에러:', parseError);
        return NextResponse.json(
          { error: '서버 응답을 처리할 수 없습니다.' },
          { status: 500 }
        );
      }
    } else {
      // 빈 응답인 경우 성공으로 처리
      data = { success: true };
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('웨이포인트 아이템 삭제 에러:', error);
    return NextResponse.json(
      { error: '웨이포인트 아이템 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 웨이포인트 아이템 순서 변경 (PATCH)
export async function PATCH(
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

    // 요청 본문에서 orderedIds 배열 추출
    const { orderedIds } = body;
    
    if (!orderedIds || !Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: 'orderedIds 배열이 필요합니다.' },
        { status: 400 }
      );
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/waypoint/${waypointId}/items`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderedIds }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('웨이포인트 아이템 순서 변경 실패:', response.status, errorText);
      return NextResponse.json(
        { error: `웨이포인트 아이템 순서 변경 실패: ${response.status}` },
        { status: response.status }
      );
    }

    // 응답이 비어있을 수 있으므로 안전하게 처리
    const responseText = await response.text();
    let data;
    
    if (responseText.trim()) {
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON 파싱 에러:', parseError);
        return NextResponse.json(
          { error: '서버 응답을 처리할 수 없습니다.' },
          { status: 500 }
        );
      }
    } else {
      // 빈 응답인 경우 성공으로 처리
      data = { success: true };
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('웨이포인트 아이템 순서 변경 에러:', error);
    return NextResponse.json(
      { error: '웨이포인트 아이템 순서 변경 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
