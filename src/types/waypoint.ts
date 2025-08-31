// 웨이포인트 관련 타입 정의
export interface Waypoint {
  id: number;
  name: string;
  placeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWaypointRequest {
  name: string;
}

export interface CreateWaypointResponse {
  waypointId: string;
}

export interface GetWaypointsResponse {
  success: boolean;
  data: Waypoint[];
  message?: string;
}
