// 웨이포인트 관련 타입 정의
export interface WaypointItem {
  name: string;
  imageUrl: string;
  memo: string;
  order: number;
}

// 서버 응답 타입
export interface WaypointServerResponse {
  waypointName: string;
  waypointSummaryResponses: WaypointItem[];
}

// 프론트엔드에서 사용할 타입
export interface Waypoint {
  id: number;
  name: string;
  imageUrl: string;
  memo: string;
  order: number;
}

export interface CreateWaypointRequest {
  name: string;
}

export interface CreateWaypointResponse {
  waypointId: string;
}

export interface GetWaypointsResponse {
  waypointName: string;
  waypointSummaryResponses: WaypointItem[];
}
