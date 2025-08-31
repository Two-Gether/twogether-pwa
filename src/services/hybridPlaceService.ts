import { PlaceInfo } from '@/types/kakaoMap';

/**
 * 좌표로 장소 정보 조회
 */
export const getPlaceInfo = async (lat: number, lng: number): Promise<PlaceInfo | null> => {
  if (!window.kakao || !window.kakao.maps.services) {
    console.error('카카오맵 서비스가 로드되지 않았습니다.');
    return null;
  }

  return new Promise((resolve) => {
    const geocoder = new window.kakao.maps.services.Geocoder();
    const coord = new window.kakao.maps.LatLng(lat, lng);

    geocoder.coord2Address(coord, (result: unknown[], status: string) => {
      if (status === window.kakao.maps.services.Status.OK && Array.isArray(result) && result.length > 0) {
        const addressInfo = result[0] as { address: { address_name: string }; road_address?: { address_name: string } };
        const placeInfo: PlaceInfo = {
          name: '선택된 위치',
          address: addressInfo.address.address_name,
          category: '위치',
          details: {
            road_address: addressInfo.road_address?.address_name
          }
        };
        resolve(placeInfo);
      } else {
        console.error('주소 조회 실패:', status);
        resolve(null);
      }
    });
  });
};

/**
 * DB 저장용 기본 정보 추출
 */
export const extractBasicInfoForDB = (placeInfo: PlaceInfo) => {
  return {
    name: placeInfo.name,
    address: placeInfo.address,
    category: placeInfo.category,
    phone: placeInfo.details.phone || null,
    url: placeInfo.details.url || null,
    road_address: placeInfo.details.road_address || null
  };
};
