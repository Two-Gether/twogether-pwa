import { getAuthToken } from '@/auth';
import { LocationInfo } from '@/types/map';

// 웨이포인트 아이템 추가 요청 타입
export interface AddWaypointItemRequest {
  name: string;
  address: string;
  imageUrl: string;
  memo: string;
}

// 웨이포인트 아이템 추가 응답 타입
export interface AddWaypointItemResponse {
  success: boolean;
  message?: string;
  data?: {
    waypointItemId: string;
  };
}

/**
 * 장소 정보를 웨이포인트에 추가하는 서비스 함수
 * 카카오맵 API에서 받은 장소 정보를 웨이포인트에 추가
 */
export async function addLocationToWaypoint(
  waypointId: number,
  locationInfo: LocationInfo,
  memo: string = ''
): Promise<AddWaypointItemResponse> {
  try {
    // 인증 토큰 확인
    const token = getAuthToken();
    if (!token) {
      const errorMsg = '인증 토큰이 없습니다. 로그인이 필요합니다.';
      console.error(errorMsg);
      return {
        success: false,
        message: errorMsg,
      };
    }

    // 구글 Places API로 이미지 URL 가져오기
    const { getPlaceImageUrl } = await import('@/utils/googlePlacesApi');
    const imageUrl = await getPlaceImageUrl(locationInfo.placeName);

    // 웨이포인트에 아이템 추가
    const requestData = {
      name: locationInfo.placeName,
      address: locationInfo.address,
      imageUrl: imageUrl || null, // 구글 Places에서 가져온 이미지 URL
      memo: memo, // 사용자가 입력한 메모
    };
    
    console.log('웨이포인트 API 호출 시작...');
    console.log('전송할 데이터:', JSON.stringify(requestData, null, 2));
    console.log('메모 값:', memo, '타입:', typeof memo, '길이:', memo?.length);
    console.log('이미지 URL:', imageUrl);
    
    const response = await fetch(`/api/waypoint/${waypointId}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMsg = errorData.error || '웨이포인트에 장소를 추가하는데 실패했습니다.';
      return {
        success: false,
        message: errorMsg,
      };
    }

    const responseData = await response.json();
    return {
      success: true,
      message: '웨이포인트에 장소가 성공적으로 추가되었습니다!',
      data: responseData,
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    console.error('웨이포인트 아이템 추가 에러:', error);
    return {
      success: false,
      message: errorMsg,
    };
  }
}
