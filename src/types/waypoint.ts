// 웨이포인트 목록 아이템 타입 (간단한 정보)
export interface WaypointSummary {
  waypointId: number;
  name: string;
  itemCount: number;
}

// 웨이포인트 상세 아이템 타입
export interface WaypointItem {
  itemId: number;
  name: string;
  imageUrl: string;
  address: string;
  memo: string;
  order: number;
}

// 웨이포인트 상세 응답 타입
export interface WaypointDetailResponse {
  waypointName: string;
  waypointInfoResponse: WaypointItem[];
}

// 프론트엔드에서 사용할 웨이포인트 타입
export interface Waypoint {
  waypointId: number;
  name: string;
  itemCount: number;
}

// 웨이포인트 생성 요청 타입
export interface CreateWaypointRequest {
  name: string;
}

// 웨이포인트 생성 응답 타입
export interface CreateWaypointResponse {
  waypointId: string;
}

// 웨이포인트 목록 응답 타입
export interface GetWaypointsResponse {
  waypointSummaryResponses: WaypointSummary[];
}
