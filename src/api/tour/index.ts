export interface Recommendation {
  id: string;
  title: string;
  location: string;
  dateRange: string;
  imageUrl: string;
  category: 'event' | 'place';
  tags?: string[];
  fullAddress?: string; // Map 페이지에서 사용할 전체 주소
  mapx?: string; // 경도
  mapy?: string; // 위도
}

// 한국관광공사 API 응답 타입
interface TourismApiItem {
  contentid: string;
  title: string;
  addr1: string;
  addr2?: string;
  eventstartdate: string;
  eventenddate: string;
  firstimage?: string;
  firstimage2?: string;
  tel?: string;
  mapx?: string;
  mapy?: string;
  areacode?: string;
  sigungucode?: string;
}

interface TourismApiResponse {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items: {
        item: TourismApiItem[];
      };
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

// 날짜 포맷팅 함수
const formatDate = (dateStr: string): string => {
  if (!dateStr || dateStr.length !== 8) return '';
  
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  
  return `${year}.${month}.${day}`;
};

// 주소를 시/도까지만 추출하는 함수
const extractCityProvince = (address: string): string => {
  if (!address) return '위치 정보 없음';
  
  // 공백으로 분리하여 첫 번째와 두 번째 부분만 사용
  const parts = address.split(' ');
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1]}`;
  }
  
  return address;
};

// 오늘 기준 시작일/종료일 계산
const getDateRange = () => {
  const today = new Date();
  const startDate = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // 한 달 후
  const endDate = new Date(today);
  endDate.setMonth(endDate.getMonth() + 1);
  const endDateStr = endDate.toISOString().slice(0, 10).replace(/-/g, '');
  
  return { startDate, endDate: endDateStr };
};

// 관광공사 API에서 데이터 가져오기
const fetchTourismData = async (): Promise<Recommendation[]> => {
  const apiKey = process.env.NEXT_PUBLIC_TOURISM_API_KEY;
  
  if (!apiKey) {
    throw new Error('TOURISM_API_KEY가 설정되지 않았습니다.');
  }
  
  const { startDate, endDate } = getDateRange();
  const url = `https://apis.data.go.kr/B551011/KorService2/searchFestival2?serviceKey=${apiKey}&numOfRows=5&pageNo=1&MobileOS=ETC&MobileApp=AppTest&_type=json&arrange=C&eventStartDate=${startDate}&eventEndDate=${endDate}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`API 요청 실패: ${response.status}`);
  }
  
  const data: TourismApiResponse = await response.json();
  
  if (data.response.header.resultCode !== '0000') {
    throw new Error(`API 오류: ${data.response.header.resultMsg}`);
  }
  
  const items = data.response.body.items.item || [];

  const normalizeImageUrl = (url?: string): string => {
    if (!url) return '';
    // 혼합 콘텐츠 방지: http로 내려오는 관광공사 이미지를 https로 강제
    if (url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    return url;
  };
  
  return items.map((item): Recommendation => {
    // firstimage가 없으면 firstimage2를 사용하고, http는 https로 바꿔줌
    const originalImageUrl = normalizeImageUrl(item.firstimage) || normalizeImageUrl(item.firstimage2);
    const imageUrl = originalImageUrl || 'https://placehold.co/230x314';
    
    return {
      id: item.contentid,
      title: item.title,
      location: extractCityProvince(item.addr1 || ''),
      dateRange: `${formatDate(item.eventstartdate)} - ${formatDate(item.eventenddate)}`,
      imageUrl: imageUrl,
      category: 'event',
      tags: ['축제', '이벤트'],
      fullAddress: item.addr1 || '', // Map 페이지에서 사용할 전체 주소
      mapx: item.mapx || '',
      mapy: item.mapy || ''
    };
  });
};

export const getRecommendations = async (): Promise<{ success: boolean; data: Recommendation[]; count: number; error?: string }> => {
  try {
    // 한국관광공사 API에서 실제 데이터 가져오기
    const recommendations = await fetchTourismData();
    
    return {
      success: true,
      data: recommendations,
      count: recommendations.length
    };
    
  } catch (error) {
    console.error('추천 데이터 로딩 실패:', error);
    
    // API 실패 시 빈 배열 반환
    return {
      success: true,
      data: [],
      count: 0,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
};
